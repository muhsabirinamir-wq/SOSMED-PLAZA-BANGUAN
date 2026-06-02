/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, ShieldAlert, X, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginGateModal: React.FC = () => {
  const { 
    allUsers,
    pendingUserForLogin, 
    setPendingUserForLogin, 
    confirmSwitchUser,
    logSecurityAlert 
  } = useApp();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Default expected codes matched with user state:
  const getExpectedPinForUser = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    return found?.pinCode || '1234';
  };

  useEffect(() => {
    if (pendingUserForLogin) {
      setPin('');
      setError(null);
      setIsSuccess(false);
      setShake(false);
    }
  }, [pendingUserForLogin]);

  const handleKeyPress = (num: string) => {
    if (isSuccess) return;
    setError(null);
    setShake(false);
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setError(null);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSuccess) return;
    setError(null);
    setPin('');
  };

  const handleVerify = () => {
    if (!pendingUserForLogin) return;
    const expectedPin = getExpectedPinForUser(pendingUserForLogin.id);
    if (pin === expectedPin) {
      setIsSuccess(true);
      setError(null);
      // Wait shortly for visual finish feedback before completing switch
      setTimeout(() => {
        confirmSwitchUser(pendingUserForLogin.id);
      }, 700);
    } else {
      setShake(true);
      setError('Kode PIN yang Anda masukkan salah!');
      logSecurityAlert(pendingUserForLogin, pin);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pendingUserForLogin || isSuccess) return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          handleVerify();
        }
      } else if (e.key === 'Escape') {
        setPendingUserForLogin(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, pendingUserForLogin, isSuccess]);

  if (!pendingUserForLogin) return null;

  const expectedPin = getExpectedPinForUser(pendingUserForLogin.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative w-full max-w-sm rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-2xl transition-colors ${
          shake ? 'animate-bounce' : ''
        } ${isSuccess ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'}`}
        style={shake ? { transform: 'translateX(10px)', transition: 'transform 0.1s' } : {}}
      >
        {/* Close Button */}
        <button
          onClick={() => setPendingUserForLogin(null)}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shield Icon Lock header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-2 select-none">
          <div className={`p-4 rounded-full ${
            isSuccess 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
              : error 
                ? 'bg-red-100 dark:bg-red-950/40 text-red-600 animate-pulse' 
                : 'bg-red-50 dark:bg-red-950/20 text-red-600'
          }`}>
            {isSuccess ? (
              <ShieldCheck className="w-8 h-8" />
            ) : error ? (
              <ShieldAlert className="w-8 h-8" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Verifikasi Hak Akses
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Sesi login terbatas. Silakan verifikasi identitas Anda untuk masuk ke akun ini.
            </p>
          </div>

          <div className="mt-2 text-xs py-1 px-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {pendingUserForLogin.name} ({pendingUserForLogin.role})
          </div>
        </div>

        {/* Dot indicators showing entered pin */}
        <div className="flex justify-center gap-4 py-6 select-none">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                isSuccess 
                  ? 'bg-emerald-500 border-emerald-500 scale-110' 
                  : index < pin.length
                    ? 'bg-red-600 border-red-600 scale-110 shadow-sm'
                    : 'bg-transparent border-slate-300 dark:border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* PIN keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto select-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={isSuccess}
              className="h-12 text-lg font-black rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50 hover:bg-slate-150 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 transition-colors shadow-sm active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={isSuccess}
            className="h-12 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors active:scale-95"
          >
            Bersih
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isSuccess}
            className="h-12 text-lg font-black rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50 hover:bg-slate-150 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 transition-colors shadow-sm active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={isSuccess}
            className="h-12 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors active:scale-95"
          >
            Hapus
          </button>
        </div>

        {/* Demo Helper box */}
        <div className="mt-6 border border-amber-100 dark:border-amber-950/40 bg-amber-50/40 dark:bg-amber-950/10 p-2.5 rounded-xl text-[10px] text-amber-850 dark:text-amber-400 space-y-0.5 leading-snug">
          <p className="font-extrabold uppercase tracking-wide text-[9px] flex items-center gap-1">
            <span>💡 Petunjuk Akses Demo</span>
          </p>
          <p>
            • <strong className="font-bold">Budi Owner:</strong> PIN <strong className="font-bold">{allUsers.find(u => u.id === 'usr-1')?.pinCode || '0000'}</strong>
          </p>
          <p>
            • <strong className="font-bold">Sinta Manager:</strong> PIN <strong className="font-bold">{allUsers.find(u => u.id === 'usr-2')?.pinCode || '1234'}</strong>
          </p>
          <p className="text-slate-400 mt-1 italic">
            *Staff lain (Boni, Rian, Amanda) switch tanpa PIN keamanan secara instan.
          </p>
        </div>

        {/* Action Button layout row */}
        <div className="mt-5 space-y-2">
          {error && (
            <p className="text-center text-xs font-bold text-red-600 animate-pulse text-shadow-sm">
              {error}
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={pin.length !== 4 || isSuccess}
            className={`w-full py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-500/10'
                : pin.length === 4
                  ? 'bg-red-650 hover:bg-red-750 text-white shadow-md active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Akses Diberikan...</span>
              </>
            ) : (
              <span>Verifikasi PIN</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
