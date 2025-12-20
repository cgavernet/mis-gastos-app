import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, Cell } from 'recharts';
import { COLORS } from '../constants';
import { Period, Transaction } from '../types';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<Period>('Mensual');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
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

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (period === 'Mensual') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (period === 'Semanal') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(start.getDate() + 6);
    } else if (period === 'Anual') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end && tx.type === 'expense';
    });
  }, [transactions, period, selectedDate]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    const { start, end } = getDateRange();
    return transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= start && txDate <= end && tx.type === 'income';
      })
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions, period, selectedDate]);

  const balance = totalIncome - totalExpenses;

  const categoryData = useMemo(() => {
    const categoryMap: { [key: string]: { amount: number; count: number; color: string } } = {};
    
    filteredTransactions.forEach(tx => {
      const cat = tx.category || 'Otros';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0, color: tx.color || COLORS.chart.food };
      }
      categoryMap[cat].amount += tx.amount || 0;
      categoryMap[cat].count += 1;
    });

    const total = Object.values(categoryMap).reduce((sum, cat) => sum + cat.amount, 0);
    
    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name: name.length > 8 ? name.substring(0, 8) + '.' : name,
        value: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        amount: data.amount,
        count: data.count,
        color: data.color
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const trendData = useMemo(() => {
    const { start, end } = getDateRange();
    const data: { name: string; value: number }[] = [];
    
    if (period === 'Mensual') {
      const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekTotal = filteredTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= weekStart && txDate <= weekEnd;
          })
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
        data.push({ name: `Sem ${i + 1}`, value: weekTotal });
      }
    } else if (period === 'Semanal') {
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const dayTotal = filteredTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.toDateString() === day.toDateString();
          })
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
        data.push({ name: day.toLocaleDateString('es-ES', { weekday: 'short' }), value: dayTotal });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(selectedDate.getFullYear(), i, 1);
        const monthEnd = new Date(selectedDate.getFullYear(), i + 1, 0);
        const monthTotal = filteredTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= monthStart && txDate <= monthEnd;
          })
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
        data.push({ name: monthStart.toLocaleDateString('es-ES', { month: 'short' }), value: monthTotal });
      }
    }
    
    return data;
  }, [filteredTransactions, period, selectedDate]);

  const averagePerDay = period === 'Mensual' ? totalExpenses / 30 : period === 'Semanal' ? totalExpenses / 7 : totalExpenses / 365;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col pb-28">
      <header className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Reportes</h1>
        <div className="flex size-12 shrink-0 items-center"></div>
      </header>

      {/* Segmented Buttons */}
      <div className="flex px-4 py-3">
        <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800/50 p-1">
          {['Mensual', 'Semanal', 'Anual'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as Period)}
              className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${period === p ? 'bg-primary shadow-lg shadow-primary/20 text-black' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex gap-3 p-4 pt-1">
        <button 
          onClick={() => {
            const input = document.createElement('input');
            input.type = period === 'Anual' ? 'number' : 'month';
            input.value = period === 'Anual' 
              ? selectedDate.getFullYear().toString()
              : `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
            input.onchange = (e: any) => {
              const newDate = new Date(selectedDate);
              if (period === 'Anual') {
                newDate.setFullYear(parseInt(e.target.value));
              } else {
                const [year, month] = e.target.value.split('-');
                newDate.setFullYear(parseInt(year));
                newDate.setMonth(parseInt(month) - 1);
              }
              setSelectedDate(newDate);
            };
            input.click();
          }}
          className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-200 dark:bg-slate-800/50 pl-4 pr-2"
        >
          <p className="text-slate-900 dark:text-white text-sm font-medium">
            {period === 'Anual' 
              ? selectedDate.getFullYear()
              : selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-base">expand_more</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Gasto Total</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">
            ${loading ? '0.00' : totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Ingresos</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">
            ${loading ? '0.00' : totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 rounded-xl p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Balance</p>
          <p className={`text-2xl font-bold tracking-tight ${balance >= 0 ? 'text-green-500 dark:text-primary' : 'text-red-500'}`}>
            ${loading ? '0.00' : balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="flex flex-col gap-6 px-4 py-2">
        {/* Bar Chart */}
        <div className="flex w-full flex-col gap-4 rounded-xl p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col gap-0">
            <p className="text-slate-900 dark:text-white text-base font-semibold">Gastos por Categoría</p>
            <div className="flex items-baseline gap-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                {period === 'Anual' 
                  ? selectedDate.getFullYear()
                  : selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="h-40 w-full min-w-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={categoryData}>
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color + '40'} stroke={entry.color} strokeWidth={0} />
                    ))}
                  </Bar>
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No hay datos</div>
            )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="flex w-full flex-col gap-4 rounded-xl p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex flex-col gap-0">
            <p className="text-slate-900 dark:text-white text-base font-semibold">Tendencia de Gastos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                ${averagePerDay.toFixed(2)}/{period === 'Mensual' ? 'día' : period === 'Semanal' ? 'día' : 'año'}
              </p>
            </div>
          </div>
          <div className="h-40 w-full min-w-0">
            {trendData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38e07b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38e07b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#38e07b" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                    <XAxis dataKey="name" hide />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-between px-2 pt-2">
                  {trendData.slice(0, 4).map((item, idx) => (
                    <p key={idx} className="text-slate-500 dark:text-slate-400 text-xs font-medium">{item.name}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No hay datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-3 px-4 py-4">
        <h2 className="text-slate-900 dark:text-white text-base font-semibold">Desglose de Gastos</h2>
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="text-center py-4 text-slate-400">Cargando...</div>
          ) : categoryData.length === 0 ? (
            <div className="text-center py-4 text-slate-400">No hay gastos en este período</div>
          ) : (
            categoryData.map(item => (
              <div key={item.name} className="flex items-center gap-4 rounded-xl p-3 bg-white dark:bg-slate-900/70 shadow-sm border border-slate-100 dark:border-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{backgroundColor: item.color + '30'}}>
                  <span className="material-symbols-outlined" style={{color: item.color}}>category</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.count} transacciones</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">${item.amount.toFixed(2)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.value}%</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Reports;