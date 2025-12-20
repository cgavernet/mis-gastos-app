import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, query, where, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Transaction, Category, CreditCard } from '../types';

interface GroupedTransactions {
  label: string;
  transactions: Transaction[];
}

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterSubcategory, setFilterSubcategory] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // Estados para el modal de edición
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<'USD' | 'ARS'>('ARS');
  const [editDate, setEditDate] = useState('');
  const [editPayWithCard, setEditPayWithCard] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [editSelectedCategory, setEditSelectedCategory] = useState<Category | null>(null);
  const [editSelectedSubcategory, setEditSelectedSubcategory] = useState<string>('');
  const [editShowCategoryModal, setEditShowCategoryModal] = useState(false);
  const [editShowSubcategoryModal, setEditShowSubcategoryModal] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [editSelectedCard, setEditSelectedCard] = useState<CreditCard | null>(null);
  const [editCardAmount, setEditCardAmount] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editShowCardModal, setEditShowCardModal] = useState(false);
  const [editShowPaymentDatePicker, setEditShowPaymentDatePicker] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const parseISODateLocal = (isoDate: string) => {
    // isoDate esperado: "YYYY-MM-DD" (evita corrimiento por timezone)
    const parts = isoDate.split('-').map((p) => Number(p));
    if (parts.length !== 3) return new Date(isoDate);
    const [y, m, d] = parts;
    if (!y || !m || !d) return new Date(isoDate);
    return new Date(y, m - 1, d);
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc: any) => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Extract unique categories and subcategories
  useEffect(() => {
    const cats = new Set<string>();
    transactions.forEach(tx => {
      if (tx.category) cats.add(tx.category);
    });
    setCategories(Array.from(cats));
  }, [transactions]);

  // Load all categories from Firebase for editing
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
      setAllCategories(cats);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

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
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Set default subcategory when category changes in edit modal
  useEffect(() => {
    if (editSelectedCategory && editSelectedCategory.subcategories && editSelectedCategory.subcategories.length > 0) {
      if (!editSelectedSubcategory || !editSelectedCategory.subcategories.includes(editSelectedSubcategory)) {
        setEditSelectedSubcategory(editSelectedCategory.subcategories[0]);
      }
    } else {
      setEditSelectedSubcategory('');
    }
  }, [editSelectedCategory]);

  const filterTransactions = (txs: Transaction[]): Transaction[] => {
    let filtered = [...txs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.category?.toLowerCase().includes(query) ||
        tx.subcategory?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(tx => tx.category === filterCategory);
    }

    // Subcategory filter
    if (filterSubcategory) {
      filtered = filtered.filter(tx => tx.subcategory === filterSubcategory);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(tx => tx.date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(tx => tx.date <= filterDateTo);
    }

    return filtered;
  };

  const groupTransactionsByDate = (txs: Transaction[]): GroupedTransactions[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: GroupedTransactions[] = [];
    const todayTxs: Transaction[] = [];
    const yesterdayTxs: Transaction[] = [];
    const otherTxs: { [key: string]: Transaction[] } = {};

    txs.forEach(tx => {
      const txDate = parseISODateLocal(tx.date);
      txDate.setHours(0, 0, 0, 0);

      if (txDate.getTime() === today.getTime()) {
        todayTxs.push(tx);
      } else if (txDate.getTime() === yesterday.getTime()) {
        yesterdayTxs.push(tx);
      } else {
        const dateKey = tx.date;
        if (!otherTxs[dateKey]) {
          otherTxs[dateKey] = [];
        }
        otherTxs[dateKey].push(tx);
      }
    });

    if (todayTxs.length > 0) {
      groups.push({ label: 'Hoy', transactions: todayTxs });
    }
    if (yesterdayTxs.length > 0) {
      groups.push({ 
        label: `Ayer, ${yesterday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`, 
        transactions: yesterdayTxs 
      });
    }

    // Add other dates
    Object.keys(otherTxs)
      .sort((a, b) => parseISODateLocal(b).getTime() - parseISODateLocal(a).getTime())
      .forEach(dateKey => {
        const date = parseISODateLocal(dateKey);
        groups.push({
          label: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          transactions: otherTxs[dateKey]
        });
      });

    return groups;
  };

  const filteredTransactions = filterTransactions(transactions);
  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  
  const getSubcategories = (category: string): string[] => {
    const subs = new Set<string>();
    transactions
      .filter(tx => tx.category === category && tx.subcategory)
      .forEach(tx => subs.add(tx.subcategory!));
    return Array.from(subs);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditCurrency(transaction.currency || 'ARS');
    setEditDate(transaction.date);
    setEditPayWithCard((transaction as any).paymentMethod === 'card');
    
    // Find and set category
    const category = allCategories.find(c => c.name === transaction.category);
    if (category) {
      setEditSelectedCategory(category);
      setEditSelectedSubcategory(transaction.subcategory || '');
    } else {
      setEditSelectedCategory(null);
      setEditSelectedSubcategory('');
    }
    
    // Set card info if exists
    if ((transaction as any).cardId) {
      const card = creditCards.find(c => c.id === (transaction as any).cardId);
      if (card) {
        setEditSelectedCard(card);
        setEditCardAmount(((transaction as any).cardAmount || transaction.amount).toString());
        setEditPaymentDate((transaction as any).paymentDate || transaction.date);
      } else {
        setEditSelectedCard(null);
        setEditCardAmount('');
        setEditPaymentDate('');
      }
    } else {
      setEditSelectedCard(null);
      setEditCardAmount('');
      setEditPaymentDate('');
    }
    
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditShowCategoryModal(false);
    setEditShowSubcategoryModal(false);
    setEditShowCardModal(false);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !editAmount || !currentUser || !editSelectedCategory) return;
    
    setEditLoading(true);
    try {
      const updateData: any = {
        amount: parseFloat(editAmount),
        currency: editCurrency,
        category: editSelectedCategory.name,
        subcategory: editSelectedSubcategory || 'General',
        icon: editSelectedCategory.icon || 'category',
        color: editSelectedCategory.color || '#38e07b',
        date: editDate,
        paymentMethod: editPayWithCard ? 'card' : 'cash',
      };

      if (editPayWithCard && editSelectedCard) {
        updateData.cardId = editSelectedCard.id;
        updateData.cardName = editSelectedCard.name;
        updateData.cardAmount = editCardAmount ? parseFloat(editCardAmount) : parseFloat(editAmount);
        updateData.paymentDate = editPaymentDate;
      } else {
        // Remove card fields if switching to cash
        updateData.cardId = null;
        updateData.cardName = null;
        updateData.cardAmount = null;
        updateData.paymentDate = null;
      }

      await updateDoc(doc(db, 'transactions', editingTransaction.id), updateData);
      
      showToast('Transacción actualizada exitosamente', 'success');
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating transaction:", error);
      showToast('Error al actualizar la transacción', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'transactions', transactionToDelete.id));
      showToast('Transacción eliminada exitosamente', 'success');
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showToast('Error al eliminar la transacción', 'error');
    }
  };

  return (
    <div className="relative min-h-screen pb-28">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-800 dark:text-slate-200">
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">Listado General de Gastos</h1>
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="p-2 text-slate-800 dark:text-slate-200"
          >
            <span className="material-symbols-outlined text-2xl">search</span>
          </button>
        </div>
      </header>

      <main className="px-4">
        {/* Search Bar */}
        {showSearch && (
          <div className="py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por categoría o subcategoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 pr-10 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="py-4">
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                (filterDateFrom || filterDateTo || filterCategory || filterSubcategory) 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              <span>Filtros</span>
            </button>
            {(filterCategory || filterSubcategory || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setFilterCategory(null);
                  setFilterSubcategory(null);
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">close</span>
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-none space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rango de fechas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full min-w-0 rounded-lg bg-slate-100 dark:bg-slate-700 h-14 px-3 text-sm text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white"
                  placeholder="Desde"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full min-w-0 rounded-lg bg-slate-100 dark:bg-slate-700 h-14 px-3 text-sm text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-primary focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white"
                  placeholder="Hasta"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Categoría</label>
              <select
                value={filterCategory || ''}
                onChange={(e) => {
                  setFilterCategory(e.target.value || null);
                  setFilterSubcategory(null);
                }}
                className="w-full rounded-lg bg-slate-100 dark:bg-slate-700 h-14 px-3 text-sm text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {filterCategory && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategoría</label>
                <select
                  value={filterSubcategory || ''}
                  onChange={(e) => setFilterSubcategory(e.target.value || null)}
                  className="w-full rounded-lg bg-slate-100 dark:bg-slate-700 h-14 px-3 text-sm text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todas</option>
                  {getSubcategories(filterCategory).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Expense List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">Cargando transacciones...</p>
            </div>
          ) : groupedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">receipt_long</span>
              <p className="text-slate-500 dark:text-slate-400">No hay gastos registrados</p>
            </div>
          ) : (
            groupedTransactions.map((group) => (
              <div key={group.label}>
                <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{group.label}</h2>
                <div className="space-y-2">
                  {group.transactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 rounded-xl bg-white dark:bg-slate-800/50 p-4 shadow-sm border border-slate-100 dark:border-none relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${t.color || '#38e07b'}20` }}>
                        <span className="material-symbols-outlined" style={{ color: t.color || '#38e07b' }}>{t.icon || 'payments'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{t.category}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.subcategory || 'General'}</p>
                      </div>
                      <p className="text-right font-semibold text-slate-800 dark:text-slate-100">
                        -${t.amount.toFixed(2)} {t.currency || 'USD'}
                      </p>
                      <div className="shrink-0 relative">
                        <button 
                          onClick={() => setShowMenu(showMenu === t.id ? null : t.id)}
                          className="text-slate-500 dark:text-slate-400 flex size-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="material-symbols-outlined text-xl">more_horiz</span>
                        </button>
                        {showMenu === t.id && (
                          <div className="absolute right-0 top-10 z-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[120px]">
                            <button
                              onClick={() => {
                                handleEditClick(t);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setTransactionToDelete(t);
                                setShowDeleteModal(true);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-30">
        <button onClick={() => navigate('/add-expense')} className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform active:scale-95">
          <span className="material-symbols-outlined text-4xl text-black">add</span>
        </button>
      </div>

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={handleCloseEditModal}>
          <div className="w-full max-h-[90vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Editar Transacción</h2>
              <button onClick={handleCloseEditModal} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Currency Selector */}
              <div className="flex">
                <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-200 dark:bg-[#29382f] p-1">
                  <button 
                    onClick={() => setEditCurrency('USD')}
                    className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${editCurrency === 'USD' ? 'bg-primary/20 text-primary' : 'text-zinc-500 dark:text-[#9eb7a8]'}`}
                  >
                    USD
                  </button>
                  <button 
                    onClick={() => setEditCurrency('ARS')}
                    className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${editCurrency === 'ARS' ? 'bg-primary/20 text-primary' : 'text-zinc-500 dark:text-[#9eb7a8]'}`}
                  >
                    ARS
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto</label>
                <div className="flex items-center rounded-lg bg-white dark:bg-slate-800 h-14 px-4 border border-slate-200 dark:border-slate-700">
                  <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 pr-2">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="flex-1 text-lg font-semibold text-slate-900 dark:text-white border-none focus:outline-none bg-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Categoría</label>
                <button
                  onClick={() => setEditShowCategoryModal(true)}
                  className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary flex items-center justify-between"
                >
                  <span className={editSelectedCategory ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                    {editSelectedCategory?.name || 'Seleccionar categoría'}
                  </span>
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>

              {/* Subcategory */}
              {editSelectedCategory && editSelectedCategory.subcategories && editSelectedCategory.subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategoría (Opcional)</label>
                  <button
                    onClick={() => setEditShowSubcategoryModal(true)}
                    className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary flex items-center justify-between"
                  >
                    <span className={editSelectedSubcategory ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                      {editSelectedSubcategory || 'Seleccionar subcategoría'}
                    </span>
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Método de pago</label>
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 h-14 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white">Pagar con tarjeta</span>
                  <input
                    type="checkbox"
                    checked={editPayWithCard}
                    onChange={(e) => setEditPayWithCard(e.target.checked)}
                    className="h-5 w-5 rounded-md border-slate-300 dark:border-slate-600 bg-transparent text-primary focus:ring-primary"
                  />
                </div>
              </div>

              {/* Card Details */}
              {editPayWithCard && (
                <>
                  {creditCards.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tarjeta</label>
                      <button
                        onClick={() => setEditShowCardModal(true)}
                        className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary flex items-center justify-between"
                      >
                        <span className={editSelectedCard ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                          {editSelectedCard ? `${editSelectedCard.name} •••• ${editSelectedCard.last4}` : 'Seleccionar tarjeta'}
                        </span>
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                      </button>
                    </div>
                  )}
                  {editSelectedCard && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto con tarjeta</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={editCardAmount}
                          onChange={(e) => setEditCardAmount(e.target.value)}
                          className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                          placeholder={editAmount || "0.00"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha de pago</label>
                        <input
                          type="date"
                          value={editPaymentDate}
                          onChange={(e) => setEditPaymentDate(e.target.value)}
                          className="w-full rounded-lg bg-white dark:bg-slate-800 h-14 px-4 text-base text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <button
                onClick={handleUpdateTransaction}
                disabled={editLoading || !editAmount || !editSelectedCategory}
                className="w-full bg-primary text-background-dark text-lg font-bold h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal for Edit */}
      {editShowCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={() => setEditShowCategoryModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seleccionar Categoría</h2>
              <button onClick={() => setEditShowCategoryModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setEditSelectedCategory(cat);
                    setEditShowCategoryModal(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                    editSelectedCategory?.id === cat.id 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-white dark:bg-[#29382f]/50 border border-zinc-200 dark:border-none'
                  }`}
                >
                  <div 
                    className="flex size-12 items-center justify-center rounded-lg shrink-0" 
                    style={{ backgroundColor: `${cat.color || '#38e07b'}33` }}
                  >
                    <span className="material-symbols-outlined text-2xl" style={{ color: cat.color || '#38e07b' }}>
                      {cat.icon || 'category'}
                    </span>
                  </div>
                  <span className="text-base font-medium text-slate-900 dark:text-white flex-1 text-left">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Selection Modal for Edit */}
      {editShowSubcategoryModal && editSelectedCategory && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={() => setEditShowSubcategoryModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seleccionar Subcategoría</h2>
              <button onClick={() => setEditShowSubcategoryModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {editSelectedCategory.subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setEditSelectedSubcategory(sub);
                    setEditShowSubcategoryModal(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left ${
                    editSelectedSubcategory === sub
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-white dark:bg-[#29382f]/50 border border-zinc-200 dark:border-none'
                  }`}
                >
                  <span className="text-base font-medium text-slate-900 dark:text-white">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card Selection Modal for Edit */}
      {editShowCardModal && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={() => setEditShowCardModal(false)}>
          <div className="w-full max-h-[80vh] bg-background-light dark:bg-background-dark rounded-t-3xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Seleccionar Tarjeta</h2>
              <button onClick={() => setEditShowCardModal(false)} className="text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {creditCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    setEditSelectedCard(card);
                    setEditShowCardModal(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                    editSelectedCard?.id === card.id
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-white dark:bg-[#29382f]/50 border border-zinc-200 dark:border-none'
                  }`}
                >
                  <div 
                    className="bg-center bg-no-repeat aspect-video bg-contain h-6 w-10 shrink-0" 
                    style={{ backgroundImage: `url("${card.bgImage}")` }}
                  ></div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-slate-900 dark:text-white">{card.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">•••• {card.last4}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => {
          setShowDeleteModal(false);
          setTransactionToDelete(null);
        }}>
          <div className="w-full max-w-sm mx-4 bg-background-light dark:bg-background-dark rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">warning</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-2">
              Eliminar Transacción
            </h2>
            
            <p className="text-base text-zinc-600 dark:text-zinc-400 text-center mb-4">
              ¿Estás seguro de eliminar esta transacción?
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{transactionToDelete.category}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{transactionToDelete.subcategory || 'General'}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ${transactionToDelete.amount.toFixed(2)} {transactionToDelete.currency || 'USD'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTransactionToDelete(null);
                }}
                className="flex-1 h-12 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTransaction}
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

export default ExpenseList;
