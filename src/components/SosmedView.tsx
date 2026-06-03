/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Trash2, 
  Edit, 
  X, 
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { SosmedPlatform, SosmedRecord } from '../types';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export const SosmedView: React.FC = () => {
  const { 
    sosmedRecords, 
    allUsers, 
    currentUser, 
    addSosmedRecord, 
    editSosmedRecord, 
    deleteSosmedRecord 
  } = useApp();

  // Filter state
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Modals state
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SosmedRecord | null>(null);

  // Form Fields
  const [platform, setPlatform] = useState<SosmedPlatform>('TIKTOK');
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [growth, setGrowth] = useState<number>(0); // manual diff override
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Platforms details helper with specific colors for banners and icons
  const platformMetadata: Record<SosmedPlatform, { label: string; bg: string; text: string; border: string; accent: string }> = {
    TIKTOK: { label: 'TikTok Shop/Profile', bg: 'bg-black/10 dark:bg-black/40', text: 'text-slate-800 dark:text-slate-100', border: 'border-slate-300', accent: '#000000' },
    INSTAGRAM: { label: 'Instagram Feed/Stories', bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-900/40', accent: '#ec4899' },
    FACEBOOK: { label: 'Facebook Page/Watch', bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/40', accent: '#2563eb' },
    WHATSAPP: { label: 'WhatsApp Chat Leads', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/40', accent: '#16a34a' },
    MARKETPLACE: { label: 'Marketplace Shopee/Tokop', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/40', accent: '#ea580c' }
  };

  // Get active stats of followers by platform to display
  const platformHighlights = useMemo(() => {
    const highlights: Record<string, { latest: number; growthWeek: number; label: string }> = {};
    const platforms: SosmedPlatform[] = ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'MARKETPLACE'];

    platforms.forEach(plat => {
      const records = sosmedRecords.filter(r => r.platform === plat).sort((a, b) => b.date.localeCompare(a.date));
      const latestCount = records.length > 0 ? records[0].followersCount : 0;
      const weeklySum = records.slice(0, 7).reduce((sum, r) => sum + r.growth, 0);

      highlights[plat] = {
        latest: latestCount,
        growthWeek: weeklySum,
        label: platformMetadata[plat].label
      };
    });

    return highlights;
  }, [sosmedRecords]);

  // Filter Table entries
  const filteredRecords = useMemo(() => {
    let result = [...sosmedRecords];

    if (filterPlatform !== 'ALL') {
      result = result.filter(r => r.platform === filterPlatform);
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

    // Sort descending by date
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [sosmedRecords, filterPlatform, searchQuery, filterStartDate, filterEndDate]);

  // Area chart data mapping followers counts over date (pivoted by platform)
  const chartPivotData = useMemo(() => {
    // Collect all unique dates with explicit types to satisfy TS rules
    const uniqueDates = (Array.from(new Set(filteredRecords.map(r => r.date))) as string[]).sort((a, b) => a.localeCompare(b));
    
    return uniqueDates.map(d => {
      const row: any = { Tanggal: d.split('-').slice(1).join('/') }; // MM/DD
      
      const platforms: SosmedPlatform[] = ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'MARKETPLACE'];
      platforms.forEach(plat => {
        const match = filteredRecords.find(r => r.date === d && r.platform === plat);
        if (match) {
          row[plat] = match.followersCount;
        } else {
          // fallback to last date's count if missing
          const previousRecords = sosmedRecords
            .filter(r => r.platform === plat && r.date < d)
            .sort((a, b) => b.date.localeCompare(a.date));
          row[plat] = previousRecords.length > 0 ? previousRecords[0].followersCount : 0;
        }
      });

      return row;
    });
  }, [filteredRecords, sosmedRecords]);

  // Open Log Modal
  const handleOpenLog = () => {
    setPlatform('TIKTOK');
    setFollowersCount(0);
    setGrowth(0);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsLogOpen(true);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followersCount <= 0) return;

    addSosmedRecord({
      date,
      platform,
      followersCount: Number(followersCount),
      growth: Number(growth),
      reportedById: currentUser.id,
      notes
    });

    setIsLogOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: SosmedRecord) => {
    setSelectedRecord(rec);
    setPlatform(rec.platform);
    setFollowersCount(rec.followersCount);
    setGrowth(rec.growth);
    setDate(rec.date);
    setNotes(rec.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    editSosmedRecord(selectedRecord.id, {
      platform,
      followersCount: Number(followersCount),
      growth: Number(growth),
      date,
      notes
    });

    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    // Generate CSV headers
    const headers = ['Tanggal', 'Platform', 'Jumlah Pengikut', 'Kenaikan Pengikut', 'Reporter', 'Catatan'];
    
    // Map records to rows
    const rows = filteredRecords.map(rec => [
      rec.date,
      rec.platform,
      rec.followersCount,
      rec.growth,
      rec.reportedByName,
      rec.notes ? rec.notes.replace(/"/g, '""') : ''
    ]);
    
    // Combine to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');
    
    // Create Blob with UTF-8 BOM to display Indonesian characters properly in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download trigger programmatically
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const fileName = `laporan_pengikut_sosmed_makassar_${formattedDate}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Top action details */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Matriks Akun Sosial Media</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Pantau pertumbuhan followers dan prospek masuk harian secara transparan.
          </p>
        </div>

        <button
          id="log-growth-btn"
          onClick={handleOpenLog}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-transform hover:scale-[1.02] shadow-sm select-none"
        >
          <Plus className="w-4 h-4" />
          <span>Input Track Harian</span>
        </button>
      </div>

      {/* Platform Highlight Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="social-grid">
        {(Object.keys(platformHighlights) as SosmedPlatform[]).map((plat) => {
          const item = platformHighlights[plat];
          const meta = platformMetadata[plat];
          return (
            <div 
              key={plat} 
              className={`p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between`}
            >
              <div>
                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded ${meta.bg} ${meta.text}`}>
                  {plat}
                </span>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate mt-2">{item.label}</p>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white mt-1 leading-tight">
                  {item.latest.toLocaleString('id-ID')}
                </h4>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-slate-800/80">
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${
                  item.growthWeek >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}>
                  {item.growthWeek >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{item.growthWeek >= 0 ? `+${item.growthWeek}` : item.growthWeek} (7h)</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* PUSAT PENGATURAN TANGGAL & TEMPAT DOWNLOAD FILE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="tanggal-download-hub">
        
        {/* Card 1: Filter Pengikut Berdasarkan Rentang Tanggal */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 lg:col-span-2 transition-colors flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <span>Saring Rentang Tanggal Pertumbuhan Pengikut</span>
            </h4>
            <p className="text-[11px] text-gray-400 mt-1">
              Atur jangkauan pembukuan laporan pengikut untuk membatasi grafik dan log berkas secara real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Tanggal Mulai (Dari):
              </label>
              <input
                id="filter-sosmed-start-date"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-medium focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Tanggal Selesai (Sampai):
              </label>
              <input
                id="filter-sosmed-end-date"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-medium focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/60">
            <button
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors border border-slate-150 dark:border-slate-705"
            >
              Reset Filter Tanggal
            </button>
          </div>
        </div>

        {/* Card 2: Tempat Download Berkas / File Laporan */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 hover:border-red-100 dark:hover:border-red-955 transition-colors flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Tempat Download File Laporan</span>
            </h4>
            <p className="text-[11px] text-gray-400 mt-1">
              Unduh rekaman pertumbuhan pengikut sesuai parameter filter aktif di samping.
            </p>
          </div>

          <div className="my-4 p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60 rounded-lg space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400 font-semibold">Tipe Berkas:</span>
              <span className="font-bold text-slate-705 dark:text-slate-300">Spreadsheet (.CSV)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400 font-semibold">Jumlah Baris:</span>
              <span className="font-bold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                {filteredRecords.length} Baris Data
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400 font-semibold">Umpan Berkas:</span>
              <span className="font-bold text-slate-705 dark:text-slate-300">Excel UTF-8 BOM</span>
            </div>
          </div>

          <button
            id="download-sosmed-file-btn"
            onClick={handleExportCSV}
            className="w-full py-2.5 bg-red-650 hover:bg-red-750 text-white text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={filteredRecords.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Berkas Laporan Pengikut</span>
          </button>
        </div>

      </div>

      {/* Recharts Stacked Line tracking chart */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Grafik Akumulasi Pertumbuhan Pengikut</h4>
            <p className="text-[11px] text-gray-400">Tren pengawasan performa akun retail dari hari ke hari</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-[10px] text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 font-bold rounded">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Target: 100K TikTok</span>
          </div>
        </div>

        <div className="h-64" id="sosmed-curves-chart">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={chartPivotData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
              <XAxis dataKey="Tanggal" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#94a3b8" />
              <YAxis tickFormatter={(v: number) => v.toLocaleString('id-ID')} tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#94a3b8" />
              <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
              
              <Line type="monotone" dataKey="TIKTOK" stroke="#000" strokeWidth={2.5} name="TikTok" activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="INSTAGRAM" stroke="#ec4899" strokeWidth={2} name="Instagram" />
              <Line type="monotone" dataKey="FACEBOOK" stroke="#2563eb" strokeWidth={2} name="Facebook" />
              <Line type="monotone" dataKey="WHATSAPP" stroke="#16a34a" strokeWidth={2} name="WA Leads" />
              <Line type="monotone" dataKey="MARKETPLACE" stroke="#ea580c" strokeWidth={2} name="Shopee/Tokop" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Log / Table of reports Input */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Log Pengisian Pelaporan Sosmed</h4>
            <p className="text-[11px] text-gray-400">Dua digit audit tracking laporan tim</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Search reporter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input 
                id="search-sosmed-input"
                type="text" 
                placeholder="Cari reporter/catatan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-[11px] pl-8 pr-2.5 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full sm:w-48"
              />
            </div>

            {/* Platform selection Filter */}
            <select
              id="filter-sosmed-platform-select"
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="text-[11px] border border-gray-200 dark:border-slate-700 rounded-lg p-1 px-2.5 bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="ALL">Semua Platform</option>
              <option value="TIKTOK">TikTok</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="WHATSAPP">WhatsApp Leads</option>
              <option value="MARKETPLACE">Marketplace</option>
            </select>
          </div>
        </div>

        {/* Scrollable table log */}
        <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 font-bold">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Platform</th>
                <th className="p-3.5 text-right">Followers Saat Ini</th>
                <th className="p-3.5 text-right">Kenaikan (H+)</th>
                <th className="p-3.5">Reporter</th>
                <th className="p-3.5">Catatan/Keterangan</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800" id="sosmed-logs-tbody">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Tidak ditemukan data pelaporan sosial media.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const meta = platformMetadata[rec.platform];
                  return (
                    <tr key={rec.id} className="hover:bg-gray-55 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium">
                      <td className="p-3.5 font-mono whitespace-nowrap">{rec.date}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`text-[10px] uppercase. font-bold px-2 py-0.5 rounded ${meta.bg} ${meta.text}`}>
                          {rec.platform}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-extrabold">{rec.followersCount.toLocaleString('id-ID')}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className="text-emerald-600 font-extrabold flex items-center justify-end gap-0.5">
                          +{rec.growth}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-extrabold">{rec.reportedByName}</span>
                      </td>
                      <td className="p-3.5 truncate max-w-[200px]" title={rec.notes}>{rec.notes || '-'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`edit-sosmed-${rec.id}`}
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-sosmed-${rec.id}`}
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
                                deleteSosmedRecord(rec.id);
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

      {/* MODAL 1: INPUT TRACKING HARIAN */}
      {isLogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="log-sosmed-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Input Pelaporan Sosial Media</h4>
              <button onClick={() => setIsLogOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Pilih Saluran / Platform</label>
                <select
                  id="form-sosmed-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SosmedPlatform)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="TIKTOK">TikTok Profile / Shop</option>
                  <option value="INSTAGRAM">Instagram Feed / Stories</option>
                  <option value="FACEBOOK">Facebook Fan Page</option>
                  <option value="WHATSAPP">WhatsApp Chat Leads</option>
                  <option value="MARKETPLACE">Marketplace Shopee/Tokopedia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Angka Followers/Leads Terkini</label>
                <input 
                  id="form-sosmed-followers"
                  type="number" 
                  value={followersCount || ''}
                  onChange={(e) => setFollowersCount(Math.max(0, Number(e.target.value)))}
                  placeholder="Contoh: 45800"
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Selisih Kenaikan (H+)</label>
                  <input 
                    id="form-sosmed-growth"
                    type="number" 
                    value={growth || ''}
                    onChange={(e) => setGrowth(Number(e.target.value))}
                    placeholder="Auto / Isi manual"
                    className="w-full text-xs p-2.1 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                  <span className="text-[9px] text-gray-400">Kosongkan jika ingin auto-kalkulasi</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal Pelaporan</label>
                  <input 
                    id="form-sosmed-date"
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2.1 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan Tambahan</label>
                <input 
                  id="form-sosmed-notes"
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Naik karena ada video viral pagi"
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-sosmed-create"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-extrabold"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING RECORD */}
      {isEditOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-sosmed-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Koreksi Data Pelaporan Sosmed</h4>
              <button onClick={() => { setIsEditOpen(false); setSelectedRecord(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Platform / Saluran</label>
                <select
                  id="form-edit-sosmed-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SosmedPlatform)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="TIKTOK">TikTok Profile / Shop</option>
                  <option value="INSTAGRAM">Instagram Feed / Stories</option>
                  <option value="FACEBOOK">Facebook Fan Page</option>
                  <option value="WHATSAPP">WhatsApp Chat Leads</option>
                  <option value="MARKETPLACE">Marketplace Shopee/Tokopedia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Angka Followers/Leads Terkini</label>
                <input 
                  id="form-edit-sosmed-followers"
                  type="number" 
                  value={followersCount}
                  onChange={(e) => setFollowersCount(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Kenaikan (H+)</label>
                  <input 
                    id="form-edit-sosmed-growth"
                    type="number" 
                    value={growth}
                    onChange={(e) => setGrowth(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</label>
                  <input 
                    id="form-edit-sosmed-date"
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan Tambahan</label>
                <input 
                  id="form-edit-sosmed-notes"
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedRecord(null); }}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-sosmed-edit"
                  className="px-4 py-2 bg-slate-900 dark:bg-red-600 rounded-lg text-white text-xs font-extrabold"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
