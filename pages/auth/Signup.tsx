
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, updateProfile, doc, setDoc, collection, addDoc } from '../../firebase';
import { MOCK_CATEGORIES } from '../../constants';

// Función para inicializar categorías predefinidas para un nuevo usuario
const initializeDefaultCategories = async (userId: string) => {
  const defaultCategories = MOCK_CATEGORIES.map(cat => {
    // Mapear colores de string a códigos hex
    const colorMap: { [key: string]: string } = {
      'orange': '#e0a038',
      'blue': '#389ce0',
      'purple': '#9038e0',
      'pink': '#e0388f',
      'red': '#ef4444',
      'green': '#10b981',
      'indigo': '#6366f1',
      'cyan': '#06b6d4',
      'teal': '#14b8a6',
      'rose': '#f43f5e',
      'amber': '#f59e0b',
      'emerald': '#10b981',
      'slate': '#64748b',
      'lime': '#84cc16',
      'fuchsia': '#d946ef'
    };
    
    const colorHex = colorMap[cat.color] || '#38e07b'; // default
    
    return {
      name: cat.name,
      icon: cat.icon,
      color: colorHex,
      subcategories: cat.subcategories || [],
      userId: userId
    };
  });

  // Crear todas las categorías en paralelo
  const promises = defaultCategories.map(category => 
    addDoc(collection(db, 'categories'), category)
  );

  await Promise.all(promises);
};

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            
            // 1. Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Auth Profile (Display Name)
            // This ensures user.displayName is available immediately in the app
            await updateProfile(user, {
                displayName: name
            });

            // 3. Create User Document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: name,
                email: email,
                createdAt: new Date().toISOString(),
                currency: 'USD' // Default currency
            });

            // 4. Initialize default categories for the new user
            await initializeDefaultCategories(user.uid);

            // 5. Redirect to Dashboard
            navigate('/');

        } catch (err: any) {
            console.error("Signup Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado.');
            } else if (err.code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else if (err.code === 'auth/invalid-email') {
                setError('El correo electrónico no es válido.');
            } else {
                setError('Error al crear la cuenta. Inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <div className="flex items-center p-4 pb-2 justify-between">
            <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-start">
                <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
            </button>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Crear Cuenta</h2>
            <div className="size-12 shrink-0"></div>
        </div>
        <div className="flex-grow px-4">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-left pb-2 pt-6">Crear Cuenta</h1>
            <p className="text-slate-600 dark:text-white/70 text-base font-normal pb-6">Únete para empezar a controlar tus finanzas.</p>
            
            {error && (
                <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300 text-center">
                    {error}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-slate-900 dark:text-white text-base font-medium pb-2">Nombre completo</p>
                        <div className="flex w-full flex-1 items-stretch rounded-xl">
                            <div className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] items-center justify-center pl-[15px] h-14 rounded-l-xl border-r-0">
                                <span className="material-symbols-outlined text-2xl">person</span>
                            </div>
                            <input 
                                className="flex w-full min-w-0 flex-1 rounded-r-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-[#1c2620] focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] h-14 placeholder:text-slate-400 dark:placeholder:text-[#9eb7a8] pl-2 text-base" 
                                placeholder="Tu nombre completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </label>
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-slate-900 dark:text-white text-base font-medium pb-2">Correo electrónico</p>
                        <div className="flex w-full flex-1 items-stretch rounded-xl">
                            <div className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] items-center justify-center pl-[15px] h-14 rounded-l-xl border-r-0">
                                <span className="material-symbols-outlined text-2xl">mail</span>
                            </div>
                            <input 
                                className="flex w-full min-w-0 flex-1 rounded-r-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-[#1c2620] focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] h-14 placeholder:text-slate-400 dark:placeholder:text-[#9eb7a8] pl-2 text-base" 
                                placeholder="tu@correo.com" 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </label>
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-slate-900 dark:text-white text-base font-medium pb-2">Contraseña</p>
                        <div className="flex w-full flex-1 items-stretch rounded-xl">
                            <div className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] items-center justify-center pl-[15px] h-14 rounded-l-xl border-r-0">
                                <span className="material-symbols-outlined text-2xl">lock</span>
                            </div>
                            <input 
                                className="flex w-full min-w-0 flex-1 text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-[#1c2620] focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] h-14 placeholder:text-slate-400 dark:placeholder:text-[#9eb7a8] pl-2 text-base border-r-0" 
                                placeholder="Crea una contraseña" 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-[#3d5245] bg-white dark:bg-[#1c2620] items-center justify-center pr-[15px] h-14 rounded-r-xl border-l-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    {showPassword ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        </div>
                    </label>
                </div>
                <div className="sticky bottom-0 w-full p-4 pt-6 pb-8">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-background-dark shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                    <p className="text-center text-sm font-normal text-slate-500 dark:text-white/70 pt-4">
                        ¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-primary hover:underline">Inicia Sesión</Link>
                    </p>
                </div>
            </form>
        </div>
    </div>
  );
};

export default Signup;
