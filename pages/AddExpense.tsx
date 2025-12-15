
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs, orderBy, limit } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Category, CreditCard } from '../types';

const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('ARS');
  const [payWithCard, setPayWithCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [cardAmount, setCardAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  
  // Defaults “más usados recientemente” (una sola vez)
  const [recommendedCategoryName, setRecommendedCategoryName] = useState<string | null>(null);
  const [recommendedSubcategory, setRecommendedSubcategory] = useState<string | null>(null);
  const [didApplyRecommendedDefaults, setDidApplyRecommendedDefaults] = useState(false);
  
  // Load categories from Firebase
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'categories'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const cats: Category[] = [];
      snapshot.forEach((doc: any) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      setCategories(cats);
      if (cats.length > 0) {
        // Mantener selección si existe; si no, aplicar recomendación; si no, caer al primero.
        if (!selectedCategory || !cats.find(c => c.id === selectedCategory?.id)) {
          const recommended = recommendedCategoryName
            ? cats.find((c) => c.name === recommendedCategoryName) ?? null
            : null;
          setSelectedCategory(recommended ?? cats[0]);
        }
      } else {
        setSelectedCategory(null);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Calcular categoría/subcategoría más usadas recientemente (basado en transacciones)
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    const computeRecommendedDefaults = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const snap: any = await getDocs(q);
        if (cancelled) return;

        const docs = snap.docs.map((d: any) => d.data());

        // Solo gastos (si no hay type, lo tratamos como gasto por compatibilidad)
        const expenses = docs.filter((t: any) => !t.type || t.type === 'expense');

        const catStats = new Map<string, { count: number; lastIndex: number }>();
        const subStats = new Map<string, Map<string, { count: number; lastIndex: number }>>();

        expenses.forEach((t: any, idx: number) => {
          const cat = t.category;
          if (typeof cat !== 'string' || !cat) return;

          const prev = catStats.get(cat);
          catStats.set(cat, {
            count: (prev?.count ?? 0) + 1,
            lastIndex: prev ? Math.min(prev.lastIndex, idx) : idx, // idx menor = más reciente (porque viene desc)
          });

          const sub = t.subcategory;
          if (typeof sub === 'string' && sub) {
            if (!subStats.has(cat)) subStats.set(cat, new Map());
            const m = subStats.get(cat)!;
            const sPrev = m.get(sub);
            m.set(sub, {
              count: (sPrev?.count ?? 0) + 1,
              lastIndex: sPrev ? Math.min(sPrev.lastIndex, idx) : idx,
            });
          }
        });

        const pickBest = (m: Map<string, { count: number; lastIndex: number }>) => {
          let bestKey: string | null = null;
          let bestCount = -1;
          let bestLastIndex = Number.POSITIVE_INFINITY;
          for (const [key, v] of m.entries()) {
            if (v.count > bestCount || (v.count === bestCount && v.lastIndex < bestLastIndex)) {
              bestKey = key;
              bestCount = v.count;
              bestLastIndex = v.lastIndex;
            }
          }
          return bestKey;
        };

        const bestCategory = pickBest(catStats);
        setRecommendedCategoryName(bestCategory);

        if (bestCategory && subStats.has(bestCategory)) {
          const bestSub = pickBest(subStats.get(bestCategory)!);
          setRecommendedSubcategory(bestSub);
        } else {
          setRecommendedSubcategory(null);
        }
      } catch (error) {
        console.error('Error computing recommended category defaults:', error);
        if (!cancelled) {
          setRecommendedCategoryName(null);
          setRecommendedSubcategory(null);
        }
      }
    };

    computeRecommendedDefaults();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Aplicar recomendación una sola vez cuando ya tengo categorías cargadas
  useEffect(() => {
    if (didApplyRecommendedDefaults) return;
    if (!categories.length) return;
    if (!recommendedCategoryName) return;

    const recommended = categories.find((c) => c.name === recommendedCategoryName);
    if (!recommended) return;

    setSelectedCategory(recommended);
    if (recommendedSubcategory && recommended.subcategories?.includes(recommendedSubcategory)) {
      setSelectedSubcategory(recommendedSubcategory);
    }
    setDidApplyRecommendedDefaults(true);
  }, [categories, recommendedCategoryName, recommendedSubcategory, didApplyRecommendedDefaults]);
  
  // Set default subcategory when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
      // No pisar si ya hay una subcategoría válida (ej: recomendación)
      if (!selectedSubcategory || !selectedCategory.subcategories.includes(selectedSubcategory)) {
        setSelectedSubcategory(selectedCategory.subcategories[0]);
      }
    } else {
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // Load credit cards from Firebase
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'creditCards'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const cards: CreditCard[] = [];
      snapshot.forEach((doc: any) => {
        cards.push({ id: doc.id, ...doc.data() } as CreditCard);
      });
      setCreditCards(cards);
      if (cards.length > 0 && !selectedCard) {
        setSelectedCard(cards[0]);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  const handleSave = async () => {
    if (!amount || !currentUser || !selectedCategory) return;
    
    setLoading(true);
    try {
        await addDoc(collection(db, 'transactions'), {
            userId: currentUser.uid,
            amount: parseFloat(amount),
            currency,
            category: selectedCategory.name,
            subcategory: selectedSubcategory || 'General',
            icon: selectedCategory.icon || 'category',
            color: selectedCategory.color === 'orange' ? '#e0a038' : selectedCategory.color === 'blue' ? '#389ce0' : (selectedCategory.color || '#38e07b'),
            date: date,
            timestamp: serverTimestamp(),
            type: 'expense',
            paymentMethod: payWithCard ? 'card' : 'cash',
            ...(payWithCard && selectedCard ? {
              cardId: selectedCard.id,
              cardName: selectedCard.name,
              cardAmount: cardAmount ? parseFloat(cardAmount) : parseFloat(amount),
              paymentDate: paymentDate
            } : {})
        });
        showToast('Gasto guardado exitosamente', 'success');
        navigate('/');
    } catch (error) {
        console.error("Error adding document: ", error);
        showToast('Error al guardar el gasto', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-white">
      {/* Top App Bar */}
      <div className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-zinc-200 dark:border-white/10">
        <button onClick={() => navigate(-1)} className="text-primary font-medium">Cancelar</button>
        <h1 className="text-lg font-bold leading-tight text-center flex-1 text-slate-900 dark:text-white">Añadir Gasto</h1>
        <div className="w-16"></div> 
      </div>

      <main className="flex-grow pb-28 px-4 pt-6">
        {/* Currency Selector */}
        <div className="flex mb-6">
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

        {/* Expense Details Card */}
        <div className="flex flex-col rounded-xl bg-white dark:bg-[#29382f]/50 divide-y divide-zinc-200 dark:divide-white/10 border border-zinc-200 dark:border-none">
          {/* Monto */}
          <div className="flex flex-col px-4 py-3">
            <label className="text-zinc-500 dark:text-[#9eb7a8] text-xs font-medium pb-1" htmlFor="amount">Monto</label>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-zinc-400 dark:text-[#9eb7a8] pr-2">$</span>
              <input 
                id="amount" 
                type="number" 
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex w-full min-w-0 flex-1 resize-none bg-transparent h-14 p-0 text-4xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-white/30 border-none focus:ring-0"
              />
            </div>
          </div>
          
          {/* Fecha */}
          <div className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer" onClick={() => setShowDatePicker(!showDatePicker)}>
            <p className="text-zinc-900 dark:text-white text-base font-normal flex-1">Fecha</p>
            <div className="shrink-0 flex items-center gap-2">
              <p className="text-zinc-500 dark:text-[#9eb7a8] text-base font-normal">
                {date === new Date().toISOString().split('T')[0] ? 'Hoy' : new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
              <span className="material-symbols-outlined text-zinc-400 dark:text-[#9eb7a8] text-xl">chevron_right</span>
            </div>
          </div>
          {showDatePicker && (
            <div className="px-4 pb-3">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setShowDatePicker(false);
                }}
                className="w-full rounded-lg bg-zinc-100 dark:bg-[#29382f] h-14 px-4 text-base text-zinc-900 dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-zinc-100 dark:focus:bg-[#29382f] focus:text-zinc-900 dark:focus:text-white"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Categoría */}
          <div className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer" onClick={() => setShowCategoryModal(true)}>
            <p className="text-zinc-900 dark:text-white text-base font-normal flex-1">Categoría</p>
            <div className="shrink-0 flex items-center gap-2">
              <p className="text-zinc-500 dark:text-[#9eb7a8] text-base font-normal">{selectedCategory?.name || 'Seleccionar'}</p>
              <span className="material-symbols-outlined text-zinc-400 dark:text-[#9eb7a8] text-xl">chevron_right</span>
            </div>
          </div>

          {/* Subcategoría */}
          <div 
            className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer" 
            onClick={() => selectedCategory && selectedCategory.subcategories.length > 0 && setShowSubcategoryModal(true)}
          >
            <p className="text-zinc-900 dark:text-white text-base font-normal flex-1">Subcategoría (Opcional)</p>
            <div className="shrink-0 flex items-center gap-2">
              <p className="text-zinc-500 dark:text-[#9eb7a8] text-base font-normal">
                {selectedSubcategory || (selectedCategory?.subcategories.length > 0 ? 'Seleccionar' : 'N/A')}
              </p>
              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <span className="material-symbols-outlined text-zinc-400 dark:text-[#9eb7a8] text-xl">chevron_right</span>
              )}
            </div>
          </div>
        </div>

        {/* Credit Card Section */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#29382f]/50 rounded-xl px-4 min-h-[56px] border border-zinc-200 dark:border-none">
            <label className="text-zinc-900 dark:text-white text-base font-normal flex-1 cursor-pointer" htmlFor="credit-card-toggle">Pagar con tarjeta</label>
            <input 
                id="credit-card-toggle" 
                type="checkbox" 
                checked={payWithCard}
                onChange={(e) => setPayWithCard(e.target.checked)}
                className="form-checkbox h-5 w-5 rounded-md border-zinc-300 dark:border-white/20 bg-transparent text-primary focus:ring-primary focus:ring-offset-background-dark"
            />
          </div>

          {payWithCard && (
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#29382f]/50 divide-y divide-zinc-200 dark:divide-white/10 border border-zinc-200 dark:border-none transition-all">
                <div className="flex max-w-[480px] flex-wrap items-center gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-zinc-500 dark:text-[#9eb7a8] text-xs font-medium pb-1">Monto con tarjeta</p>
                    <div className="flex w-full flex-1 items-stretch">
                    <input 
                        type="number" 
                        inputMode="decimal" 
                        placeholder={amount || "$0.00"}
                        value={cardAmount}
                        onChange={(e) => setCardAmount(e.target.value)}
                        className="flex w-full min-w-0 flex-1 rounded-lg bg-zinc-100 dark:bg-[#29382f] h-14 px-4 text-base text-zinc-900 dark:text-white border-none focus:ring-0 focus:bg-zinc-100 dark:focus:bg-[#29382f] focus:text-zinc-900 dark:focus:text-white placeholder:text-zinc-400 dark:placeholder:text-[#9eb7a8]"
                    />
                    </div>
                </label>
                </div>
                
                <div 
                  className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer"
                  onClick={() => setShowPaymentDatePicker(!showPaymentDatePicker)}
                >
                    <p className="text-zinc-900 dark:text-white text-base font-normal flex-1">Fecha de pago</p>
                    <div className="shrink-0 flex items-center gap-2">
                        <p className="text-zinc-500 dark:text-[#9eb7a8] text-base font-normal">
                          {new Date(paymentDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <span className="material-symbols-outlined text-zinc-400 dark:text-[#9eb7a8] text-xl">chevron_right</span>
                    </div>
                </div>
                {showPaymentDatePicker && (
                  <div className="px-4 pb-3">
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => {
                        setPaymentDate(e.target.value);
                        setShowPaymentDatePicker(false);
                      }}
                      className="w-full rounded-lg bg-zinc-100 dark:bg-[#29382f] h-14 px-4 text-base text-zinc-900 dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-zinc-100 dark:focus:bg-[#29382f] focus:text-zinc-900 dark:focus:text-white"
                    />
                  </div>
                )}

                <div 
                  className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer"
                  onClick={() => creditCards.length > 0 && setShowCardModal(true)}
                >
                    <p className="text-zinc-900 dark:text-white text-base font-normal flex-1">Tarjeta</p>
                    <div className="shrink-0 flex items-center gap-2">
                        <p className="text-zinc-500 dark:text-[#9eb7a8] text-base font-normal">
                          {selectedCard ? `${selectedCard.name} •••• ${selectedCard.last4}` : creditCards.length > 0 ? 'Seleccionar' : 'No hay tarjetas'}
                        </p>
                        {creditCards.length > 0 && (
                          <span className="material-symbols-outlined text-zinc-400 dark:text-[#9eb7a8] text-xl">chevron_right</span>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-t border-zinc-200 dark:border-white/10">
        <button 
            onClick={handleSave}
            disabled={loading || !amount || !selectedCategory}
            className="w-full bg-primary text-background-dark text-lg font-bold h-14 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Guardando...' : 'Guardar Gasto'}
        </button>
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowCategoryModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seleccionar Categoría</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">No hay categorías disponibles</p>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    navigate('/manage-categories');
                  }}
                  className="text-primary font-medium"
                >
                  Crear categoría
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {[...categories]
                  .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                  .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryModal(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                    selectedCategory?.id === cat.id 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-white dark:bg-[#29382f]/50 border border-zinc-200 dark:border-none'
                  }`}
                >
                  <div 
                    className="flex size-12 items-center justify-center rounded-lg shrink-0" 
                    style={{ backgroundColor: `${cat.color || '#38e07b'}33` }}
                  >
                    <span className="material-symbols-outlined text-3xl" style={{ color: cat.color || '#38e07b' }}>
                      {cat.icon || 'category'}
                    </span>
                  </div>
                  <p className="text-base font-medium text-zinc-900 dark:text-white flex-1 text-left">{cat.name}</p>
                  {selectedCategory?.id === cat.id && (
                    <span className="material-symbols-outlined text-primary">check</span>
                  )}
                </button>
              ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subcategory Selection Modal */}
      {showSubcategoryModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowSubcategoryModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seleccionar Subcategoría</h2>
              <button onClick={() => setShowSubcategoryModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {selectedCategory.subcategories.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedSubcategory(sub);
                    setShowSubcategoryModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl ${
                    selectedSubcategory === sub 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-white dark:bg-[#29382f]/50 border border-zinc-200 dark:border-none'
                  }`}
                >
                  <p className="text-base font-medium text-zinc-900 dark:text-white">{sub}</p>
                  {selectedSubcategory === sub && (
                    <span className="material-symbols-outlined text-primary">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credit Card Selection Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowCardModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seleccionar Tarjeta</h2>
              <button onClick={() => setShowCardModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            {creditCards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">No hay tarjetas registradas</p>
                <button
                  onClick={() => {
                    setShowCardModal(false);
                    navigate('/cards');
                  }}
                  className="text-primary font-medium"
                >
                  Agregar tarjeta
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {creditCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card);
                      setShowCardModal(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                      selectedCard?.id === card.id 
                        ? 'bg-primary/20 border-2 border-primary' 
                        : 'bg-white dark:bg-[#29382f]/50 border border-zinc-200 dark:border-none'
                    }`}
                  >
                    <div 
                      className="bg-center bg-no-repeat aspect-video bg-contain h-8 w-12 shrink-0" 
                      style={{ backgroundImage: `url("${card.bgImage}")` }}
                    ></div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-zinc-900 dark:text-white">{card.name}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">•••• {card.last4}</p>
                    </div>
                    {selectedCard?.id === card.id && (
                      <span className="material-symbols-outlined text-primary">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpense;
