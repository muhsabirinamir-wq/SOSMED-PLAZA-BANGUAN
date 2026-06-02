/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Clock, LogOut, CheckCircle2 } from 'lucide-react';

interface TopbarProps {
  activeTab: string;
}

export const Topbar: React.FC<TopbarProps> = ({ activeTab }) => {
  const { currentUser, todos } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Live update clock in Indonesian locale
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      };
      setCurrentTime(now.toLocaleDateString('id-ID', options) + ' WIB');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Ringkasan Utama & Analisis Retail';
      case 'todos':
        return 'Pelaporan To-Do List Harian';
      case 'sosmed':
        return 'Pemantauan Kenaikan Pengikut Sosial Media';
      case 'omset':
        return 'Pencatatan Omset Penjualan Online';
      case 'team':
        return 'Manajemen Akun Tim & Target Kerja';
      default:
        return 'Sosmed Plaza';
    }
  };

  // Get active pending tasks for currentUser to display in top header
  const myPendingTasks = todos.filter(t => t.assignedToId === currentUser.id && t.status !== 'SELESAI').length;

  return (
    <header className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-10 transition-colors">
      {/* Title */}
      <div className="flex flex-col">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight sm:text-lg" id="topbar-title">
          {getPageTitle()}
        </h2>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-tight flex items-center gap-1">
          <Clock className="w-3 h-3 text-red-500" />
          {currentTime || 'Matahari Terbit, 02 Juni 2026'}
        </span>
      </div>

      {/* Shortcuts and Admin card */}
      <div className="flex items-center gap-4">
        {/* Quick Pending Tasks alert */}
        {myPendingTasks > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 font-semibold rounded-full select-none animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ada {myPendingTasks} Tugas Menunggu Anda</span>
          </div>
        )}

        {/* Multi-role label */}
        <div className="hidden sm:flex flex-col text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentUser.name}</span>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              currentUser.role === 'OWNER' 
                ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                : currentUser.role === 'MANAGER'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {currentUser.role}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 italic font-medium">{currentUser.email}</span>
        </div>

        {/* User profile picture */}
        <div className="relative group shrink-0">
          <button className="flex items-center gap-2 border border-gray-200 dark:border-slate-700 p-0.5 rounded-full hover:ring-2 hover:ring-red-400 transition-all">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover referrerNoReferrer"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
