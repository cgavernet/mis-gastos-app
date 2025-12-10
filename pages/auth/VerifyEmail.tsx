import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpInput from '../../components/OtpInput';
import { useToast } from '../../contexts/ToastContext';

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleVerify = () => {
        if (otp.length !== 6) {
            setError('Por favor ingresa el código completo de 6 dígitos');
            return;
        }

        // Basic validation - in a real app, this would verify with backend
        // For now, we'll just check if it's 6 digits
        if (/^\d{6}$/.test(otp)) {
            // Simulate verification
            setError('');
            navigate('/');
        } else {
            setError('Código inválido. Por favor verifica e intenta de nuevo.');
        }
    };

    const handleResend = () => {
        if (!canResend) return;
        
        // In a real app, this would resend the OTP
        setResendTimer(60);
        setCanResend(false);
        setError('');
        setOtp('');
        // Show success message
        showToast('Código reenviado. Revisa tu correo electrónico.', 'success');
    };

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex items-center p-4">
        <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-900 dark:text-white">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="w-full text-center text-lg font-bold leading-tight text-zinc-900 dark:text-white pr-10">Validación de Correo</h2>
      </div>
      <div className="flex flex-1 flex-col justify-between px-4 pb-8 pt-6">
        <div className="flex flex-col items-center">
            <h1 className="text-zinc-900 dark:text-white text-center text-3xl font-bold leading-tight tracking-tighter">Verifica tu correo</h1>
            <p className="mt-2 max-w-sm text-center text-base font-normal leading-normal text-zinc-600 dark:text-zinc-400">Introduce el código de 6 dígitos que hemos enviado a tu correo electrónico.</p>
            <div className="mt-12 flex w-full justify-center">
                <OtpInput value={otp} onChange={setOtp} />
            </div>
            
            {error && (
              <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300 text-center max-w-sm">
                {error}
              </div>
            )}

            <p className="mt-8 text-center text-sm font-normal leading-normal text-zinc-500 dark:text-zinc-400">
                ¿No recibiste el código?{' '}
                {canResend ? (
                  <button onClick={handleResend} className="font-semibold text-primary hover:underline">
                    Reenviar código
                  </button>
                ) : (
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">
                    Reenviar en {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}s
                  </span>
                )}
            </p>
        </div>
        <button 
          onClick={handleVerify}
          disabled={otp.length !== 6}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 text-base font-bold text-zinc-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Confirmar
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
