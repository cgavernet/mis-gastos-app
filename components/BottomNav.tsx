import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (p: string) => path === p;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto w-full border-t border-zinc-200/80 bg-background-light/80 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/90">
      <div className="flex h-20 items-center justify-around px-2">
        <Link to="/" className={`flex flex-col items-center justify-center gap-1 ${isActive('/') ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-xs font-bold">Dashboard</span>
        </Link>
        <Link to="/history" className={`flex flex-col items-center justify-center gap-1 ${isActive('/history') ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined">history</span>
          <span className="text-xs font-medium">Historial</span>
        </Link>
        <Link to="/manage-categories" className={`flex flex-col items-center justify-center gap-1 ${isActive('/manage-categories') ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined">category</span>
          <span className="text-xs font-medium">Categorías</span>
        </Link>
        <Link to="/reports" className={`flex flex-col items-center justify-center gap-1 ${isActive('/reports') ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <span className="material-symbols-outlined">insights</span>
          <span className="text-xs font-medium">Análisis</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
