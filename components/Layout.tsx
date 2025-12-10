import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideNavRoutes = ['/login', '/signup', '/forgot-password', '/verify-email', '/add-expense', '/settings', '/cards', '/manage-categories'];
  
  // Logic: Show nav on main tabs, hide on sub-pages or auth pages.
  // Exception: manage-categories is linked in nav, so let's keep nav there, 
  // but usually "manage" pages might be full screen. 
  // Based on the user flow in screenshots, pages like "Add Expense" and "Settings" cover the nav.
  
  // Let's refine: The provided screenshots for Dashboard, History, Reports show the nav. 
  // The others don't.
  const showNav = ['/', '/history', '/reports', '/manage-categories'].includes(location.pathname);

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      {children}
      {showNav && <BottomNav />}
    </div>
  );
};

export default Layout;
