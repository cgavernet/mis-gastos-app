import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ExpenseList from './pages/ExpenseList';
import Reports from './pages/Reports';
import ManageCategories from './pages/ManageCategories';
import CreditCards from './pages/CreditCards';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import ToastContainer from './components/ToastContainer';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Layout>
            <ToastContainer />
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><ExpenseList /></PrivateRoute>} />
            <Route path="/add-expense" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/manage-categories" element={<PrivateRoute><ManageCategories /></PrivateRoute>} />
            <Route path="/cards" element={<PrivateRoute><CreditCards /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
        <Analytics />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;