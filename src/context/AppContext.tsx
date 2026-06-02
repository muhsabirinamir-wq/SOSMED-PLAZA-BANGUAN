/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  TodoItem, 
  SosmedRecord, 
  OmsetRecord, 
  ActivityLog, 
  TodoPriority, 
  TodoStatus, 
  SosmedPlatform, 
  SalesChannel, 
  UserRole,
  LoggingSettings
} from '../types';

interface AppContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  todos: TodoItem[];
  sosmedRecords: SosmedRecord[];
  omsetRecords: OmsetRecord[];
  activities: ActivityLog[];
  isDarkMode: boolean;
  
  // Authentications / Profile switching
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserProfile, 'id'>) => void;
  updateUser: (userId: string, data: Partial<UserProfile>) => void;
  
  // To-Do lists Actions (CRUD)
  addTodo: (todo: Omit<TodoItem, 'id' | 'assignedToName'>) => void;
  updateTodoStatus: (todoId: string, status: TodoStatus, notes?: string) => void;
  editTodo: (todoId: string, updated: Partial<TodoItem>) => void;
  deleteTodo: (todoId: string) => void;
  
  // Sosmed Metrics Actions (CRUD)
  addSosmedRecord: (record: Omit<SosmedRecord, 'id' | 'reportedByName'>) => void;
  editSosmedRecord: (id: string, updated: Partial<SosmedRecord>) => void;
  deleteSosmedRecord: (id: string) => void;
  
  // Omset Actions (CRUD)
  addOmsetRecord: (record: Omit<OmsetRecord, 'id' | 'reportedByName'>) => void;
  editOmsetRecord: (id: string, updated: Partial<OmsetRecord>) => void;
  deleteOmsetRecord: (id: string) => void;
  
  // Utilities
  toggleDarkMode: () => void;
  logActivity: (action: string, details: string, category?: 'logLoginSwitch' | 'logTodos' | 'logOmset' | 'logSosmed' | 'logTeam') => void;
  resetAllData: () => void;
  loggingSettings: LoggingSettings;
  updateLoggingSettings: (settings: Partial<LoggingSettings>) => void;
  clearActivityLogs: () => void;
  pendingUserForLogin: UserProfile | null;
  setPendingUserForLogin: (user: UserProfile | null) => void;
  confirmSwitchUser: (userId: string) => void;
  logSecurityAlert: (targetUser: UserProfile, enteredPin: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate helper to parse yesterday-to-today date ranges based on relative date
const getDateRelative = (daysOffset: number): string => {
  const baseDate = new Date('2026-06-02');
  baseDate.setDate(baseDate.getDate() - daysOffset);
  return baseDate.toISOString().split('T')[0];
};

// INITIAL SEED DATA
const defaultUsers: UserProfile[] = [
  {
    id: 'usr-1',
    name: 'Budi Santoso',
    username: 'budi_owner',
    email: 'budi.owner@sosmedplaza.com',
    role: 'OWNER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '081234567890',
    targetFollowers: 100000,
    pinCode: '0000',
  },
  {
    id: 'usr-2',
    name: 'Sinta Permata',
    username: 'sinta_mgr',
    email: 'sinta.manager@sosmedplaza.com',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    phone: '081987654321',
    targetFollowers: 75000,
    pinCode: '1234',
  },
  {
    id: 'usr-3',
    name: 'Rian Hidayat',
    username: 'rian_tiktok',
    email: 'rian.tiktok@sosmedplaza.com',
    role: 'STAFF',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '082122233344',
    targetFollowers: 50000,
    pinCode: '1234',
  },
  {
    id: 'usr-4',
    name: 'Amel Kusuma',
    username: 'amel_ig_fb',
    email: 'amel.instagram@sosmedplaza.com',
    role: 'STAFF',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    phone: '085733344455',
    targetFollowers: 30000,
    pinCode: '1234',
  },
  {
    id: 'usr-5',
    name: 'Kevin Pratama',
    username: 'kevin_cs',
    email: 'kevin.cs@sosmedplaza.com',
    role: 'STAFF',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    phone: '089844455566',
    targetFollowers: 20000,
    pinCode: '1234',
  }
];

const defaultTodos = (): TodoItem[] => [
  {
    id: 'todo-1',
    title: 'Post Video Trend di TikTok',
    description: 'Bikin konten transisi outfit fashion baru menggunakan sound viral minggu ini.',
    assignedToId: 'usr-3',
    assignedToName: 'Rian Hidayat',
    reporterId: 'usr-2',
    priority: 'TINGGI',
    status: 'SELESAI',
    date: getDateRelative(0),
    notesStaff: 'Sudah di-upload jam 10 pagi, engagement lumayan naik.',
    completedAt: '2026-06-02T11:20:00Z'
  },
  {
    id: 'todo-2',
    title: 'Optimasi Feed & Carousels Instagram',
    description: 'Upload 3 slide karosel tentang diskon gajian 6.6 yang segera berlangsung.',
    assignedToId: 'usr-4',
    assignedToName: 'Amel Kusuma',
    reporterId: 'usr-2',
    priority: 'TINGGI',
    status: 'SEDANG_DIKERJAKAN',
    date: getDateRelative(0),
    notesStaff: 'Sedang proses pembuatan grafis di Canva.'
  },
  {
    id: 'todo-3',
    title: 'Broadcast Penawaran 6.6 via WA Business',
    description: 'Gunakan fitur label WA untuk blasting prospek loyalis (disc 15%).',
    assignedToId: 'usr-5',
    assignedToName: 'Kevin Pratama',
    reporterId: 'usr-1',
    priority: 'TINGGI',
    status: 'BELUM_MULAI',
    date: getDateRelative(0),
  },
  {
    id: 'todo-4',
    title: 'Evaluasi Iklan Facebook (Meta Ads)',
    description: 'Analisa CPC & ROAS kampanye bulan Mei, sesuaikan budget untuk 6.6 promo.',
    assignedToId: 'usr-2',
    assignedToName: 'Sinta Permata',
    reporterId: 'usr-1',
    priority: 'SEDANG',
    status: 'SELESAI',
    date: getDateRelative(1),
    notesStaff: 'Laporan ROAS stabil di 3.8x, budget dinaikkan 20%.',
    completedAt: '2026-06-01T15:00:00Z'
  },
  {
    id: 'todo-5',
    title: 'Interaksi & Balas Komentar TikTok/IG',
    description: 'Balas minimal 50 komentar teratas untuk meningkatkan retensi algoritma.',
    assignedToId: 'usr-3',
    assignedToName: 'Rian Hidayat',
    reporterId: 'usr-2',
    priority: 'RENDAH',
    status: 'SELESAI',
    date: getDateRelative(1),
    notesStaff: 'Selesai semua, interaksi ramah.',
    completedAt: '2026-06-01T17:45:00Z'
  },
  {
    id: 'todo-6',
    title: 'Analisa Kompetitor Marketplace',
    description: 'Cek kompetitor utama di Shopee dan Tokopedia, amati banner promo dan harga jual.',
    assignedToId: 'usr-5',
    assignedToName: 'Kevin Pratama',
    reporterId: 'usr-2',
    priority: 'SEDANG',
    status: 'SELESAI',
    date: getDateRelative(2),
    notesStaff: 'Kompetitor banting harga di fashion muslim, kita harus tonjolkan bonus free gift.',
    completedAt: '2026-05-31T14:30:00Z'
  },
  {
    id: 'todo-7',
    title: 'Buat Video Unboxing di Facebook Watch',
    description: 'Live / rekaman unboxing paket hijab premium terbaru.',
    assignedToId: 'usr-4',
    assignedToName: 'Amel Kusuma',
    reporterId: 'usr-2',
    priority: 'SEDANG',
    status: 'SELESAI',
    date: getDateRelative(2),
    notesStaff: 'Uploaded. Dapat 400 views dalam waktu 3 jam.',
    completedAt: '2026-05-31T16:10:00Z'
  }
];

// Generates continuous data for 6 days
const defaultSosmedRecords = (): SosmedRecord[] => {
  const records: SosmedRecord[] = [];
  const platforms: SosmedPlatform[] = ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'MARKETPLACE'];
  
  // Seed numbers represent progressive growth of followers/leads
  const initialCounts: Record<SosmedPlatform, number> = {
    TIKTOK: 44250,
    INSTAGRAM: 12100,
    FACEBOOK: 8900,
    WHATSAPP: 3820, // WA leads count
    MARKETPLACE: 23410 // Store followers
  };

  const dailyGrowth: Record<SosmedPlatform, number[]> = {
    TIKTOK: [120, 150, 180, 210, 250, 310],
    INSTAGRAM: [35, 42, 50, 58, 62, 75],
    FACEBOOK: [12, 10, 15, 18, 22, 25],
    WHATSAPP: [40, 48, 55, 62, 70, 85],
    MARKETPLACE: [60, 75, 82, 90, 105, 120]
  };

  // Create over past 6 days
  for (let day = 5; day >= 0; day--) {
    const curDate = getDateRelative(day);
    platforms.forEach(plat => {
      // Accumulate growth up to that day
      let currentVal = initialCounts[plat];
      for (let i = 5; i > day; i--) {
        currentVal += dailyGrowth[plat][5 - i];
      }
      const growthToday = dailyGrowth[plat][5 - day];
      
      const reporter = plat === 'TIKTOK' ? defaultUsers[2] : 
                       plat === 'INSTAGRAM' || plat === 'FACEBOOK' ? defaultUsers[3] : 
                       defaultUsers[4];

      records.push({
        id: `sos-${plat}-${day}`,
        date: curDate,
        platform: plat,
        followersCount: currentVal + growthToday,
        growth: growthToday,
        reportedById: reporter.id,
        reportedByName: reporter.name,
        notes: `Update harian oleh ${reporter.name}`
      });
    });
  }

  return records;
};

const defaultOmsetRecords = (): OmsetRecord[] => {
  const records: OmsetRecord[] = [];
  const channels: SalesChannel[] = ['SHOPEE', 'TOKOPEDIA', 'TIKTOK_SHOP', 'SHOPEE_LIVE', 'TIKTOK_LIVE', 'WHATSAPP', 'INSTAGRAM_DM'];

  // Base daily nominals for channels
  const channelBase: Record<SalesChannel, number> = {
    SHOPEE: 2500000,
    TOKOPEDIA: 1800000,
    TIKTOK_SHOP: 3200000,
    SHOPEE_LIVE: 1500000,
    TIKTOK_LIVE: 2200000,
    WHATSAPP: 800000,
    INSTAGRAM_DM: 400000
  };

  // Generate for 6 days with some randomness
  for (let day = 5; day >= 0; day--) {
    const curDate = getDateRelative(day);
    channels.forEach((chan, idx) => {
      // deterministic but dynamic random factor
      const seed = (day * 3 + idx * 7) % 5;
      const multipliers = [1.0, 1.15, 0.9, 1.3, 1.05];
      const actualNominal = Math.round(channelBase[chan] * multipliers[seed]);

      const reporter = (chan === 'SHOPEE' || chan === 'TOKOPEDIA') ? defaultUsers[4] : 
                       (chan === 'TIKTOK_SHOP' || chan === 'TIKTOK_LIVE') ? defaultUsers[2] : 
                       defaultUsers[3]; // rest in instagram/wa

      records.push({
        id: `oms-${chan}-${day}`,
        date: curDate,
        nominal: actualNominal,
        channel: chan,
        reportedById: reporter.id,
        reportedByName: reporter.name,
        notes: `Input omset penjualan via ${chan} untuk tanggal tersebut. Tuntaskan!`
      });
    });
  }

  return records;
};

// Initial activities
const defaultActivities = (): ActivityLog[] => [
  {
    id: 'act-1',
    timestamp: new Date('2026-06-02T08:30:00Z').toISOString(),
    userId: 'usr-1',
    userName: 'Budi Santoso',
    userRole: 'OWNER',
    action: 'Login System',
    details: 'Owner melakukan login harian untuk memantau omset dan target.'
  },
  {
    id: 'act-2',
    timestamp: new Date('2026-06-02T09:15:00Z').toISOString(),
    userId: 'usr-2',
    userName: 'Sinta Permata',
    userRole: 'MANAGER',
    action: 'Assign To-do List',
    details: 'Menugaskan "Post Video Trend di TikTok" ke Rian Hidayat.'
  },
  {
    id: 'act-3',
    timestamp: new Date('2026-06-02T11:20:00Z').toISOString(),
    userId: 'usr-3',
    userName: 'Rian Hidayat',
    userRole: 'STAFF',
    action: 'Selesaikan Tugas',
    details: 'Menyelesaikan tugas "Post Video Trend di TikTok" dengan keterangan tambahan.'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data from LocalStorage or Fallback
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('sp_current_user');
    return stored ? JSON.parse(stored) : defaultUsers[0]; // Budi Owner is default login
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const stored = localStorage.getItem('sp_all_users');
    return stored ? JSON.parse(stored) : defaultUsers;
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const stored = localStorage.getItem('sp_todos');
    return stored ? JSON.parse(stored) : defaultTodos();
  });

  const [sosmedRecords, setSosmedRecords] = useState<SosmedRecord[]>(() => {
    const stored = localStorage.getItem('sp_sosmed');
    return stored ? JSON.parse(stored) : defaultSosmedRecords();
  });

  const [omsetRecords, setOmsetRecords] = useState<OmsetRecord[]>(() => {
    const stored = localStorage.getItem('sp_omset');
    return stored ? JSON.parse(stored) : defaultOmsetRecords();
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const stored = localStorage.getItem('sp_activities');
    return stored ? JSON.parse(stored) : defaultActivities();
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('sp_dark_mode');
    return stored ? JSON.parse(stored) === 'true' : false;
  });

  const [loggingSettings, setLoggingSettings] = useState<LoggingSettings>(() => {
    const stored = localStorage.getItem('sp_logging_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // use default
      }
    }
    return {
      logLoginSwitch: true,
      logTodos: true,
      logOmset: true,
      logSosmed: true,
      logTeam: true,
      retentionLimit: 100
    };
  });

  const [pendingUserForLogin, setPendingUserForLogin] = useState<UserProfile | null>(null);

  // Track data persistence to localStorage
  useEffect(() => {
    localStorage.setItem('sp_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sp_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('sp_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('sp_sosmed', JSON.stringify(sosmedRecords));
  }, [sosmedRecords]);

  useEffect(() => {
    localStorage.setItem('sp_omset', JSON.stringify(omsetRecords));
  }, [omsetRecords]);

  useEffect(() => {
    localStorage.setItem('sp_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('sp_logging_settings', JSON.stringify(loggingSettings));
  }, [loggingSettings]);

  useEffect(() => {
    localStorage.setItem('sp_dark_mode', isDarkMode ? 'true' : 'false');
    // Apply styling class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // LOG ACTIVITY HELPERS
  const logActivity = (
    action: string, 
    details: string, 
    category?: 'logLoginSwitch' | 'logTodos' | 'logOmset' | 'logSosmed' | 'logTeam'
  ) => {
    if (category && !loggingSettings[category]) {
      return;
    }

    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details
    };

    setActivities(prev => {
      const updated = [newLog, ...prev];
      const limit = loggingSettings.retentionLimit || 100;
      if (updated.length > limit) {
        return updated.slice(0, limit);
      }
      return updated;
    });
  };

  // AUTH & USERS
  const switchUser = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      if (found.role === 'MANAGER' || found.role === 'OWNER') {
        // Intercept and launch secure PIN login gate
        setPendingUserForLogin(found);
      } else {
        // Staff switches instantly
        setCurrentUser(found);
        if (loggingSettings.logLoginSwitch) {
          setActivities(prev => {
            const newLog: ActivityLog = {
              id: `act-${Date.now()}`,
              timestamp: new Date().toISOString(),
              userId: found.id,
              userName: found.name,
              userRole: found.role,
              action: 'Login Staff (Instant)',
              details: `Staff ${found.name} login sukses tanpa PIN keamanan.`
            };
            const updated = [newLog, ...prev];
            const limit = loggingSettings.retentionLimit || 100;
            if (updated.length > limit) {
              return updated.slice(0, limit);
            }
            return updated;
          });
        }
      }
    }
  };

  const confirmSwitchUser = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setPendingUserForLogin(null);
      if (loggingSettings.logLoginSwitch) {
        setActivities(prev => {
          const newLog: ActivityLog = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: found.id,
            userName: found.name,
            userRole: found.role,
            action: 'Login Berhasil',
            details: `Pengguna ${found.name} (${found.role}) meloloskan verifikasi PIN sesi.`
          };
          const updated = [newLog, ...prev];
          const limit = loggingSettings.retentionLimit || 100;
          if (updated.length > limit) {
            return updated.slice(0, limit);
          }
          return updated;
        });
      }
    }
  };

  const logSecurityAlert = (targetUser: UserProfile, enteredPin: string) => {
    if (loggingSettings.logLoginSwitch) {
      setActivities(prev => {
        const newLog: ActivityLog = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'PERCOBAAN LOGIN GAGAL',
          details: `Peringatan Keamanan: Percobaan login sebagai ${targetUser.name} dengan PIN salah ("${enteredPin}").`
        };
        const updated = [newLog, ...prev];
        const limit = loggingSettings.retentionLimit || 100;
        if (updated.length > limit) {
          return updated.slice(0, limit);
        }
        return updated;
      });
    }
  };

  const addUser = (userData: Omit<UserProfile, 'id'>) => {
    const newUser: UserProfile = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    setAllUsers(prev => [...prev, newUser]);
    logActivity('Daftar Tim Baru', `Mendaftarkan posisi ${newUser.role} atas nama ${newUser.name}.`, 'logTeam');
  };

  const updateUser = (userId: string, data: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...data }));
    }
    logActivity('Update Profil', `Memperbarui profil anggota tim ID: ${userId}.`, 'logTeam');
  };

  // TODOS CRUD
  const addTodo = (todoData: Omit<TodoItem, 'id' | 'assignedToName'>) => {
    const assignedUser = allUsers.find(u => u.id === todoData.assignedToId);
    if (!assignedUser) return;

    const newTodo: TodoItem = {
      ...todoData,
      id: `todo-${Date.now()}`,
      assignedToName: assignedUser.name,
    };

    setTodos(prev => [newTodo, ...prev]);
    logActivity('Tambah To-Do', `Membuat tugas baru "${newTodo.title}" untuk ditangani oleh ${newTodo.assignedToName}.`, 'logTodos');
  };

  const updateTodoStatus = (todoId: string, status: TodoStatus, notes?: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        const complTime = status === 'SELESAI' ? new Date().toISOString() : undefined;
        return { 
          ...todo, 
          status, 
          notesStaff: notes !== undefined ? notes : todo.notesStaff,
          completedAt: complTime
        };
      }
      return todo;
    }));

    const targetTodo = todos.find(t => t.id === todoId);
    if (targetTodo) {
      logActivity('Selesai/Progres To-Do', `Mengubah status tugas "${targetTodo.title}" menjadi ${status}.`, 'logTodos');
    }
  };

  const editTodo = (todoId: string, updated: Partial<TodoItem>) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        let namePatch = {};
        if (updated.assignedToId) {
          const ass = allUsers.find(u => u.id === updated.assignedToId);
          if (ass) namePatch = { assignedToName: ass.name };
        }
        return { ...todo, ...updated, ...namePatch };
      }
      return todo;
    }));
    logActivity('Edit To-Do', `Mengedit detail To-Do ID: ${todoId}.`, 'logTodos');
  };

  const deleteTodo = (todoId: string) => {
    const targetTodo = todos.find(t => t.id === todoId);
    setTodos(prev => prev.filter(t => t.id !== todoId));
    if (targetTodo) {
      logActivity('Hapus To-Do', `Menghapus tugas harian "${targetTodo.title}".`, 'logTodos');
    }
  };

  // SOSMED CRUD
  const addSosmedRecord = (rec: Omit<SosmedRecord, 'id' | 'reportedByName'>) => {
    const reporter = allUsers.find(u => u.id === rec.reportedById) || currentUser;
    
    // Check if progress already inputted today, to calculate correct growth
    const samePlatformYesterday = sosmedRecords
      .filter(s => s.platform === rec.platform)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    let growthValue = rec.growth;
    if (samePlatformYesterday && growthValue === 0) {
      growthValue = Math.max(0, rec.followersCount - samePlatformYesterday.followersCount);
    }

    const newRecord: SosmedRecord = {
      ...rec,
      id: `sos-${Date.now()}`,
      reportedByName: reporter.name,
      growth: growthValue
    };

    setSosmedRecords(prev => [newRecord, ...prev]);
    logActivity('Input Kenaikan Sosmed', `Mendata follower/leads baru di ${rec.platform}: +${growthValue} pengikut.`, 'logSosmed');
  };

  const editSosmedRecord = (id: string, updated: Partial<SosmedRecord>) => {
    setSosmedRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    logActivity('Edit Kenaikan Sosmed', `Memperbaiki log sosmed harian ID: ${id}.`, 'logSosmed');
  };

  const deleteSosmedRecord = (id: string) => {
    setSosmedRecords(prev => prev.filter(r => r.id !== id));
    logActivity('Hapus Log Sosmed', `Menghapus entri laporan perkembangan sosmed.`, 'logSosmed');
  };

  // OMSET CRUD
  const addOmsetRecord = (rec: Omit<OmsetRecord, 'id' | 'reportedByName'>) => {
    const reporter = allUsers.find(u => u.id === rec.reportedById) || currentUser;
    const newRecord: OmsetRecord = {
      ...rec,
      id: `oms-${Date.now()}`,
      reportedByName: reporter.name
    };

    setOmsetRecords(prev => [newRecord, ...prev]);
    logActivity('Input Omset Harian', `Melaporkan nominal omset Rp ${rec.nominal.toLocaleString('id-ID')} via ${rec.channel}.`, 'logOmset');
  };

  const editOmsetRecord = (id: string, updated: Partial<OmsetRecord>) => {
    setOmsetRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    logActivity('Edit Catatan Omset', `Memperbaiki nominal omset ID: ${id}.`, 'logOmset');
  };

  const deleteOmsetRecord = (id: string) => {
    setOmsetRecords(prev => prev.filter(r => r.id !== id));
    logActivity('Hapus Catatan Omset', `Menghapus log omset nominal dari pembukuan.`, 'logOmset');
  };

  // UTILITIES
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const updateLoggingSettings = (newSettings: Partial<LoggingSettings>) => {
    setLoggingSettings(prev => ({ ...prev, ...newSettings }));
  };

  const clearActivityLogs = () => {
    setActivities([]);
    if (loggingSettings.logTeam) {
      const clearLog: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Clear Audit Logs',
        details: 'Seluruh riwayat audit log aktivitas telah dibersihkan oleh pengguna.'
      };
      setActivities([clearLog]);
    }
  };

  const resetAllData = () => {
    setCurrentUser(defaultUsers[0]);
    setAllUsers(defaultUsers);
    setTodos(defaultTodos());
    setSosmedRecords(defaultSosmedRecords());
    setOmsetRecords(defaultOmsetRecords());
    setActivities(defaultActivities());
    logActivity('Reset Database', 'Mengembalikan seluruh parameter ke data pabrikan awal.', 'logTeam');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      allUsers,
      todos,
      sosmedRecords,
      omsetRecords,
      activities,
      isDarkMode,
      switchUser,
      addUser,
      updateUser,
      addTodo,
      updateTodoStatus,
      editTodo,
      deleteTodo,
      addSosmedRecord,
      editSosmedRecord,
      deleteSosmedRecord,
      addOmsetRecord,
      editOmsetRecord,
      deleteOmsetRecord,
      toggleDarkMode,
      logActivity,
      resetAllData,
      loggingSettings,
      updateLoggingSettings,
      clearActivityLogs,
      pendingUserForLogin,
      setPendingUserForLogin,
      confirmSwitchUser,
      logSecurityAlert
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
};
