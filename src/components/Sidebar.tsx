/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  TrendingUp, 
  Coins, 
  Users, 
  Database, 
  UserSquare2,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, allUsers, switchUser, isDarkMode, toggleDarkMode, resetAllData } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Ringkasan Analitik', icon: LayoutDashboard },
    { id: 'todos', label: 'Tugas Harian Tim', icon: CheckSquare },
    { id: 'sosmed', label: 'Kenaikan Pengikut', icon: TrendingUp },
  ];

  if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
    menuItems.push(
      { id: 'omset', label: 'Laporan Omset', icon: Coins },
      { id: 'team', label: 'Kelola Tim & Target', icon: Users },
      { id: 'settings', label: 'Log Audit & Sistem', icon: Database }
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0 h-full">
      {/* Header / Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-extrabold text-lg text-white" id="logo-icon">
          S
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase sm:text-base" id="logo-title">
            SOSMED <span className="text-red-600">PLAZA</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Retail Monitoring Hub</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
          Menu Utama
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive 
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-450 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-850 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-650 dark:text-red-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Quick User Switcher Section */}
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
            Peran Sesi Kerja
          </span>
          <div className="space-y-1 px-1">
            {allUsers.map((u) => (
              <button
                key={u.id}
                id={`switch-user-btn-${u.id}`}
                onClick={() => switchUser(u.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-[11px] transition-all ${
                  currentUser.id === u.id
                    ? 'bg-slate-100/80 dark:bg-slate-800 border-l-2 border-red-600 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 max-w-[85%]">
                  <img 
                    src={u.avatar} 
                    alt={u.name} 
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 referrerNoReferrer"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left truncate">
                    <p className="font-extrabold truncate text-slate-700 dark:text-slate-200">{u.name.split(' ')[0]}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{u.role}</p>
                  </div>
                </div>
                {currentUser.id === u.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer Settings */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>Tampilan {isDarkMode ? 'Gelap' : 'Terang'}</span>
          <button 
            id="theme-toggle-sidebar"
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Ganti Mode Tampilan"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        <button
          id="reset-db-btn"
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin me-reset seluruh data kembali ke setelan awal?')) {
              resetAllData();
            }
          }}
          className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-750 hover:border-red-200 dark:hover:border-red-900/30 text-[10px] font-bold text-slate-500 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400 transition-all shadow-sm"
        >
          <RefreshCw className="w-3 h-3 text-red-550 shrink-0" />
          <span>Atur Ulang Data</span>
        </button>
      </div>
    </aside>
  );
};
