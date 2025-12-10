import React, { useState, useRef, useEffect } from 'react';

interface OtpInputProps {
  value?: string;
  onChange?: (value: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ value = '', onChange }) => {
  const [otp, setOtp] = useState<string[]>(value.split('').slice(0, 6).concat(Array(6 - value.length).fill('')));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value) {
      const newOtp = value.split('').slice(0, 6).concat(Array(6 - value.length).fill(''));
      setOtp(newOtp);
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLInputElement>, index: number) => {
    const target = e.currentTarget;
    const val = target.value.slice(-1);
    
    if (val && /^\d$/.test(val)) {
      const newOtp = [...otp];
      newOtp[index] = val;
      setOtp(newOtp);
      
      const otpValue = newOtp.join('');
      onChange?.(otpValue);
      
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (val === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      onChange?.(newOtp.join(''));
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    onChange?.(pastedData);
    if (pastedData.length < 6) {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  return (
    <fieldset className="flex gap-2 sm:gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          className="flex h-14 w-11 rounded-xl border-2 border-zinc-200 bg-background-light text-center text-2xl font-bold text-zinc-900 [appearance:textfield] focus:border-primary focus:outline-0 focus:ring-0 dark:border-zinc-700 dark:bg-background-dark dark:text-white dark:focus:border-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          maxLength={1}
          type="text"
          inputMode="numeric"
          value={otp[i]}
          onInput={(e) => handleInput(e, i)}
          onKeyUp={(e) => handleKeyUp(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </fieldset>
  );
};

export default OtpInput;
