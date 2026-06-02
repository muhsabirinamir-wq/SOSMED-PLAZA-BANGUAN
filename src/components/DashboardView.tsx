/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Users2, 
  ArrowUpRight, 
  Flame, 
  Clock, 
  CheckSquare, 
  MessageCircle,
  ShoppingBag,
  Share2
} from 'lucide-react';
import { SalesChannel, SosmedPlatform } from '../types';

export const DashboardView: React.FC = () => {
  const { omsetRecords, todos, sosmedRecords, activities, allUsers, currentUser } = useApp();
  const isSuper = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';

  // Helper formatting numbers to Rupiah
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // KpI Calculations:
  // 1. Total Sales (Omset)
  const totalOmset = useMemo(() => {
    return omsetRecords.reduce((sum, rec) => sum + rec.nominal, 0);
  }, [omsetRecords]);

  // Daily Average Omset
  const averageOmset = useMemo(() => {
    if (omsetRecords.length === 0) return 0;
    // unique dates
    const uniqueDates = Array.from(new Set(omsetRecords.map(r => r.date))).length;
    return uniqueDates > 0 ? totalOmset / uniqueDates : 0;
  }, [omsetRecords, totalOmset]);

  // 2. To-Do List completeness
  const todoStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.status === 'SELESAI').length;
    const processing = todos.filter(t => t.status === 'SEDANG_DIKERJAKAN').length;
    const pending = todos.filter(t => t.status === 'BELUM_MULAI').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, processing, pending, pct };
  }, [todos]);

  // 3. Followers / Leads Progress
  const sosmedStats = useMemo(() => {
    // Current total follower count (latest record for each platform)
    const latestByPlatform: Record<string, number> = {};
    const latestDateByPlatform: Record<string, string> = {};
    
    sosmedRecords.forEach(rec => {
      const existingDate = latestDateByPlatform[rec.platform];
      if (!existingDate || rec.date > existingDate) {
        latestDateByPlatform[rec.platform] = rec.date;
        latestByPlatform[rec.platform] = rec.followersCount;
      }
    });

    const currentTotal = Object.values(latestByPlatform).reduce((sum, val) => sum + val, 0);
    // Total growth in the last 6 entries per platform
    const totalGrowth = sosmedRecords.reduce((sum, rec) => sum + rec.growth, 0);
    
    return { currentTotal, totalGrowth };
  }, [sosmedRecords]);

  // 4. Star Performer of tasks
  const starPerformer = useMemo(() => {
    const completions: Record<string, { name: string; avatar: string; count: number }> = {};
    
    todos.forEach(todo => {
      if (todo.status === 'SELESAI') {
        const staff = allUsers.find(u => u.id === todo.assignedToId);
        if (staff) {
          if (!completions[staff.id]) {
            completions[staff.id] = { name: staff.name, avatar: staff.avatar, count: 0 };
          }
          completions[staff.id].count += 1;
        }
      }
    });

    const sorted = Object.values(completions).sort((a, b) => b.count - a.count);
    return sorted.length > 0 ? sorted[0] : { name: 'Belum Ada', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', count: 0 };
  }, [todos, allUsers]);

  // Recharts Chart 1: Omset over Time (Line Chart)
  const lineChartData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    omsetRecords.forEach(rec => {
      dailyMap[rec.date] = (dailyMap[rec.date] || 0) + rec.nominal;
    });

    // sort key dates ascending
    return Object.keys(dailyMap)
      .sort((a, b) => a.localeCompare(b))
      .map(date => ({
        Tanggal: date.split('-').slice(1).join('/'), // format as MM/DD
        'Omset (Rp)': dailyMap[date],
      }));
  }, [omsetRecords]);

  // Recharts Chart 2: Sales Contribution by Channel (Donut / Pie Chart)
  const channelChartData = useMemo(() => {
    const channelMap: Record<SalesChannel, number> = {} as Record<SalesChannel, number>;
    omsetRecords.forEach(rec => {
      channelMap[rec.channel] = (channelMap[rec.channel] || 0) + rec.nominal;
    });

    return Object.keys(channelMap).map(channel => ({
      name: channel.replace('_', ' '),
      value: channelMap[channel as SalesChannel],
    }));
  }, [omsetRecords]);

  // Colors for sales channels
  const CHANNEL_COLORS = ['#dc2626', '#e11d48', '#f43f5e', '#fb7185', '#fca5a5', '#fee2e2', '#334155'];

  // Recharts Chart 3: Social Media Growth comparison (Bar Chart)
  const barChartData = useMemo(() => {
    const platformSum: Record<SosmedPlatform, number> = {} as Record<SosmedPlatform, number>;
    sosmedRecords.forEach(rec => {
      platformSum[rec.platform] = (platformSum[rec.platform] || 0) + rec.growth;
    });

    return Object.keys(platformSum).map(plat => ({
      Sosmed: plat,
      'Kenaikan Pengikut': platformSum[plat as SosmedPlatform]
    }));
  }, [sosmedRecords]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-slate-950 transition-colors">
      
      {/* Target & Welcome Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-6">
          <TrendingUp className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-white/20 rounded-full">
              Kuartal Target 2026
            </span>
            <span className="text-white/80 text-xs font-semibold">• Pasar Indonesia Retail</span>
          </div>
          <h3 className="text-xl font-black md:text-2xl tracking-tight">
            Dashboard Pemantauan Tim & Omset Toko Online
          </h3>
          <p className="text-sm text-red-50 font-medium">
            Sistem terintegrasi untuk melacak kenaikan followers Tiktok/Instagram harian, performa to-do list harian kru kreatif, dan omset real-time seluruh toko online retail Anda.
          </p>
          
          {isSuper ? (
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/20 mt-4 text-xs font-medium">
              <div>
                <p className="text-red-200">Target Omset Bulan Ini</p>
                <p className="text-lg font-bold">Rp 150.000.000</p>
              </div>
              <div>
                <p className="text-red-200">Realisasi Omset Berjalan</p>
                <p className="text-lg font-bold">{formatRupiah(totalOmset)}</p>
              </div>
              <div>
                <p className="text-red-200">Persentase Target</p>
                <p className="text-lg font-bold">{Math.min(100, Math.round((totalOmset / 150000000) * 100))}%</p>
              </div>
              <div>
                <p className="text-red-200">Tim Sosial Media</p>
                <p className="text-lg font-bold">{allUsers.filter(u => u.role === 'STAFF').length} Creative Staff</p>
              </div>
            </div>
          ) : (
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/20 mt-4 text-xs font-medium animate-fade-in">
              <div>
                <p className="text-red-200">Sesi Kerja Aktif</p>
                <p className="text-lg font-bold truncate uppercase">{currentUser.name.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-red-200">Hak Akses Sistem</p>
                <p className="text-lg font-bold text-amber-300">Staff Kreatif</p>
              </div>
              <div>
                <p className="text-red-200">Target Followers</p>
                <p className="text-lg font-bold">+{currentUser.targetFollowers.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-red-200">Tugas Belum Selesai</p>
                <p className="text-lg font-bold">
                  {todos.filter(t => t.assignedToId === currentUser.id && t.status !== 'SELESAI').length} Pekerjaan
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        
        {/* KPI 1 - Omset atau Tugas Saya */}
        {isSuper ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors animate-fade-in">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Omset</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
                {formatRupiah(totalOmset)}
              </h4>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" />
                Rerata {formatRupiah(averageOmset)} /hari
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors animate-fade-in">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tugas Kerja Aktif</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
                {todos.filter(t => t.assignedToId === currentUser.id && t.status !== 'SELESAI').length} Pekerjaan Sisa
              </h4>
              <p className="text-[10px] text-red-650 dark:text-red-400 font-bold flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-red-500 animate-pulse" />
                Selesaikan tugas harian Anda hari ini!
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/25 flex items-center justify-center text-red-600">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* KPI 2 - To-Do List Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1 w-full mr-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pekerjaan Harian</p>
              <span className="text-xs font-bold text-red-600">{todoStats.pct}% Selesai</span>
            </div>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
              {todoStats.completed} / {todoStats.total}
            </h4>
            <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-red-600 h-full rounded-full transition-all" 
                style={{ width: `${todoStats.pct}%` }}
              ></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 - Total Followers Growth */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Eksistensi Sosmed</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
              {sosmedStats.currentTotal.toLocaleString('id-ID')}
            </h4>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              +{sosmedStats.totalGrowth.toLocaleString('id-ID')} Pengikut Baru
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Users2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 - Star Performer */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Kru Paling Aktif</p>
            <div className="flex items-center gap-2 mt-1">
              <img 
                src={starPerformer.avatar} 
                alt={starPerformer.name} 
                className="w-6 h-6 rounded-full object-cover border border-gray-200 referrerNoReferrer"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                {starPerformer.name.split(' ')[0]}
              </span>
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Menyelesaikan {starPerformer.count} Tugas
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Charts Hub layout (Hanya untuk Owner & Manager) */}
      {isSuper && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

          {/* Line Chart - Daily Omset */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm lg:col-span-2 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tren Grafik Omset Penjualan Daily</h4>
                <p className="text-[11px] text-gray-400">Grafik akumulasi transaksi masuk per tanggal pembukuan</p>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded">Rupiah (IDR)</span>
            </div>
            <div className="h-64" id="omset-trend-chart">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={lineChartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="Tanggal" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#64748b" />
                  <YAxis tickFormatter={(v: number) => `${v/1000000}JT`} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#64748b" />
                  <RechartsTooltip 
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Omset']}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="Omset (Rp)" stroke="#dc2626" strokeWidth={3} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart - Sales split */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Distribusi Saluran</h4>
                <p className="text-[11px] text-gray-400">Channel penjualan paling menguntungkan</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded">Retail</span>
            </div>
            <div className="h-52 flex items-center justify-center relative" id="omset-donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={channelChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="block text-[10px] uppercase font-semibold text-gray-400">Total Omset</span>
                <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                  Rp {(totalOmset / 1000000).toFixed(1)}JT
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] border-t border-gray-100 dark:border-slate-800 pt-3">
              {channelChartData.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded shrink-0" style={{ backgroundColor: CHANNEL_COLORS[idx] }}></span>
                  <span className="text-gray-500 dark:text-gray-400 truncate uppercase font-bold">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      <div className={`grid grid-cols-1 ${isSuper ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        
        {/* Bar Chart - Social Media Growth */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Kenaikan Pengikut</h4>
              <p className="text-[11px] text-gray-400">Total pertumbuhan pengikut (termasuk prospek chat WA)</p>
            </div>
          </div>
          <div className="h-64" id="follower-growth-bar-chart">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Belum ada log sosmed</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={barChartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="Sosmed" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} stroke="#64748b" />
                  <RechartsTooltip formatter={(value: any) => [`+${value} Pengikut`]} />
                  <Bar dataKey="Kenaikan Pengikut" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* List of Recent activities log / Panduan Optimasi Konten (Gated for Staff) */}
        {isSuper ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm lg:col-span-2 transition-colors animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Log Aktivitas Tim Terbaru</h4>
                <p className="text-[11px] text-gray-400">Jejak audit kolaboratif tim sosial media & kasir retail</p>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1" id="activity-log-dashboard">
              {activities.length === 0 ? (
                <p className="text-xs text-center py-10 text-gray-400">Tidak ada audit aktivitas tim.</p>
              ) : (
                activities.slice(0, 5).map((act) => {
                  const dateObj = new Date(act.timestamp);
                  const clockFormatted = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                  
                  return (
                    <div key={act.id} className="flex gap-3 border-b border-gray-100 dark:border-slate-800/80 pb-2.5 last:border-0 last:pb-0">
                      <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase self-start w-16 text-center shrink-0 ${
                        act.userRole === 'OWNER' 
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : act.userRole === 'MANAGER'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}>
                        {act.userRole}
                      </span>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{act.userName}</span>
                          <span className="text-[9px] text-gray-400 whitespace-nowrap">{clockFormatted}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">{act.action}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{act.details}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors animate-fade-in flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>💡 Panduan Posting Konten & Live Harian</span>
              </h4>
              <p className="text-[11px] text-gray-400">Jadwal prime-time unggah konten & live streaming e-commerce</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg space-y-1.5 border border-slate-100 dark:border-slate-800/60">
                <p className="text-[11px] font-black text-red-600 uppercase">TikTok & Instagram</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">12:00 - 14:00 (WIB)</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">19:00 - 21:00 (WIB)</p>
                <p className="text-[10px] text-slate-400 font-medium">Fokus Video pendek/Reels fashion dengan sound tren baru.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg space-y-1.5 border border-slate-100 dark:border-slate-800/60">
                <p className="text-[11px] font-black text-amber-600 uppercase">Live Streaming Seller</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">19:30 - 22:30 (WIB)</p>
                <p className="text-[10px] text-slate-400 font-medium">Gunakan promo koin/diskon Shopee Live & TikTok Shop.</p>
              </div>
            </div>

            <div className="p-2.5 bg-red-50/10 dark:bg-red-950/10 border border-red-150/55 dark:border-red-900/35 rounded-lg text-[10px] text-slate-500 font-semibold leading-relaxed">
              Tagar Populer Hari Ini: <span className="font-extrabold text-red-600 text-[10px]">#RacunShopee #RetailFashion #FypIndonesia #TikTokShop</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
