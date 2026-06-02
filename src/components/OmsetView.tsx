/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  X, 
  Coins, 
  TrendingUp, 
  ShoppingBag, 
  Tv, 
  ArrowUpRight,
  MessageCircle,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { SalesChannel, OmsetRecord } from '../types';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const OmsetView: React.FC = () => {
  const { 
    omsetRecords, 
    allUsers, 
    currentUser, 
    addOmsetRecord, 
    editOmsetRecord, 
    deleteOmsetRecord 
  } = useApp();

  // Filters State
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OmsetRecord | null>(null);

  // Form Fields
  const [nominal, setNominal] = useState<number>(0);
  const [channel, setChannel] = useState<SalesChannel>('SHOPEE');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Channel details formatting helper
  const channelMetadata: Record<SalesChannel, { label: string; bg: string; text: string; color: string }> = {
    SHOPEE: { label: 'Shopee Catalog', bg: 'bg-orange-100 text-orange-850', text: 'text-orange-600', color: '#ea580c' },
    TOKOPEDIA: { label: 'Tokopedia Store', bg: 'bg-emerald-100 text-emerald-850', text: 'text-emerald-600', color: '#16a34a' },
    TIKTOK_SHOP: { label: 'TikTok Shop', bg: 'bg-slate-100 text-slate-850', text: 'text-slate-800 dark:text-white', color: '#000000' },
    SHOPEE_LIVE: { label: 'Shopee Live Session', bg: 'bg-red-100 text-red-850', text: 'text-red-600', color: '#dc2626' },
    TIKTOK_LIVE: { label: 'TikTok Live Stream', bg: 'bg-rose-100 text-rose-850', text: 'text-rose-600', color: '#f43f5e' },
    WHATSAPP: { label: 'WhatsApp Order', bg: 'bg-teal-100 text-teal-850', text: 'text-teal-650', color: '#0d9488' },
    INSTAGRAM_DM: { label: 'Instagram DM Deal', bg: 'bg-pink-100 text-pink-850', text: 'text-pink-650', color: '#db2777' }
  };

  // Helper number formats to Rupiah
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // KPI calculations on filtered items
  const filteredRecords = useMemo(() => {
    let result = [...omsetRecords];

    if (filterChannel !== 'ALL') {
      result = result.filter(r => r.channel === filterChannel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.reportedByName.toLowerCase().includes(q) || 
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    if (filterStartDate) {
      result = result.filter(r => r.date >= filterStartDate);
    }

    if (filterEndDate) {
      result = result.filter(r => r.date <= filterEndDate);
    }

    // sort descending by date
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [omsetRecords, filterChannel, searchQuery, filterStartDate, filterEndDate]);

  // Combined stats
  const stats = useMemo(() => {
    const total = filteredRecords.reduce((sum, r) => sum + r.nominal, 0);
    
    // Live stream sales share
    const liveSales = filteredRecords
      .filter(r => r.channel === 'SHOPEE_LIVE' || r.channel === 'TIKTOK_LIVE')
      .reduce((sum, r) => sum + r.nominal, 0);

    const livePct = total > 0 ? Math.round((liveSales / total) * 100) : 0;

    // Highest channel contribution
    const channelSumMap: Record<string, number> = {};
    filteredRecords.forEach(r => {
      channelSumMap[r.channel] = (channelSumMap[r.channel] || 0) + r.nominal;
    });

    const sortedChannels = Object.entries(channelSumMap).sort((a, b) => b[1] - a[1]);
    const bestChannel = sortedChannels.length > 0 ? sortedChannels[0][0] : 'Belum Ada';
    const bestChannelVal = sortedChannels.length > 0 ? sortedChannels[0][1] : 0;

    return { total, liveSales, livePct, bestChannel, bestChannelVal };
  }, [filteredRecords]);

  // Recharts horizontal bar chart data mapping sales contribution per platform
  const barChartData = useMemo(() => {
    const map: Record<SalesChannel, number> = {} as Record<SalesChannel, number>;
    filteredRecords.forEach(r => {
      map[r.channel] = (map[r.channel] || 0) + r.nominal;
    });

    return Object.keys(map).map(chan => ({
      name: chan.replace('_', ' '),
      value: map[chan as SalesChannel],
      rawName: chan
    })).sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Submit new Omset
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return;

    addOmsetRecord({
      date,
      nominal: Number(nominal),
      channel,
      reportedById: currentUser.id,
      notes
    });

    setIsAddOpen(false);
  };

  // Open Edit Omset Modal
  const handleOpenEdit = (rec: OmsetRecord) => {
    setSelectedRecord(rec);
    setNominal(rec.nominal);
    setChannel(rec.channel);
    setDate(rec.date);
    setNotes(rec.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || nominal <= 0) return;

    editOmsetRecord(selectedRecord.id, {
      nominal: Number(nominal),
      channel,
      date,
      notes
    });

    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  const handleCloseModals = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  const isAuthorized = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 text-red-650 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Laporan Keuangan Terkunci</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              Log pembukuan omset penjualan online shop dan grafik pertumbuhan finansial harian merupakan rahasia operasional yang hanya berhak diakses oleh <span className="font-extrabold text-red-600">Manager</span> atau <span className="font-extrabold text-red-600">Owner</span>.
            </p>
          </div>
          <div className="p-3 bg-red-50/10 dark:bg-red-950/10 border border-red-100 dark:border-red-950/30 rounded-xl text-[10px] text-slate-500 font-semibold leading-relaxed">
            Wewenang keamanan multi-user aktif. Untuk mendaftarkan setoran / progres omset baru, silakan minta pimpinan Anda untuk memperbarui sesi login.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Top action layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Pembukuan Omset Toko Online</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Rekam uang masuk dari penjualan marketplace dan live-selling dalam rupiah.
          </p>
        </div>

        <button
          id="add-omset-btn"
          onClick={() => {
            setNominal(0);
            setChannel('SHOPEE');
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-transform hover:scale-[1.02] shadow-sm select-none"
        >
          <Plus className="w-4 h-4" />
          <span>Input Omset Masuk</span>
        </button>
      </div>

      {/* KPI Cards section based on filtered sales data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="omset-kpi-grid">
        
        {/* Card 1 - Total Sales Omset */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm rounded-xl p-5 flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Omset Berjalan (Terfilter)</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
              {formatRupiah(stats.total)}
            </h4>
            <p className="text-[10px] text-gray-400 font-medium mt-1">Total jumlah rekonsiliasi kas terkumpul</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 - Live stream sales contribution */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm rounded-xl p-5 flex items-center justify-between transition-colors">
          <div className="space-y-1 w-full mr-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontribusi Live Streaming</p>
              <span className="text-xs font-extrabold text-red-600">{stats.livePct}%</span>
            </div>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
              {formatRupiah(stats.liveSales)}
            </h4>
            <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-red-600 h-full rounded-full transition-all" 
                style={{ width: `${stats.livePct}%` }}
              ></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Tv className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 - Best contributing channel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm rounded-xl p-5 flex items-center justify-between transition-colors">
          <div className="space-y-1 truncate">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sektor Paling Menguntungkan</p>
            <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none truncate uppercase mt-1">
              {stats.bestChannel.replace('_', ' ')}
            </h4>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Menghasilkan {formatRupiah(stats.bestChannelVal)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Sales Contribution Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart contributor bar */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 lg:col-span-2 transition-colors">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Analisis Nominal Penjualan Per Saluran</h4>
            <p className="text-[11px] text-gray-400">Komparasi pendapatan kotor yang diperoleh kasir retail per channel</p>
          </div>
          
          <div className="h-64 mt-4" id="omset-comparison-bar-chart">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Belum ada data grafik</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={barChartData} layout="vertical" margin={{ left: 15, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#64748b" tickFormatter={(v: number) => `${v/1000000}JT`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#64748b" />
                  <RechartsTooltip formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => {
                      const meta = channelMetadata[entry.rawName as SalesChannel];
                      return <Cell key={`cell-${index}`} fill={meta?.color || '#ec4899'} />;
                    })}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Channels Information Cards */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 transition-colors flex flex-col justify-between">
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Katalog Saluran Aktif</h4>
            <p className="text-[11px] text-gray-400 leading-normal">Definisi retail sales funnel yang dipantau dalam Sosmed Plaza:</p>
            
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {(Object.keys(channelMetadata) as SalesChannel[]).map((chanKey) => {
                const info = channelMetadata[chanKey];
                const sumForThisChan = omsetRecords.filter(r => r.channel === chanKey).reduce((sum, r) => sum + r.nominal, 0);
                return (
                  <div key={chanKey} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }}></span>
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350">{info.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-650 dark:text-slate-200">{formatRupiah(sumForThisChan)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 italic">
            * Seluruh data kas bersifat dinamis dan dapat dikoreksi.
          </div>
        </div>

      </div>

      {/* Sales Transactions Grid list */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 transition-colors">
        
        {/* Search controls row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Buku Jurnal Penjualan</h4>
            <p className="text-[11px] text-gray-400">Total {filteredRecords.length} catatan omset retail harian terdaftar</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input 
                id="search-omset-input"
                type="text" 
                placeholder="Cari kasir / catatan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-[11px] pl-8 pr-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full sm:w-40"
              />
            </div>

            {/* Date filter start */}
            <input 
              id="filter-omset-start-date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="text-[10px] border border-gray-200 dark:border-slate-700 rounded-lg p-1 bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
              title="Tanggal Awal"
            />

            {/* Date filter end */}
            <input 
              id="filter-omset-end-date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="text-[10px] border border-gray-200 dark:border-slate-700 rounded-lg p-1 bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
              title="Tanggal Akhir"
            />

            {/* Channel filter select */}
            <select
              id="filter-omset-channel-select"
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-[11px] border border-gray-200 dark:border-slate-700 rounded-lg p-1 px-2.5 bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="ALL">Semua Saluran</option>
              <option value="SHOPEE">Shopee Catalog</option>
              <option value="TOKOPEDIA">Tokopedia Store</option>
              <option value="TIKTOK_SHOP">TikTok Shop</option>
              <option value="SHOPEE_LIVE">Shopee Live</option>
              <option value="TIKTOK_LIVE">TikTok Live</option>
              <option value="WHATSAPP">WhatsApp Order</option>
              <option value="INSTAGRAM_DM">Instagram DM</option>
            </select>
          </div>
        </div>

        {/* Responsive Table of Sales transaction */}
        <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-350 font-bold">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Saluran</th>
                <th className="p-3.5 text-right">Nominal Pendapatan</th>
                <th className="p-3.5">Pelapor (Kasir)</th>
                <th className="p-3.5">Catatan Tambahan</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800" id="omset-logs-tbody">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Tidak ditemukan data pelaporan omset toko online.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const meta = channelMetadata[rec.channel];
                  return (
                    <tr key={rec.id} className="hover:bg-gray-55 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium">
                      <td className="p-3.5 font-mono whitespace-nowrap">{rec.date}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${meta?.bg || 'bg-gray-100'} ${meta?.text || 'text-gray-800'}`}>
                          {rec.channel.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-white">
                        {formatRupiah(rec.nominal)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-extrabold">{rec.reportedByName}</td>
                      <td className="p-3.5 truncate max-w-[200px]" title={rec.notes}>{rec.notes || '-'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`edit-omset-${rec.id}`}
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            title="Koreksi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-omset-${rec.id}`}
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus catatan omset ini?')) {
                                deleteOmsetRecord(rec.id);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: INPUT TRANSAKSI OMSET */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add-omset-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Input Omset Baru</h4>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Saluran / Marketplace</label>
                <select
                  id="form-omset-channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as SalesChannel)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500"
                >
                  <option value="SHOPEE">Shopee Store Catalog</option>
                  <option value="TOKOPEDIA">Tokopedia Store Catalog</option>
                  <option value="TIKTOK_SHOP">TikTok Shop Bag</option>
                  <option value="SHOPEE_LIVE">Shopee Live Stream</option>
                  <option value="TIKTOK_LIVE">TikTok Live Stream</option>
                  <option value="WHATSAPP">WhatsApp CS Chat Deal</option>
                  <option value="INSTAGRAM_DM">Instagram Direct Message</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nominal Omset (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">Rp</span>
                  <input 
                    id="form-omset-nominal"
                    type="number" 
                    value={nominal || ''}
                    onChange={(e) => setNominal(Math.max(0, Number(e.target.value)))}
                    placeholder="Contoh: 3500000"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-extrabold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal Jurnal Transaksi</label>
                <input 
                  id="form-omset-date"
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan Tambahan</label>
                <input 
                  id="form-omset-notes"
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan singkat..."
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-omset-create"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-extrabold"
                >
                  Tambahkan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING OMSET RECORD */}
      {isEditOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-omset-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Koreksi Data Jurnal Omset</h4>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Funnel Saluran</label>
                <select
                  id="form-edit-omset-channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as SalesChannel)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="SHOPEE">Shopee Store Catalog</option>
                  <option value="TOKOPEDIA">Tokopedia Store Catalog</option>
                  <option value="TIKTOK_SHOP">TikTok Shop Bag</option>
                  <option value="SHOPEE_LIVE">Shopee Live Stream</option>
                  <option value="TIKTOK_LIVE">TikTok Live Stream</option>
                  <option value="WHATSAPP">WhatsApp CS Chat Deal</option>
                  <option value="INSTAGRAM_DM">Instagram Direct Message</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nominal Realisasi Terkoreksi (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">Rp</span>
                  <input 
                    id="form-edit-omset-nominal"
                    type="number" 
                    value={nominal || ''}
                    onChange={(e) => setNominal(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-extrabold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</label>
                <input 
                  id="form-edit-omset-date"
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan Tambahan</label>
                <input 
                  id="form-edit-omset-notes"
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-omset-edit"
                  className="px-4 py-2 bg-slate-900 rounded-lg text-white text-xs font-extrabold"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
