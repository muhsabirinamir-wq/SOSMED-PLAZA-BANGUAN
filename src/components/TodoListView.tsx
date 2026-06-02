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
  Check, 
  Play, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar,
  X,
  FileText
} from 'lucide-react';
import { TodoPriority, TodoStatus, TodoItem } from '../types';

export const TodoListView: React.FC = () => {
  const { 
    todos, 
    allUsers, 
    currentUser, 
    addTodo, 
    updateTodoStatus, 
    editTodo, 
    deleteTodo 
  } = useApp();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'PRIORITY_DESC'>('DATE_DESC');

  // Unique dates from todos to build filter and recap targets
  const uniqueTodoDates = useMemo(() => {
    const dates = Array.from(new Set(todos.map(t => t.date))) as string[];
    return dates.sort((a, b) => b.localeCompare(a));
  }, [todos]);

  // Overall stats for recap panel
  const summaryStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.status === 'SELESAI').length;
    const processing = todos.filter(t => t.status === 'SEDANG_DIKERJAKAN').length;
    const pending = todos.filter(t => t.status === 'BELUM_MULAI').length;
    const highPriority = todos.filter(t => t.priority === 'TINGGI').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, processing, pending, highPriority, pct };
  }, [todos]);

  // Date-wise To-Do list summary recap
  const dateWiseRecap = useMemo(() => {
    const recapMap: Record<string, { total: number; completed: number; processing: number; pending: number }> = {};
    
    todos.forEach(todo => {
      const d = todo.date || 'Tanpa Tanggal';
      if (!recapMap[d]) {
        recapMap[d] = { total: 0, completed: 0, processing: 0, pending: 0 };
      }
      recapMap[d].total += 1;
      if (todo.status === 'SELESAI') recapMap[d].completed += 1;
      else if (todo.status === 'SEDANG_DIKERJAKAN') recapMap[d].processing += 1;
      else recapMap[d].pending += 1;
    });

    return Object.keys(recapMap)
      .sort((a, b) => b.localeCompare(a))
      .map(d => ({
        date: d,
        ...recapMap[d],
        percentage: recapMap[d].total > 0 ? Math.round((recapMap[d].completed / recapMap[d].total) * 100) : 0
      }));
  }, [todos]);

  // Modals / Forms State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('SEDANG');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notesStaff, setNotesStaff] = useState('');

  // Computed data
  const staffMembers = useMemo(() => {
    return allUsers.filter(u => u.role === 'STAFF' || u.role === 'MANAGER');
  }, [allUsers]);

  // Open creation modal
  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    // pre-fill assignee to first staff teammate if present
    setAssignedToId(staffMembers[0]?.id || currentUser.id);
    setPriority('SEDANG');
    setDate(new Date().toISOString().split('T')[0]);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedToId) return;

    addTodo({
      title,
      description,
      assignedToId,
      reporterId: currentUser.id,
      priority,
      status: 'BELUM_MULAI',
      date
    });

    setIsCreateOpen(false);
  };

  // Open edit modal
  const handleOpenEdit = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description);
    setAssignedToId(todo.assignedToId);
    setPriority(todo.priority);
    setDate(todo.date);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTodo || !title.trim() || !assignedToId) return;

    editTodo(selectedTodo.id, {
      title,
      description,
      assignedToId,
      priority,
      date
    });

    setIsEditOpen(false);
    setSelectedTodo(null);
  };

  // Open finishing modal (staff submitting notes)
  const handleOpenComplete = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setNotesStaff(todo.notesStaff || '');
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTodo) return;

    updateTodoStatus(selectedTodo.id, 'SELESAI', notesStaff);
    setIsCompleteOpen(false);
    setSelectedTodo(null);
  };

  // Search and Filter logic
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }

    // Filter staff
    if (filterStaff !== 'ALL') {
      result = result.filter(t => t.assignedToId === filterStaff);
    }

    // Filter priority
    if (filterPriority !== 'ALL') {
      result = result.filter(t => t.priority === filterPriority);
    }

    // Filter status
    if (filterStatus !== 'ALL') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Filter date
    if (filterDate !== 'ALL') {
      result = result.filter(t => t.date === filterDate);
    }

    // Sorting
    if (sortBy === 'DATE_DESC') {
      result.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sortBy === 'DATE_ASC') {
      result.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortBy === 'PRIORITY_DESC') {
      const priorityWeight = { TINGGI: 3, SEDANG: 2, RENDAH: 1 };
      result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    }

    return result;
  }, [todos, searchQuery, filterStaff, filterPriority, filterStatus, filterDate, sortBy]);

  // Priority color badge helper
  const getPriorityBadgeClass = (p: TodoPriority) => {
    switch (p) {
      case 'TINGGI':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
      case 'SEDANG':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'RENDAH':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Status icon/color badge helper
  const getStatusBadge = (s: TodoStatus) => {
    switch (s) {
      case 'BELUM_MULAI':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3" />
            <span>Belum Mulai</span>
          </span>
        );
      case 'SEDANG_DIKERJAKAN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 animate-pulse">
            <Play className="w-3 h-3 fill-amber-500" />
            <span>Dikerjakan</span>
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
    }
  };

  // Authorization helper (Only owners and managers can write / edit / delete todo models)
  const canModifyTasks = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Top action grid */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Lapor Tugas Harian Tim Sosial Media</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Pantau rincian penugasan to-do list harian untuk tim sosial media retail Anda.
          </p>
        </div>

        {/* Create new task button (for managers/owners) */}
        {canModifyTasks ? (
          <button
            id="add-todo-btn"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-transform hover:scale-[1.02] shadow-sm select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tugas Baru</span>
          </button>
        ) : (
          <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700">
            Staff View • Status Pelaporan Tugas Aktif
          </div>
        )}
      </div>

      {/* SECTION: REKAPITULASI TO-DO LIST BERDASARKAN TANGGAL */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <span className="p-1 px-2.5 text-[10px] bg-red-150 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-extrabold rounded-lg">REKAP</span>
              <span>Rekapitulasi Tugas Harian per Hari / Tanggal</span>
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Analisis performa, rasio selesai kerja kru, dan pembagian job harian. Tekan tombol kartu tanggal untuk menyaring list tugas.
            </p>
          </div>
          {filterDate !== 'ALL' && (
            <button 
              onClick={() => setFilterDate('ALL')}
              className="text-[10px] font-bold text-red-600 hover:text-red-750 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 px-2.5 py-1 rounded-lg flex items-center gap-1 self-start sm:self-center transition-colors border border-red-200/50 dark:border-red-900/40"
            >
              <X className="w-3 h-3" />
              <span>Ganti ke Semua Tanggal ({filterDate})</span>
            </button>
          )}
        </div>

        {/* Mini stats cards inside Recap */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tugas Terjadwal</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{summaryStats.total} <span className="text-[10px] font-normal text-slate-400">Pekerjaan</span></p>
          </div>
          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/50 dark:border-emerald-950/20 shadow-sm">
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Tuntas Dikerjakan</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {summaryStats.completed} <span className="text-[10px] font-normal text-emerald-600/75">Selesai</span>
              <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                {summaryStats.pct}%
              </span>
            </p>
          </div>
          <div className="p-2.5 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl border border-amber-100/50 dark:border-amber-950/20 shadow-sm">
            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Sedang Dikerjakan</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-400">
              {summaryStats.processing} <span className="text-[10px] font-normal text-amber-650">Aktif</span>
            </p>
          </div>
          <div className="p-3 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-red-100/40 dark:border-red-950/20 shadow-sm">
            <p className="text-[9px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">Prioritas Utama (Tinggi)</p>
            <p className="text-lg font-black text-red-700 dark:text-red-400">
              {summaryStats.highPriority} <span className="text-[10px] font-normal text-red-600/75">Urgent</span>
            </p>
          </div>
        </div>

        {/* Date Wise List/Grid Wrap */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ringkasan Beban & Capaian Tugas per Tanggal (Klik Kartu Untuk Menyaring):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[190px] overflow-y-auto pr-1">
            {dateWiseRecap.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-full py-4 text-center">Belum ada tugas ber-tanggal terdaftar.</p>
            ) : (
              dateWiseRecap.map((item) => {
                const formatted = new Date(item.date).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                const isActiveDate = filterDate === item.date;

                return (
                  <button
                    key={item.date}
                    onClick={() => setFilterDate(isActiveDate ? 'ALL' : item.date)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 shadow-sm hover:scale-[1.015] duration-200 ${
                      isActiveDate 
                        ? 'bg-red-50/60 dark:bg-red-950/30 border-red-600 ring-1 ring-red-500 shadow-sm' 
                        : 'bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">{formatted}</p>
                        <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold">{item.date}</p>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        item.percentage === 100 
                          ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {item.percentage}% Selesai
                      </span>
                    </div>

                    {/* Task counts for this date */}
                    <div className="flex items-center gap-2 text-[9px] font-extrabold pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60 w-full justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Tugas: {item.total}</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-600">Selesai: {item.completed}</span>
                        {item.processing > 0 && <span className="text-amber-600 font-semibold">Kerja: {item.processing}</span>}
                        {item.pending > 0 && <span className="text-slate-400 dark:text-slate-500 font-semibold">Belum: {item.pending}</span>}
                      </div>
                    </div>

                    {/* Tiny progress indicator bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden shrink-0 mt-1">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          item.percentage === 100 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar row */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input 
              id="search-todo-input"
              type="text" 
              placeholder="Cari judul tugas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Filter Staff */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase shrink-0">Petugas:</span>
            <select
              id="filter-staff-select"
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="ALL">Semua Kru</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase shrink-0">Tanggal:</span>
            <select
              id="filter-date-select"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
            >
              <option value="ALL">Semua Tanggal</option>
              {uniqueTodoDates.map(d => {
                const formattedOpt = new Date(d).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                return <option key={d} value={d}>{formattedOpt}</option>;
              })}
            </select>
          </div>

          {/* Filter Priority */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase shrink-0">Prioritas:</span>
            <select
              id="filter-priority-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="TINGGI">Tinggi</option>
              <option value="SEDANG">Sedang</option>
              <option value="RENDAH">Rendah</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase shrink-0">Status:</span>
            <select
              id="filter-status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="ALL">Semua Tahap</option>
              <option value="BELUM_MULAI">Belum Mulai</option>
              <option value="SEDANG_DIKERJAKAN">Diperiksa/Dikerjakan</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>

        {/* Sorting options */}
        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-100 dark:border-slate-800/80">
          <span className="text-gray-400 font-medium font-mono">
            Ditemukan {filteredTodos.length} tugas terdaftar.
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Urutkan:</span>
            <select
              id="sort-todo-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-medium"
            >
              <option value="DATE_DESC">Tanggal (Terbaru)</option>
              <option value="DATE_ASC">Tanggal (Terlama)</option>
              <option value="PRIORITY_DESC">Prioritas Teratas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Todo List Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="todos-container">
        {filteredTodos.length === 0 ? (
          <div className="p-12 text-center md:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl space-y-3">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300">Tidak ada tugas dengan kriteria pencarian Anda</h5>
            <p className="text-xs text-gray-400">Silakan tambahkan tugas baru atau sesuaikan filter pencarian.</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const dateFormatted = new Date(todo.date).toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            });

            const isAssignedToMe = todo.assignedToId === currentUser.id;

            return (
              <div 
                key={todo.id} 
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 font-bold border rounded ${getPriorityBadgeClass(todo.priority)}`}>
                      PRIORITAS {todo.priority}
                    </span>
                    {getStatusBadge(todo.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight sm:text-base">
                      {todo.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-3 mt-1.5 leading-relaxed">
                      {todo.description || 'Tidak ada deskripsi rinci.'}
                    </p>
                  </div>

                  {/* Staff finishing comments if exists */}
                  {todo.notesStaff && (
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/80 rounded-lg text-xs border border-gray-100 dark:border-slate-700 space-y-1">
                      <p className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>Keterangan Hasil Kerja (Staff):</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 font-semibold italic">{todo.notesStaff}</p>
                    </div>
                  )}

                  {/* Assignee & Date Footer information */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-red-500" />
                      <span>PIC: <strong className="text-slate-700 dark:text-slate-300">{todo.assignedToName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Tanggal Tugas: <strong className="text-slate-700 dark:text-slate-300">{dateFormatted}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Individual Row Action control buttons */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-slate-800/40">
                  
                  {/* Delete/Edit actions only allowed for task owners/creators */}
                  {canModifyTasks && (
                    <>
                      <button 
                        id={`edit-todo-${todo.id}`}
                        onClick={() => handleOpenEdit(todo)}
                        className="p-1 px-2.5 text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-white border border-gray-200 dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-bold flex items-center gap-1"
                        title="Ubah Rincian Tugas"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Koreksi</span>
                      </button>
                      <button 
                        id={`delete-todo-${todo.id}`}
                        onClick={() => {
                          if (confirm(`Hapus tugas "${todo.title}"?`)) {
                            deleteTodo(todo.id);
                          }
                        }}
                        className="p-1 px-2.5 text-[10px] text-red-600 hover:text-red-700 border border-red-100 dark:border-red-950/60 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-bold flex items-center gap-1"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </>
                  )}

                  {/* Operational buttons for the Staff who is assigned the task */}
                  {isAssignedToMe && todo.status === 'BELUM_MULAI' && (
                    <button
                      id={`start-work-btn-${todo.id}`}
                      onClick={() => updateTodoStatus(todo.id, 'SEDANG_DIKERJAKAN')}
                      className="p-1 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 hover:scale-[1.02] transition-transform select-none"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Mulai Kerja</span>
                    </button>
                  )}

                  {isAssignedToMe && todo.status === 'SEDANG_DIKERJAKAN' && (
                    <button
                      id={`complete-work-btn-${todo.id}`}
                      onClick={() => handleOpenComplete(todo)}
                      className="p-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 hover:scale-[1.02] transition-transform select-none"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Laporkan Selesai</span>
                    </button>
                  )}

                  {/* Completed marker */}
                  {todo.status === 'SELESAI' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30">
                      Tugas Tuntas
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE NEW TASK */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="create-todo-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Tambah Penugasan Tim harian</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama / Judul Tugas</label>
                <input 
                  id="form-todo-title"
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Upload Outfit Idul Adha TikTok"
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Keterangan / Panduan Tugas</label>
                <textarea 
                  id="form-todo-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail action, tautan referensi sound, dll..."
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[80px]"
                />
              </div>

              {/* PIC Assigne Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Pilih Petugas (PIC)</label>
                <select
                  id="form-todo-assignee"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Prioritas</label>
                  <select
                    id="form-todo-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="TINGGI">Tinggi</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="RENDAH">Rendah</option>
                  </select>
                </div>

                {/* Deadline Target Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal Pelaksanaan Tugas</label>
                  <input
                    id="form-todo-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-todo-create"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-extrabold transition-transform active:scale-95"
                >
                  Menugaskan Tim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING TASK */}
      {isEditOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-todo-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight">Koreksi Detail Tugas</h4>
              <button onClick={() => { setIsEditOpen(false); setSelectedTodo(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama / Judul Tugas</label>
                <input 
                  id="form-edit-todo-title"
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Keterangan / Panduan Tugas</label>
                <textarea 
                  id="form-edit-todo-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[80px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Pilih Petugas (PIC)</label>
                <select
                  id="form-edit-todo-assignee"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  required
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Prioritas</label>
                  <select
                    id="form-edit-todo-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="TINGGI">Tinggi</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="RENDAH">Rendah</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal Pelaksanaan Tugas</label>
                  <input
                    id="form-edit-todo-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedTodo(null); }}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-todo-edit"
                  className="px-4 py-2 bg-slate-900 border border-slate-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg text-xs font-extrabold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STAFF REPORTING COMPLETION */}
      {isCompleteOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="report-complete-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl p-6 border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-tight text-emerald-600">Pelaporan Tugas Selesai</h4>
              <button onClick={() => { setIsCompleteOpen(false); setSelectedTodo(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Tugas Yang Tuntas:</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-white">{selectedTodo.title}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Keterangan Hasil Kerja (Kru Sosial Media)</label>
                <textarea 
                  id="form-complete-notes"
                  value={notesStaff}
                  onChange={(e) => setNotesStaff(e.target.value)}
                  placeholder="Contoh: Tautan video TikTok sudah live, atau screenshoot pengikut sudah di-screenshot..."
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px]"
                  required
                />
              </div>

              <p className="text-[10px] text-gray-400 italic">
                * Menekan tombol "Kirim Pelaporan" akan memindahkan status tugas harian ini ke Selesai dan dicatat di histori log audit Owner & Manager.
              </p>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsCompleteOpen(false); setSelectedTodo(null); }}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-todo-complete"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-extrabold transition-transform active:scale-95"
                >
                  Kirim Pelaporan Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
