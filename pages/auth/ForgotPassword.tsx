import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, sendPasswordResetEmail } from '../../firebase';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError('Por favor ingresa tu correo electrónico');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('No existe una cuenta con este correo electrónico.');
            } else if (err.code === 'auth/invalid-email') {
                setError('El correo electrónico no es válido.');
            } else {
                setError('Error al enviar el correo. Inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex items-center p-4 pb-2">
        <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center">
            <span className="material-symbols-outlined text-slate-900 dark:text-[#9eb7a8]">arrow_back_ios_new</span>
        </button>
        <h2 className="flex-1 text-center text-lg font-bold leading-tight text-slate-900 dark:text-white pr-10">Restablecer Contraseña</h2>
      </div>
      <div className="flex flex-1 flex-col justify-between px-4">
        <div className="flex flex-col">
            <div className="flex justify-center pt-8 pb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                    <span className="material-symbols-outlined text-4xl text-primary">lock_reset</span>
                </div>
            </div>
            <h1 className="text-center text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white pb-3 pt-6">Olvidé mi Contraseña</h1>
            <p className="text-center text-base font-normal leading-normal text-slate-600 dark:text-[#9eb7a8] pb-3 pt-1">
              {success 
                ? 'Se ha enviado un enlace de recuperación a tu correo electrónico.'
                : 'Ingresa el correo electrónico asociado a tu cuenta para recibir un enlace de recuperación.'}
            </p>
            
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300 text-center">
                {error}
              </div>
            )}

            {success ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">check_circle</span>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-base font-bold text-background-dark hover:opacity-90"
                >
                  Volver al Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex w-full flex-wrap items-end gap-4 py-3 pt-8">
                  <label className="flex w-full flex-col min-w-40 flex-1">
                    <p className="pb-2 text-base font-medium text-slate-900 dark:text-white">Correo Electrónico</p>
                    <div className="flex w-full flex-1 items-stretch">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input h-14 flex-1 rounded-lg border border-slate-300 bg-white p-[15px] text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:bg-white dark:focus:bg-[#1c2620] focus:text-slate-900 dark:focus:text-white dark:border-[#3d5245] dark:bg-[#1c2620] dark:text-white dark:placeholder:text-[#9eb7a8]"
                        placeholder="ejemplo@correo.com"
                        required
                      />
                    </div>
                  </label>
                </div>
                <div className="flex w-full justify-center py-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-base font-bold text-background-dark hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">{loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}</span>
                  </button>
                </div>
              </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
