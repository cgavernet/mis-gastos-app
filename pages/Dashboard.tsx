
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { db, collection, query, where, orderBy, onSnapshot, limit, doc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Category } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to the last 5 transactions for the list
    const q = query(
        collection(db, "transactions"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(50)
    );

    const unsubscribeTransactions = onSnapshot(q, (snapshot: any) => {
        const txs: Transaction[] = [];
        let total = 0;
        
        snapshot.forEach((doc: any) => {
            const data = doc.data();
            total += Number(data.amount) || 0;
            txs.push({ id: doc.id, ...data } as Transaction);
        });

        setTransactions(txs);
        setTotalAmount(total);
        setLoading(false);
    });

    // Load categories to get their colors
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot: any) => {
      const cats: Category[] = [];
      snapshot.forEach((doc: any) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
    });

    // Listen to user photo changes in real-time
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        setPhotoURL(data.photoURL || null);
      }
    }, (error) => {
      console.error('Error loading user photo:', error);
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
      unsubscribeUser();
    };
  }, [currentUser]);
  
  // Calculate Pie Data dynamically
  const calculatePieData = () => {
      const categoryMap: Record<string, number> = {};
      
      transactions.forEach(t => {
          if (categoryMap[t.category]) {
              categoryMap[t.category] += t.amount;
          } else {
              categoryMap[t.category] = t.amount;
          }
      });

      // Create a map of category name to color from Firebase categories
      const categoryColorMap: Record<string, string> = {};
      categories.forEach(cat => {
        categoryColorMap[cat.name] = cat.color;
      });

      // Map back to array with colors from categories
      return Object.keys(categoryMap).map(name => {
          // First try to get color from categories, then from transaction, then default
          const color = categoryColorMap[name] || 
                       transactions.find(t => t.category === name)?.color || 
                       '#9038e0';
          
          return { name, value: categoryMap[name], color };
      });
  };

  const pieData = calculatePieData();
  const displayPieData = pieData.length > 0 ? pieData : [{ name: 'Sin datos', value: 100, color: '#2c332e' }];

  return (
    <div className="flex flex-1 flex-col pb-28">
      {/* Top App Bar */}
      <header className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="flex size-12 shrink-0 items-center justify-start">
            <button onClick={() => navigate('/settings')} className="flex items-center justify-center">
              {photoURL ? (
                <div 
                  className="w-12 h-12 rounded-full bg-center bg-no-repeat bg-cover border-2 border-zinc-200 dark:border-zinc-700" 
                  style={{ backgroundImage: `url("${photoURL}")` }}
                ></div>
              ) : (
                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 text-3xl">account_circle</span>
              )}
            </button>
        </div>
        <h1 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Dashboard</h1>
        <div className="flex w-12 items-center justify-end">
          <button onClick={() => navigate('/settings')} className="flex items-center justify-center text-zinc-600 dark:text-zinc-300">
            <span className="material-symbols-outlined text-3xl">settings</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 pt-4">
        {/* Stats */}
        <section className="flex flex-col gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 p-6">
          <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium">Gasto Total (Reciente)</p>
          <p className="text-zinc-900 dark:text-white text-4xl font-bold tracking-tight">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </section>

        {/* Chart */}
        <section className="flex flex-col gap-4 py-8">
          <h2 className="text-zinc-900 dark:text-white text-lg font-bold">Distribución por Categoría</h2>
          <div className="relative flex h-64 items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {displayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Total</p>
              <p className="text-zinc-900 dark:text-white text-3xl font-bold">
                 ${Math.floor(totalAmount).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* List Items */}
        <section className="flex flex-col space-y-2">
            {loading ? (
                <p className="text-center text-zinc-500">Cargando movimientos...</p>
            ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                    <p>No hay gastos recientes</p>
                </div>
            ) : (
                transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 bg-transparent min-h-[72px] py-2">
                    <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center rounded-lg shrink-0 size-12" style={{ backgroundColor: `${tx.color || '#38e07b'}33` }}> 
                        <span className="material-symbols-outlined text-3xl" style={{ color: tx.color || '#38e07b' }}>{tx.icon || 'payments'}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-zinc-900 dark:text-white text-base font-medium line-clamp-1">{tx.category}</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal line-clamp-2">{tx.subcategory || 'General'} • {tx.date}</p>
                    </div>
                    </div>
                    <div className="shrink-0">
                    <p className="text-zinc-900 dark:text-white text-base font-medium">${tx.amount.toFixed(2)}</p>
                    </div>
                </div>
                ))
            )}
        </section>
      </main>

      {/* FAB */}
      <button 
        onClick={() => navigate('/add-expense')}
        className="fixed bottom-24 right-6 flex size-16 items-center justify-center rounded-full bg-primary text-background-dark shadow-lg shadow-primary/30 z-30 transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-4xl">add</span>
      </button>
    </div>
  );
};

export default Dashboard;
