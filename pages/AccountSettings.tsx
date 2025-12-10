import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, signOut, auth, updateProfile } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const loadUserData = async () => {
      try {
        // Load from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.displayName || currentUser.displayName || '');
          setEmail(data.email || currentUser.email || '');
          setCurrency(data.currency || 'USD');
          setNotifications(data.notifications !== undefined ? data.notifications : true);
          setPhotoURL(data.photoURL || currentUser.photoURL || null);
        } else {
          // Fallback to auth profile
          setName(currentUser.displayName || '');
          setEmail(currentUser.email || '');
          setCurrency('USD');
          setNotifications(true);
          setPhotoURL(currentUser.photoURL || null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setName(currentUser.displayName || '');
        setEmail(currentUser.email || '');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: name,
        email: email,
        currency: currency,
        notifications: notifications,
        photoURL: photoURL
      });

      // Update Auth profile
      const updateData: { displayName?: string; photoURL?: string | null } = {};
      if (name !== currentUser.displayName) {
        updateData.displayName = name;
      }
      if (photoURL !== currentUser.photoURL) {
        updateData.photoURL = photoURL;
      }
      if (Object.keys(updateData).length > 0) {
        await updateProfile(currentUser, updateData);
      }

      showToast('Perfil guardado exitosamente', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error al guardar el perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Error al cerrar sesión', 'error');
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 150; // Tamaño máximo para avatar (reducido para base64 más pequeño)
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con mayor compresión (0.7 para reducir tamaño)
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser) {
      showToast('Debes estar autenticado para subir imágenes', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      // Comprimir y convertir a base64
      const base64Image = await compressImage(file);

      // Verificar tamaño (Firestore tiene límite de 1MB por campo, pero mantenemos más bajo para mejor rendimiento)
      if (base64Image.length > 500000) {
        showToast('La imagen es demasiado grande. Intenta con una imagen más pequeña.', 'error');
        setUploadingImage(false);
        return;
      }

      // Update state
      setPhotoURL(base64Image);

      // Update Firestore only (Firebase Auth tiene límite de longitud para photoURL)
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: base64Image
      });
      
      // No actualizamos Auth profile porque tiene límite de longitud
      // El avatar se carga desde Firestore

      showToast('Imagen actualizada exitosamente', 'success');
      setShowImageMenu(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showToast('Error al procesar la imagen', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!currentUser || !photoURL) return;

    setUploadingImage(true);
    try {
      // Update state
      setPhotoURL(null);

      // Update Firestore only
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: null
      });
      
      // No actualizamos Auth profile

      showToast('Imagen eliminada exitosamente', 'success');
      setShowImageMenu(false);
    } catch (error: any) {
      console.error('Error deleting image:', error);
      showToast('Error al eliminar la imagen', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Por favor selecciona una imagen', 'error');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen debe ser menor a 5MB', 'error');
        return;
      }
      handleImageUpload(file);
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-zinc-200 dark:border-white/10">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Configuración de Cuenta</h1>
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="flex w-12 items-center justify-end disabled:opacity-50"
        >
          <p className="text-primary text-base font-bold shrink-0">{saving ? 'Guardando...' : 'Guardar'}</p>
        </button>
      </header>

      <main className="flex flex-col flex-1 p-4 gap-8">
        {/* Profile Header */}
        <section className="flex w-full flex-col gap-4 items-center pt-6">
          <div className="flex gap-4 flex-col items-center">
            <div className="relative">
              {photoURL ? (
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 shadow-xl" 
                  style={{ backgroundImage: `url("${photoURL}")` }}
                ></div>
              ) : (
                <div className="flex items-center justify-center aspect-square rounded-full min-h-32 w-32 shadow-xl bg-slate-200 dark:bg-slate-700">
                  <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500">account_circle</span>
                </div>
              )}
              <button 
                onClick={() => setShowImageMenu(!showImageMenu)}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 flex items-center justify-center size-9 bg-primary rounded-full border-2 border-background-light dark:border-background-dark disabled:opacity-50"
              >
                {uploadingImage ? (
                  <span className="material-symbols-outlined text-lg text-slate-900 animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-lg text-slate-900">edit</span>
                )}
              </button>
              
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Image menu */}
              {showImageMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowImageMenu(false)}
                  ></div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[180px] overflow-hidden">
                  <button
                    onClick={handleTakePhoto}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">camera_alt</span>
                    <span>Tomar foto</span>
                  </button>
                  <button
                    onClick={handleChooseFromGallery}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">photo_library</span>
                    <span>Elegir de galería</span>
                  </button>
                  {photoURL && (
                    <button
                      onClick={handleImageDelete}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      <span>Eliminar foto</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowImageMenu(false)}
                    className="w-full px-4 py-3 text-left text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                    <span>Cancelar</span>
                  </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight text-center">
                {loading ? 'Cargando...' : name || 'Usuario'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal text-center">
                {loading ? '...' : email || 'Sin email'}
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap items-end gap-4">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-slate-900 dark:text-white text-base font-medium pb-2">Nombre</p>
              <input 
                className="flex w-full min-w-0 flex-1 rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800/20 focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/20 h-14 placeholder:text-slate-400 px-4 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Nombre completo"
              />
            </label>
          </div>
          <div className="flex w-full flex-wrap items-end gap-4">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-slate-900 dark:text-white text-base font-medium pb-2">Email</p>
              <input 
                 className="flex w-full min-w-0 flex-1 rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800/20 focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/20 h-14 placeholder:text-slate-400 px-4 text-base"
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 disabled={loading}
                 placeholder="correo@ejemplo.com"
              />
            </label>
          </div>
          <div className="flex w-full flex-col">
            <p className="text-slate-900 dark:text-white text-base font-medium pb-2">Moneda por defecto</p>
            <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-200 dark:bg-[#29382f] p-1">
              <button 
                onClick={() => setCurrency('USD')}
                className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${currency === 'USD' ? 'bg-primary/20 text-primary' : 'text-zinc-500 dark:text-[#9eb7a8]'}`}
              >
                USD
              </button>
              <button 
                onClick={() => setCurrency('ARS')}
                className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${currency === 'ARS' ? 'bg-primary/20 text-primary' : 'text-zinc-500 dark:text-[#9eb7a8]'}`}
              >
                ARS
              </button>
            </div>
          </div>
        </div>

        <section>
          <div className="flex flex-col gap-2 rounded-xl bg-white dark:bg-slate-800/20 p-2 shadow-sm border border-slate-100 dark:border-none">
            <div className="flex items-center gap-4 min-h-[72px] justify-between p-2">
              <div className="flex items-center gap-4">
                <div className="text-slate-900 dark:text-white flex items-center justify-center rounded-lg bg-primary/20 shrink-0 size-12">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-slate-900 dark:text-white text-base font-medium line-clamp-1">Notificaciones Push</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal line-clamp-2">Recibe alertas de próximos vencimientos.</p>
                </div>
              </div>
              <div className="shrink-0">
                <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 dark:bg-slate-700 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary transition-all">
                  <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                  <input 
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    disabled={loading}
                    className="invisible absolute" 
                  />
                </label>
              </div>
            </div>
          </div>
        </section>
        
        <Link to="/cards" className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-none">
             <span className="text-base font-medium text-slate-900 dark:text-white">Tarjetas de Crédito</span>
             <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </Link>

        <div className="flex-grow"></div>

        <section className="flex flex-col gap-4 pb-4">
          <button 
            onClick={handleSignOut}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-base font-medium text-red-500 transition-colors h-12 rounded-lg hover:bg-red-500/10 active:bg-red-500/20"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
          <button className="flex items-center justify-center w-full gap-2 px-4 py-2 text-base font-medium text-slate-500 dark:text-slate-400 transition-colors h-12 rounded-lg hover:bg-slate-500/10">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Ayuda y Soporte</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default AccountSettings;
