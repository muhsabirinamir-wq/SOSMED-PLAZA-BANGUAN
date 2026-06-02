/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Activity, 
  FileText, 
  Database, 
  Trash2, 
  Lock, 
  Save, 
  RefreshCw,
  Eye,
  Sliders,
  Check,
  ToggleLeft,
  ToggleRight,
  User,
  Key,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { 
    currentUser, 
    allUsers,
    updateUser,
    loggingSettings, 
    updateLoggingSettings, 
    clearActivityLogs, 
    resetAllData,
    activities
  } = useApp();

  const isAuthorized = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';
  
  // Local form state for settings
  const [retention, setRetention] = useState(loggingSettings.retentionLimit || 100);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveUserSuccess, setSaveUserSuccess] = useState(false);

  // States for user profile editor (Name & PIN/Password)
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPin, setEditPin] = useState('');

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditUsername(selectedUser.username);
      setEditPin(selectedUser.pinCode || '');
    }
  }, [selectedUserId, allUsers]);

  const handleUpdateUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUsername.trim()) {
      alert('Nama pengguna dan Username tidak boleh kosong!');
      return;
    }
    if (editPin && (editPin.length !== 4 || isNaN(Number(editPin)))) {
      alert('Kode PIN Keamanan harus persis 4 digit angka!');
      return;
    }

    updateUser(selectedUserId, {
      name: editName.trim(),
      username: editUsername.trim(),
      pinCode: editPin
    });

    setSaveUserSuccess(true);
    setTimeout(() => setSaveUserSuccess(false), 2000);
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl text-center space-y-5"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 text-red-650 flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Otoritas Tidak Cukup</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              Halaman pengaturan logging dan kontrol sistem audit hanya dapat diakses oleh <span className="font-extrabold text-red-600">Manager</span> atau <span className="font-extrabold text-red-600">Owner</span>.
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl text-[11px] text-slate-500 font-semibold border border-slate-150">
            Perubahan konfigurasi, kuota buffer log, dan operasi sanitasi audit trail menuntut tanda tangan digital super admin.
          </div>
        </motion.div>
      </div>
    );
  }

  const toggleSetting = (key: keyof Omit<typeof loggingSettings, 'retentionLimit'>) => {
    updateLoggingSettings({ [key]: !loggingSettings[key] });
    triggerSaveToast();
  };

  const handleSaveRetention = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoggingSettings({ retentionLimit: Number(retention) });
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearAuditLogs = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh audit log aktivitas? Tindakan ini tidak dapat dibatalkan.')) {
      clearActivityLogs();
      alert('Selesai! Seluruh log aktivitas telah dibersihkan.');
    }
  };

  const handleResetFactory = () => {
    if (confirm('⚠️ PERINGATAN KERAS: Tindakan ini akan menghapus KESELURUHAN database lokal dan mengembalikannya ke setelan demo pabrikan awal. Anda akan login kembali sebagai Budi Owner. Lanjutkan?')) {
      resetAllData();
      alert('Database SOSMED PLAZA berhasil dipulihkan ke cetakan pabrik!');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Pengaturan Dashboard & Log Audit</h3>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Atur parameter integrasi, kebijakan penyimpanan log keamanan harian, serta kontrol database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Toggles Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-600" />
                <span>Filter Pencatatan Sesi Log Aktivitas</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih kategori aktivitas yang ingin dicatat secara terus menerus ke audit log local database.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              
              {/* Item 1 */}
              <div className="flex items-center justify-between py-3.5 first:pt-0">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">Pencatatan Aktivitas Login & Sesi</p>
                  <p className="text-[10px] text-slate-400">Merekam login staff, pergantian akun, pemanggilan verifikasi sandi, dan percobaan PIN salah.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('logLoginSwitch')}
                  className="text-red-600 hover:text-red-750 transition-transform active:scale-95 shrink-0"
                >
                  {loggingSettings.logLoginSwitch ? (
                    <ToggleRight className="w-10 h-10 stroke-[1.5]" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  )}
                </button>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">Pencatatan To-Do List Harian</p>
                  <p className="text-[10px] text-slate-400">Mencatat pembuatan tugas baru kustom, penyuntingan deskripsi, dan pelaporan status berprogres.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('logTodos')}
                  className="text-red-600 hover:text-red-750 transition-transform active:scale-95 shrink-0"
                >
                  {loggingSettings.logTodos ? (
                    <ToggleRight className="w-10 h-10 stroke-[1.5]" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  )}
                </button>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">Pencatatan Grafis Omset Toko</p>
                  <p className="text-[10px] text-slate-400">Mencatat setiap pencatatan nominal penjualan harian, koreksi laporan, dan verifikasi kasir.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('logOmset')}
                  className="text-red-600 hover:text-red-750 transition-transform active:scale-95 shrink-0"
                >
                  {loggingSettings.logOmset ? (
                    <ToggleRight className="w-10 h-10 stroke-[1.5]" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  )}
                </button>
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">Pencatatan Penambahan Followers Sosmed</p>
                  <p className="text-[10px] text-slate-400">Mencatat penambahan follower TikTok, Instagram, Facebook, dan laporan performa konten.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('logSosmed')}
                  className="text-red-600 hover:text-red-750 transition-transform active:scale-95 shrink-0"
                >
                  {loggingSettings.logSosmed ? (
                    <ToggleRight className="w-10 h-10 stroke-[1.5]" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  )}
                </button>
              </div>

              {/* Item 5 */}
              <div className="flex items-center justify-between py-3.5 last:pb-0">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">Pencatatan Tim & Profil Anggota</p>
                  <p className="text-[10px] text-slate-400">Mencatat penambahan kru tim retail baru, promosi kenaikan posisi, dan penyuntingan detail profil.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('logTeam')}
                  className="text-red-600 hover:text-red-750 transition-transform active:scale-95 shrink-0"
                >
                  {loggingSettings.logTeam ? (
                    <ToggleRight className="w-10 h-10 stroke-[1.5]" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* USER & PASSWORDS CONFIGURATION CARD PANEL */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-red-650" />
                <span>Pengaturan Kredensial & PIN Pengguna</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih anggota tim kustom untuk mengganti info Nama Lengkap, Username login, serta PIN Keamanan verifikasi sesi secara remote.
              </p>
            </div>

            <form onSubmit={handleUpdateUserProfile} className="space-y-4">
              {/* Dropdown Select User to Edit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Pilih Anggota Tim:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Nama Lengkap Baru:
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nama Lengkap..."
                    maxLength={40}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Username Baru:
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="budi_owner..."
                    maxLength={30}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-3 border-t border-slate-100 dark:border-slate-800/60 pb-1">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-red-500" />
                    <span>PIN Keamanan Baru (4 Digit Angka):</span>
                  </label>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={editPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEditPin(val);
                    }}
                    placeholder="Ex: 1234"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-mono font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors text-center"
                  />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    <span className="font-extrabold text-red-650 dark:text-red-400">*CATATAN KEAMANAN:</span> Kode sandi pin validas harian untuk mencegah kebocoran audit. Hak istimewa Owner harian memerlukan input validasi master ini.
                  </p>
                </div>

                <div className="col-span-1 pt-4 md:pt-5">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-650 hover:bg-red-750 text-white text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-[0.98]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan Kredensial</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* Configurations column */}
        <div className="space-y-6">
          
          {/* Retention Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" />
                <span>Kapasitas Log Audit</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Atur batasan baris retensi log agar menghemat alokasi cache browser lokal.
              </p>
            </div>

            <form onSubmit={handleSaveRetention} className="space-y-3 pt-1">
              <div className="space-y-1.5Fixed">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Batas Buffer Maksimal (Baris):
                </label>
                <select
                  value={retention}
                  onChange={(e) => setRetention(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="50">50 Baris Terakhir</option>
                  <option value="100">100 Baris Terakhir</option>
                  <option value="200">200 Baris Terakhir</option>
                  <option value="500">500 Baris Terakhir</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold py-1">
                <span>Saat ini tersimpan:</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">{activities.length} Baris</span>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Kapasitas Log</span>
              </button>
            </form>
          </div>

          {/* Database Administrative Sanitation Area */}
          <div className="bg-red-50/20 dark:bg-red-950/5 border border-red-100 dark:border-red-950/50 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-red-600" />
                <span>Sanitasi & Reset Sistem</span>
              </h4>
              <p className="text-[11px] text-red-700/60 dark:text-red-400/50 mt-0.5">
                Area administrasi tingkat tinggi. Gunakan tindakan ini untuk membersihkan cache database secara permanen.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Wipe and Clear Log Button */}
              <div className="space-y-1.5">
                <button 
                  id="clear-logs-admin-btn"
                  onClick={handleClearAuditLogs}
                  className="w-full py-2 bg-red-100 hover:bg-red-150 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-705 dark:text-red-300 text-[11px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-red-200/50 dark:border-red-900/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Log Riwayat (Audit)</span>
                </button>
                <p className="text-[9px] text-slate-450 text-center leading-relaxed">
                  Menghilangkan seluruh timeline riwayat aktivitas, menyisakan pencatatan baru.
                </p>
              </div>

              {/* Master Database Reset Button */}
              <div className="space-y-1.5 pt-2 border-t border-red-100/30 dark:border-red-900/20">
                <button 
                  id="factory-reset-admin-btn"
                  onClick={handleResetFactory}
                  className="w-full py-2 bg-red-650 hover:bg-red-750 text-white text-[11px] font-black rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Kembalikan Setelan Pabrikan</span>
                </button>
                <p className="text-[9px] text-red-600/70 text-center leading-relaxed">
                  Semua to-do, postingan sosmed, team baru, & omset akan di-wipe habis kembali ke aslinya.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Success Notification pop-toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-850 z-50"
          >
            <div className="p-1 rounded-full bg-emerald-500 text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Konfigurasi log sistem disimpan dengan sukses!</span>
          </motion.div>
        )}

        {saveUserSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-850 z-50 animate-fade-in"
          >
            <div className="p-1 rounded-full bg-emerald-500 text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Profil dan PIN kredensial tim berhasil diperbarui!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
