/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Phone, 
  Mail, 
  CheckSquare, 
  Target, 
  X, 
  Smartphone,
  UserSquare2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

export const TeamView: React.FC = () => {
  const { allUsers, currentUser, addUser, updateUser, switchUser, todos } = useApp();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [phone, setPhone] = useState('');
  const [targetFollowers, setTargetFollowers] = useState<number>(20000);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

  // Computed task counts for each staff/member
  const userStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; pct: number }> = {};
    
    allUsers.forEach(u => {
      const myTasks = todos.filter(t => t.assignedToId === u.id);
      const total = myTasks.length;
      const completed = myTasks.filter(t => t.status === 'SELESAI').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      stats[u.id] = { total, completed, pct };
    });

    return stats;
  }, [allUsers, todos]);

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setEmail('');
    setRole('STAFF');
    setPhone('');
    setTargetFollowers(2000);
    // select random high-quality vector faces to look gorgeous
    const faces = [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
    ];
    setAvatar(faces[Math.floor(Math.random() * faces.length)]);
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addUser({
      name,
      username: username || name.toLowerCase().replace(/\s+/g, '_'),
      email,
      role,
      phone,
      targetFollowers: Number(targetFollowers),
      avatar
    });

    setIsAddOpen(false);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email);
    setRole(user.role);
    setPhone(user.phone);
    setTargetFollowers(user.targetFollowers);
    setAvatar(user.avatar);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !name.trim() || !email.trim()) return;

    updateUser(selectedUser.id, {
      name,
      username,
      email,
      role,
      phone,
      targetFollowers: Number(targetFollowers),
      avatar
    });

    setIsEditOpen(false);
    setSelectedUser(null);
  };

  // Only Owner and Manager can invite/add new staffs
  const isSuper = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Top action grid */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Manajemen Anggota Tim Kreatif</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Lihat daftar petugas, tanggung jawab kinerja harian, target kontribusi followers, serta tukar hak akses secara instan.
          </p>
        </div>

        {isSuper && (
          <button
            id="add-team-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-transform hover:scale-[1.02] shadow-sm select-none"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Mendaftarkan Kru</span>
          </button>
        )}
      </div>

      {/* Grid of Team Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="team-cards-grid">
        {allUsers.map((user) => {
          const stats = userStats[user.id] || { total: 0, completed: 0, pct: 0 };
          const isActive = currentUser.id === user.id;

          return (
            <div 
              key={user.id} 
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${
                isActive 
                  ? 'border-red-500 ring-2 ring-red-500/10 dark:ring-red-950/20' 
                  : 'border-gray-200 dark:border-slate-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full select-none uppercase tracking-wider">
                  Sesi Aktif
                </span>
              )}

              {/* Bio block */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-slate-800 referrerNoReferrer"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{user.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">@{user.username}</span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        user.role === 'OWNER' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                          : user.role === 'MANAGER'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{user.phone || 'Tidak Ada Telepon'}</span>
                  </div>
                </div>

                {/* Score Card Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800/85 bg-gray-55/60 dark:bg-slate-950/20 p-2.5 rounded-lg text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-red-500" />
                      <span>Pelaporan Tugas</span>
                    </p>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">
                      {stats.completed} / {stats.total} <span className="text-[10px] text-gray-400 font-medium">({stats.pct}%)</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      <span>Target Kenaikan</span>
                    </p>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">
                      {user.targetFollowers.toLocaleString('id-ID')} <span className="text-[8px] font-medium text-gray-400">/bulan</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons Footer */}
              <div className="flex items-center justify-between mt-5 gap-3 border-t border-gray-50 dark:border-slate-800/40 pt-4">
                
                {/* Profile Editor switches */}
                <div className="flex items-center gap-2">
                  {isSuper && (
                    <button
                      id={`edit-team-${user.id}`}
                      onClick={() => handleOpenEdit(user)}
                      className="p-1 px-2.5 text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-900 border border-gray-100 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* Instant Profile Switcher (Simulation of dynamic workspace logins!) */}
                {!isActive ? (
                  <button
                    id={`login-as-btn-${user.id}`}
                    onClick={() => switchUser(user.id)}
                    className="p-1 px-3 bg-slate-900 hover:bg-red-600 dark:bg-slate-800 dark:hover:bg-red-650 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 transition-colors select-none"
                    title={`Masuk ke sistem sebagai nama ${user.name}`}
                  >
                    <span>Masuk Peran</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/45 rounded px-2.5 py-1">
                    Peran Berjalan
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD NEW TEAM REGISTER */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add-team-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Daftarkan Kru Anggota Baru</h4>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input 
                  id="form-team-name"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Andi Wijaya"
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Username</label>
                  <input 
                    id="form-team-username"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: andi_creative"
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Peran / Hak Akses</label>
                  <select
                    id="form-team-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="STAFF">Kreatif Staff</option>
                    <option value="MANAGER">Sosmed Manager</option>
                    <option value="OWNER">Owner / Admin Utama</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Alamat Email Kerja</label>
                <input 
                  id="form-team-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="andi@sosmedplaza.com"
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Nomor WhatsApp</label>
                  <input 
                    id="form-team-phone"
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Target Follower</label>
                  <input 
                    id="form-team-target"
                    type="number" 
                    value={targetFollowers}
                    onChange={(e) => setTargetFollowers(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-team-create"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-extrabold"
                >
                  Undang Kru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING USER DETAIL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-team-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Koreksi Akun Anggota Tim</h4>
              <button onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input 
                  id="form-edit-team-name"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Username</label>
                  <input 
                    id="form-edit-team-username"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Peran / Hak Akses</label>
                  <select
                    id="form-edit-team-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="STAFF">Kreatif Staff</option>
                    <option value="MANAGER">Sosmed Manager</option>
                    <option value="OWNER">Owner / Admin Utama</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Alamat Email Kerja</label>
                <input 
                  id="form-edit-team-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">WhatsApp</label>
                  <input 
                    id="form-edit-team-phone"
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Target Follower</label>
                  <input 
                    id="form-edit-team-target"
                    type="number" 
                    value={targetFollowers}
                    onChange={(e) => setTargetFollowers(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedUser(null); }}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-team-edit"
                  className="px-4 py-2 bg-slate-900 rounded-lg text-white text-xs font-extrabold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
