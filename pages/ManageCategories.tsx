import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Category } from '../types';

const ManageCategories: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ category: Category; index: number; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('category');
  const [newCategoryColor, setNewCategoryColor] = useState('#38e07b');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Lista de iconos disponibles
  const availableIcons = [
    'home', 'restaurant', 'directions_car', 'sports_esports', 'shopping_cart',
    'local_gas_station', 'flight', 'hotel', 'fitness_center', 'local_hospital',
    'school', 'work', 'movie', 'music_note', 'sports_soccer', 'pets',
    'child_care', 'elderly', 'celebration', 'cake', 'local_cafe', 'fastfood',
    'local_bar', 'beach_access', 'pool', 'spa', 'theater_comedy', 'book',
    'laptop', 'phone_android', 'tv', 'headphones', 'camera_alt', 'videogame_asset',
    'sports_basketball', 'sports_tennis', 'sports_volleyball', 'golf_course',
    'directions_bike', 'directions_walk', 'directions_transit', 'train',
    'local_pharmacy', 'local_grocery_store', 'local_mall', 'store',
    'account_balance', 'savings', 'credit_card', 'wallet', 'payments',
    'receipt', 'attach_money', 'monetization_on', 'trending_up', 'trending_down',
    'category', 'label', 'tag', 'bookmark', 'star', 'favorite'
  ];

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'categories'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const cats: Category[] = [];
      snapshot.forEach((doc: any) => {
        const categoryData = { id: doc.id, ...doc.data() } as Category;
        // Ordenar subcategorías alfabéticamente
        if (categoryData.subcategories && categoryData.subcategories.length > 0) {
          categoryData.subcategories = [...categoryData.subcategories].sort((a, b) => 
            a.localeCompare(b, 'es', { sensitivity: 'base' })
          );
        }
        cats.push(categoryData);
      });
      
      // Ordenar categorías alfabéticamente por nombre
      cats.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
      
      setCategories(cats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateCategory = async () => {
    if (!currentUser || !newCategoryName) return;
    
    await addDoc(collection(db, 'categories'), {
      name: newCategoryName,
      icon: newCategoryIcon,
      color: newCategoryColor,
      subcategories: [],
      userId: currentUser.uid
    });
    
    setShowCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryIcon('category');
    setNewCategoryColor('#38e07b');
    setShowIconPicker(false);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    await updateDoc(doc(db, 'categories', editingCategory.id), {
      name: newCategoryName || editingCategory.name,
      icon: newCategoryIcon || editingCategory.icon,
      color: newCategoryColor || editingCategory.color
    });
    
    setEditingCategory(null);
    setShowCategoryModal(false);
    setNewCategoryName('');
    setShowIconPicker(false);
  };

  const handleDeleteCategoryClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete.id));
      showToast('Categoría eliminada exitosamente', 'success');
      setShowDeleteConfirmModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Error al eliminar la categoría. Inténtalo de nuevo.', 'error');
    }
  };

  const handleAddSubcategory = async (category: Category) => {
    if (!newSubcategoryName) return;
    
    const updatedSubs = [...(category.subcategories || []), newSubcategoryName];
    await updateDoc(doc(db, 'categories', category.id), {
      subcategories: updatedSubs
    });
    
    setShowSubcategoryModal(false);
    setNewSubcategoryName('');
  };

  const handleEditSubcategory = async () => {
    if (!editingSubcategory || !newSubcategoryName) return;
    
    const updatedSubs = [...editingSubcategory.category.subcategories];
    updatedSubs[editingSubcategory.index] = newSubcategoryName;
    
    await updateDoc(doc(db, 'categories', editingSubcategory.category.id), {
      subcategories: updatedSubs
    });
    
    setEditingSubcategory(null);
    setShowSubcategoryModal(false);
    setNewSubcategoryName('');
  };

  const handleDeleteSubcategory = async (category: Category, index: number) => {
    const updatedSubs = category.subcategories.filter((_, i) => i !== index);
    await updateDoc(doc(db, 'categories', category.id), {
      subcategories: updatedSubs
    });
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-28">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200/10 bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="flex size-12 shrink-0 items-center justify-start">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 dark:text-gray-400">
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
        </div>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-gray-900 dark:text-white">Gestionar Categorías</h1>
        <div className="flex w-12 items-center justify-end">
          <button 
            onClick={() => {
              setEditingCategory(null);
              setNewCategoryName('');
              setNewCategoryIcon('category');
              setNewCategoryColor('#38e07b');
              setShowCategoryModal(true);
            }}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/20 text-primary"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay categorías. Crea una nueva.</div>
        ) : (
          <div className="flex flex-col space-y-1">
            {categories.map((category) => (
              <details key={category.id} className="flex flex-col rounded-lg bg-white dark:bg-white/5 group open:bg-white dark:open:bg-white/5 transition-all shadow-sm border border-slate-100 dark:border-transparent">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex size-10 shrink-0 items-center justify-center rounded-full" 
                      style={{ backgroundColor: `${category.color || '#38e07b'}33` }}
                    >
                      <span className="material-symbols-outlined" style={{ color: category.color || '#38e07b' }}>
                        {category.icon || 'category'}
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{category.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCategory(category);
                        setNewCategoryName(category.name);
                        setNewCategoryIcon(category.icon);
                        setNewCategoryColor(category.color);
                        setShowCategoryModal(true);
                      }}
                      className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-500/10"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteCategoryClick(category);
                      }}
                      className="flex size-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-gray-400 transition-transform duration-200 group-open:rotate-180">expand_more</span>
                  </div>
                </summary>
                <div className="pl-10 pr-4 pb-2">
                  <div className="flex flex-col border-l border-gray-200/20">
                    {(category.subcategories || []).map((sub, idx) => (
                      <div key={idx} className="flex min-h-14 items-center justify-between gap-4 py-1 pl-8">
                        <p className="flex-1 truncate text-sm text-gray-600 dark:text-gray-400">{sub}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSubcategory({ category, index: idx, name: sub });
                              setNewSubcategoryName(sub);
                              setShowSubcategoryModal(true);
                            }}
                            className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-500/10"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(category, idx)}
                            className="flex size-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex min-h-14 items-center justify-between gap-4 py-1 pl-8">
                      <button
                        onClick={() => {
                          setEditingSubcategory(null);
                          setNewSubcategoryName('');
                          setShowSubcategoryModal(true);
                          // Store category for adding subcategory
                          (window as any).__tempCategory = category;
                        }}
                        className="flex items-center gap-3 text-sm font-medium text-primary hover:opacity-80"
                      >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Añadir subcategoría
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </main>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => {
          setShowCategoryModal(false);
          setShowIconPicker(false);
        }}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => {
                setShowCategoryModal(false);
                setShowIconPicker(false);
              }} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icono</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="material-symbols-outlined text-2xl" 
                        style={{ color: newCategoryColor }}
                      >
                        {newCategoryIcon}
                      </span>
                      <span>{newCategoryIcon}</span>
                    </div>
                    <span className="material-symbols-outlined text-xl">
                      {showIconPicker ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  
                  {showIconPicker && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg max-h-64 overflow-y-auto">
                      <div className="p-3 grid grid-cols-6 gap-2">
                        {availableIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => {
                              setNewCategoryIcon(icon);
                              setShowIconPicker(false);
                            }}
                            className={`flex items-center justify-center h-12 rounded-lg border-2 transition-all ${
                              newCategoryIcon === icon
                                ? 'border-primary bg-primary/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            style={newCategoryIcon === icon ? { borderColor: newCategoryColor } : {}}
                          >
                            <span 
                              className="material-symbols-outlined text-2xl"
                              style={{ color: newCategoryIcon === icon ? newCategoryColor : undefined }}
                            >
                              {icon}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-14 rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                className="w-full bg-primary text-background-dark text-lg font-bold h-12 rounded-xl"
              >
                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowSubcategoryModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
              </h2>
              <button onClick={() => setShowSubcategoryModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                  placeholder="Nombre de la subcategoría"
                />
              </div>
              <button
                onClick={() => {
                  if (editingSubcategory) {
                    handleEditSubcategory();
                  } else {
                    const category = (window as any).__tempCategory;
                    if (category) {
                      handleAddSubcategory(category);
                      (window as any).__tempCategory = null;
                    }
                  }
                }}
                className="w-full bg-primary text-background-dark text-lg font-bold h-12 rounded-xl"
              >
                {editingSubcategory ? 'Guardar Cambios' : 'Agregar Subcategoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => {
          setShowDeleteConfirmModal(false);
          setCategoryToDelete(null);
        }}>
          <div className="w-full max-w-sm mx-4 bg-background-light dark:bg-background-dark rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">warning</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-2">
              Eliminar Categoría
            </h2>
            
            <p className="text-base text-zinc-600 dark:text-zinc-400 text-center mb-2">
              ¿Estás seguro de eliminar la categoría <strong className="text-zinc-900 dark:text-white">{categoryToDelete.name}</strong>?
            </p>

            {categoryToDelete.subcategories && categoryToDelete.subcategories.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl">info</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                      Esta categoría tiene {categoryToDelete.subcategories.length} subcategoría{categoryToDelete.subcategories.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Al eliminar la categoría, también se eliminarán todas sus subcategorías:
                    </p>
                    <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400">
                      {categoryToDelete.subcategories.map((sub, idx) => (
                        <li key={idx}>{sub}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1 h-12 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCategory}
                className="flex-1 h-12 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
