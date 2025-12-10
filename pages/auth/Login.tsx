
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  auth, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from '../../firebase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Configurar persistencia según el checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/too-many-requests') {
          setError('Demasiados intentos fallidos. Inténtalo más tarde.');
      } else {
          setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col p-4 bg-background-light dark:bg-background-dark">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <span className="material-symbols-outlined text-5xl text-primary">account_balance_wallet</span>
          </div>
        </div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center pb-6">Iniciar Sesión</h1>
        
        {error && (
            <div className="mb-4 w-full max-w-md rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          <label className="flex w-full flex-col">
            <p className="text-slate-700 dark:text-white text-base font-medium pb-2">Correo electrónico</p>
            <div className="flex w-full flex-1 items-stretch rounded-xl">
              <div className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2c20] items-center justify-center pl-[15px] h-14 rounded-l-xl border-r-0">
                <span className="material-symbols-outlined text-2xl">mail</span>
              </div>
              <input 
                className="flex w-full min-w-0 flex-1 rounded-r-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-[#1a2c20] focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2c20] h-14 placeholder:text-slate-400 dark:placeholder:text-[#9eb7a8] pl-2 pr-4 text-base border-l-0"
                placeholder="Introduce tu correo electrónico" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>
          <label className="flex w-full flex-col">
            <p className="text-slate-700 dark:text-white text-base font-medium pb-2">Contraseña</p>
            <div className="flex w-full flex-1 items-stretch rounded-xl">
              <div className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2c20] items-center justify-center pl-[15px] h-14 rounded-l-xl border-r-0">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <input 
                className="flex w-full min-w-0 flex-1 text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-[#1a2c20] focus:text-slate-900 dark:focus:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2c20] h-14 placeholder:text-slate-400 dark:placeholder:text-[#9eb7a8] pl-2 pr-12 text-base border-l-0 border-r-0"
                placeholder="Introduce tu contraseña" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 dark:text-[#9eb7a8] flex border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2c20] items-center justify-center pr-[15px] h-14 rounded-r-xl border-l-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-2 focus:ring-primary/50 bg-white dark:bg-[#1a2c20] cursor-pointer"
            />
            <span className="text-slate-700 dark:text-white text-sm font-medium">
              Mantener sesión abierta
            </span>
          </label>
          <div className="pt-4">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-lg bg-primary text-background-dark text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
          <Link to="/forgot-password">
            <p className="text-slate-500 dark:text-[#9eb7a8] text-sm font-medium pt-2 text-center underline cursor-pointer hover:text-primary">Olvidé mi contraseña</p>
          </Link>
        </form>
      </div>
      <div className="py-6 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
            ¿No tienes una cuenta? <Link to="/signup" className="font-bold text-primary underline">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
