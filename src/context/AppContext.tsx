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

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

// CRITICAL CONSTRAINT: Test Firestore Connection on boot
async function testConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log("Firebase Connection Verified Successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    }
  }
}
testConnection();

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

const defaultSosmedRecords = (): SosmedRecord[] => {
  const records: SosmedRecord[] = [];
  const platforms: SosmedPlatform[] = ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'MARKETPLACE'];
  
  const initialCounts: Record<SosmedPlatform, number> = {
    TIKTOK: 44250,
    INSTAGRAM: 12100,
    FACEBOOK: 8900,
    WHATSAPP: 3820,
    MARKETPLACE: 23410
  };

  const dailyGrowth: Record<SosmedPlatform, number[]> = {
    TIKTOK: [120, 150, 180, 210, 250, 310],
    INSTAGRAM: [35, 42, 50, 58, 62, 75],
    FACEBOOK: [12, 10, 15, 18, 22, 25],
    WHATSAPP: [40, 48, 55, 62, 70, 85],
    MARKETPLACE: [60, 75, 82, 90, 105, 120]
  };

  for (let day = 5; day >= 0; day--) {
    const curDate = getDateRelative(day);
    platforms.forEach(plat => {
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

  const channelBase: Record<SalesChannel, number> = {
    SHOPEE: 2500000,
    TOKOPEDIA: 1800000,
    TIKTOK_SHOP: 3200000,
    SHOPEE_LIVE: 1500000,
    TIKTOK_LIVE: 2200000,
    WHATSAPP: 800000,
    INSTAGRAM_DM: 400000
  };

  for (let day = 5; day >= 0; day--) {
    const curDate = getDateRelative(day);
    channels.forEach((chan, idx) => {
      const seed = (day * 3 + idx * 7) % 5;
      const multipliers = [1.0, 1.15, 0.9, 1.3, 1.05];
      const actualNominal = Math.round(channelBase[chan] * multipliers[seed]);

      const reporter = (chan === 'SHOPEE' || chan === 'TOKOPEDIA') ? defaultUsers[4] : 
                       (chan === 'TIKTOK_SHOP' || chan === 'TIKTOK_LIVE') ? defaultUsers[2] : 
                       defaultUsers[3];

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
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('sp_current_user');
    return stored ? JSON.parse(stored) : defaultUsers[0];
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(defaultUsers);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [sosmedRecords, setSosmedRecords] = useState<SosmedRecord[]>([]);
  const [omsetRecords, setOmsetRecords] = useState<OmsetRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('sp_dark_mode');
    return stored ? JSON.parse(stored) === 'true' : false;
  });

  const [loggingSettings, setLoggingSettings] = useState<LoggingSettings>({
    logLoginSwitch: true,
    logTodos: true,
    logOmset: true,
    logSosmed: true,
    logTeam: true,
    retentionLimit: 100
  });

  const [pendingUserForLogin, setPendingUserForLogin] = useState<UserProfile | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);

  // Sign-in Anonymous State verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setIsFirebaseReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firebase Firestore Database Synchronization
  useEffect(() => {
    if (!isFirebaseReady) return;

    let active = true;
    let unsubUsers = () => {};
    let unsubTodos = () => {};
    let unsubSosmed = () => {};
    let unsubOmset = () => {};
    let unsubActivities = () => {};
    let unsubSettings = () => {};

    const syncFirestore = async () => {
      try {
        // Register ALL onSnapshot listeners immediately and in parallel.
        // This guarantees that any changes made by Staff (or anyone) are instantly synced
        // across screens of other logged-in users (like Managers) without waiting for network or check-locks.
        unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach(dSnapshot => {
            list.push(dSnapshot.data() as UserProfile);
          });
          list.sort((a,b) => a.id.localeCompare(b.id));
          setAllUsers(list);

          // Seed if database is completely empty
          if (active && snapshot.empty) {
            console.log("Database Firestore kosong, melakukan seed data awal...");
            const batch = writeBatch(db);

            defaultUsers.forEach(u => {
              batch.set(doc(db, 'users', u.id), u);
            });
            defaultTodos().forEach(t => {
              batch.set(doc(db, 'todos', t.id), t);
            });
            defaultSosmedRecords().forEach(s => {
              batch.set(doc(db, 'sosmedRecords', s.id), s);
            });
            defaultOmsetRecords().forEach(o => {
              batch.set(doc(db, 'omsetRecords', o.id), o);
            });
            defaultActivities().forEach(a => {
              batch.set(doc(db, 'activityLogs', a.id), a);
            });
            batch.set(doc(db, 'settings', 'logging'), {
              logLoginSwitch: true,
              logTodos: true,
              logOmset: true,
              logSosmed: true,
              logTeam: true,
              retentionLimit: 100
            });

            batch.commit().catch(err => {
              handleFirestoreError(err, OperationType.WRITE, 'seed-data-batch');
            });
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'users');
        });

        unsubTodos = onSnapshot(collection(db, 'todos'), (snapshot) => {
          const list: TodoItem[] = [];
          snapshot.forEach(dSnapshot => {
            list.push(dSnapshot.data() as TodoItem);
          });
          list.sort((a, b) => b.date.localeCompare(a.date));
          setTodos(list);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'todos');
        });

        unsubSosmed = onSnapshot(collection(db, 'sosmedRecords'), (snapshot) => {
          const list: SosmedRecord[] = [];
          snapshot.forEach(dSnapshot => {
            list.push(dSnapshot.data() as SosmedRecord);
          });
          list.sort((a, b) => b.date.localeCompare(a.date));
          setSosmedRecords(list);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'sosmedRecords');
        });

        unsubOmset = onSnapshot(collection(db, 'omsetRecords'), (snapshot) => {
          const list: OmsetRecord[] = [];
          snapshot.forEach(dSnapshot => {
            list.push(dSnapshot.data() as OmsetRecord);
          });
          list.sort((a, b) => b.date.localeCompare(a.date));
          setOmsetRecords(list);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'omsetRecords');
        });

        unsubActivities = onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
          const list: ActivityLog[] = [];
          snapshot.forEach(dSnapshot => {
            list.push(dSnapshot.data() as ActivityLog);
          });
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setActivities(list);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'activityLogs');
        });

        unsubSettings = onSnapshot(doc(db, 'settings', 'logging'), (dSnapshot) => {
          if (dSnapshot.exists()) {
            setLoggingSettings(dSnapshot.data() as LoggingSettings);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'settings/logging');
        });

      } catch (err) {
        console.error("Gagal sinkronisasi data dengan Firebase.", err);
      }
    };

    syncFirestore();

    return () => {
      active = false;
      unsubUsers();
      unsubTodos();
      unsubSosmed();
      unsubOmset();
      unsubActivities();
      unsubSettings();
    };
  }, [isFirebaseReady]);

  // Handle active client side device settings persistence
  useEffect(() => {
    localStorage.setItem('sp_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sp_dark_mode', isDarkMode ? 'true' : 'false');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Keep active login in sync with allUsers to avoid stale state
  useEffect(() => {
    const fresh = allUsers.find(u => u.id === currentUser.id);
    if (fresh) {
      if (
        fresh.name !== currentUser.name ||
        fresh.username !== currentUser.username ||
        fresh.email !== currentUser.email ||
        fresh.role !== currentUser.role ||
        fresh.avatar !== currentUser.avatar ||
        fresh.phone !== currentUser.phone ||
        fresh.targetFollowers !== currentUser.targetFollowers ||
        fresh.pinCode !== currentUser.pinCode
      ) {
        setCurrentUser(fresh);
      }
    }
  }, [allUsers, currentUser.id]);

  // LOG ACTIVITY HELPER
  const logActivity = async (
    action: string, 
    details: string, 
    category?: 'logLoginSwitch' | 'logTodos' | 'logOmset' | 'logSosmed' | 'logTeam'
  ) => {
    if (category && !loggingSettings[category]) {
      return;
    }

    const logId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newLog: ActivityLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details
    };

    try {
      await setDoc(doc(db, 'activityLogs', logId), newLog);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `activityLogs/${logId}`);
    }
  };

  // PROFILE / USER SWITCHING
  const switchUser = async (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      if (found.role === 'MANAGER' || found.role === 'OWNER') {
        setPendingUserForLogin(found);
      } else {
        setCurrentUser(found);
        if (loggingSettings.logLoginSwitch) {
          const logId = `act-${Date.now()}`;
          const newLog: ActivityLog = {
            id: logId,
            timestamp: new Date().toISOString(),
            userId: found.id,
            userName: found.name,
            userRole: found.role,
            action: 'Login Staff (Instant)',
            details: `Staff ${found.name} login sukses tanpa PIN keamanan.`
          };
          await setDoc(doc(db, 'activityLogs', logId), newLog).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `activityLogs/${logId}`);
          });
        }
      }
    }
  };

  const confirmSwitchUser = async (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setPendingUserForLogin(null);
      if (loggingSettings.logLoginSwitch) {
        const logId = `act-${Date.now()}`;
        const newLog: ActivityLog = {
          id: logId,
          timestamp: new Date().toISOString(),
          userId: found.id,
          userName: found.name,
          userRole: found.role,
          action: 'Login Berhasil',
          details: `Pengguna ${found.name} (${found.role}) meloloskan verifikasi PIN sesi.`
        };
        await setDoc(doc(db, 'activityLogs', logId), newLog).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `activityLogs/${logId}`);
        });
      }
    }
  };

  const logSecurityAlert = async (targetUser: UserProfile, enteredPin: string) => {
    if (loggingSettings.logLoginSwitch) {
      const logId = `act-${Date.now()}`;
      const newLog: ActivityLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'PERCOBAAN LOGIN GAGAL',
        details: `Peringatan Keamanan: Percobaan login sebagai ${targetUser.name} dengan PIN salah ("${enteredPin}").`
      };
      await setDoc(doc(db, 'activityLogs', logId), newLog).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `activityLogs/${logId}`);
      });
    }
  };

  const addUser = async (userData: Omit<UserProfile, 'id'>) => {
    const newId = `usr-${Date.now()}`;
    const newUser: UserProfile = {
      ...userData,
      id: newId
    };
    try {
      await setDoc(doc(db, 'users', newId), newUser);
      await logActivity('Daftar Tim Baru', `Mendaftarkan posisi ${newUser.role} atas nama ${newUser.name}.`, 'logTeam');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${newId}`);
    }
  };

  const updateUser = async (userId: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      
      // Auto-propagate name change to associated collections
      if (data.name) {
        todos.forEach(async (todo) => {
          if (todo.assignedToId === userId) {
            await updateDoc(doc(db, 'todos', todo.id), { assignedToName: data.name! })
              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `todos/${todo.id}`));
          }
        });
        sosmedRecords.forEach(async (rec) => {
          if (rec.reportedById === userId) {
            await updateDoc(doc(db, 'sosmedRecords', rec.id), { reportedByName: data.name! })
              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `sosmedRecords/${rec.id}`));
          }
        });
        omsetRecords.forEach(async (rec) => {
          if (rec.reportedById === userId) {
            await updateDoc(doc(db, 'omsetRecords', rec.id), { reportedByName: data.name! })
              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `omsetRecords/${rec.id}`));
          }
        });
        activities.forEach(async (act) => {
          if (act.userId === userId) {
            await updateDoc(doc(db, 'activityLogs', act.id), { userName: data.name! })
              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `activityLogs/${act.id}`));
          }
        });
      }

      await logActivity('Update Profil', `Memperbarui profil anggota tim ID: ${userId} (${data.name || ''}).`, 'logTeam');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  // TODOS CRUD
  const addTodo = async (todoData: Omit<TodoItem, 'id' | 'assignedToName'>) => {
    const assignedUser = allUsers.find(u => u.id === todoData.assignedToId);
    if (!assignedUser) return;

    const newId = `todo-${Date.now()}`;
    const newTodo: TodoItem = {
      ...todoData,
      id: newId,
      assignedToName: assignedUser.name,
    };

    try {
      await setDoc(doc(db, 'todos', newId), newTodo);
      await logActivity('Tambah To-Do', `Membuat tugas baru "${newTodo.title}" untuk ditangani oleh ${newTodo.assignedToName}.`, 'logTodos');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `todos/${newId}`);
    }
  };

  const updateTodoStatus = async (todoId: string, status: TodoStatus, notes?: string) => {
    const complTime = status === 'SELESAI' ? new Date().toISOString() : null;
    const updatePayload: any = { status };
    if (notes !== undefined) {
      updatePayload.notesStaff = notes;
    }
    if (complTime) {
      updatePayload.completedAt = complTime;
    }

    try {
      await updateDoc(doc(db, 'todos', todoId), updatePayload);
      const targetTodo = todos.find(t => t.id === todoId);
      if (targetTodo) {
        await logActivity('Selesai/Progres To-Do', `Mengubah status tugas "${targetTodo.title}" menjadi ${status}.`, 'logTodos');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `todos/${todoId}`);
    }
  };

  const editTodo = async (todoId: string, updated: Partial<TodoItem>) => {
    let namePatch = {};
    if (updated.assignedToId) {
      const ass = allUsers.find(u => u.id === updated.assignedToId);
      if (ass) namePatch = { assignedToName: ass.name };
    }
    const updatePayload = { ...updated, ...namePatch };

    try {
      await updateDoc(doc(db, 'todos', todoId), updatePayload);
      await logActivity('Edit To-Do', `Mengedit detail To-Do ID: ${todoId}.`, 'logTodos');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `todos/${todoId}`);
    }
  };

  const deleteTodo = async (todoId: string) => {
    const targetTodo = todos.find(t => t.id === todoId);
    try {
      await deleteDoc(doc(db, 'todos', todoId));
      if (targetTodo) {
        await logActivity('Hapus To-Do', `Menghapus tugas harian "${targetTodo.title}".`, 'logTodos');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `todos/${todoId}`);
    }
  };

  // SOSMED CRUD
  const addSosmedRecord = async (rec: Omit<SosmedRecord, 'id' | 'reportedByName'>) => {
    const reporter = allUsers.find(u => u.id === rec.reportedById) || currentUser;
    
    const samePlatformYesterday = sosmedRecords
      .filter(s => s.platform === rec.platform)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    let growthValue = rec.growth;
    if (samePlatformYesterday && growthValue === 0) {
      growthValue = Math.max(0, rec.followersCount - samePlatformYesterday.followersCount);
    }

    const newId = `sos-${Date.now()}`;
    const newRecord: SosmedRecord = {
      ...rec,
      id: newId,
      reportedByName: reporter.name,
      growth: growthValue
    };

    try {
      await setDoc(doc(db, 'sosmedRecords', newId), newRecord);
      await logActivity('Input Kenaikan Sosmed', `Mendata follower/leads baru di ${rec.platform}: +${growthValue} pengikut.`, 'logSosmed');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sosmedRecords/${newId}`);
    }
  };

  const editSosmedRecord = async (id: string, updated: Partial<SosmedRecord>) => {
    try {
      await updateDoc(doc(db, 'sosmedRecords', id), updated);
      await logActivity('Edit Kenaikan Sosmed', `Memperbaiki log sosmed harian ID: ${id}.`, 'logSosmed');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sosmedRecords/${id}`);
    }
  };

  const deleteSosmedRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sosmedRecords', id));
      await logActivity('Hapus Log Sosmed', `Menghapus entri laporan perkembangan sosmed.`, 'logSosmed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `sosmedRecords/${id}`);
    }
  };

  // OMSET CRUD
  const addOmsetRecord = async (rec: Omit<OmsetRecord, 'id' | 'reportedByName'>) => {
    const reporter = allUsers.find(u => u.id === rec.reportedById) || currentUser;
    const newId = `oms-${Date.now()}`;
    const newRecord: OmsetRecord = {
      ...rec,
      id: newId,
      reportedByName: reporter.name
    };

    try {
      await setDoc(doc(db, 'omsetRecords', newId), newRecord);
      await logActivity('Input Omset Harian', `Melaporkan nominal omset Rp ${rec.nominal.toLocaleString('id-ID')} via ${rec.channel}.`, 'logOmset');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `omsetRecords/${newId}`);
    }
  };

  const editOmsetRecord = async (id: string, updated: Partial<OmsetRecord>) => {
    try {
      await updateDoc(doc(db, 'omsetRecords', id), updated);
      await logActivity('Edit Catatan Omset', `Memperbaiki nominal omset ID: ${id}.`, 'logOmset');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `omsetRecords/${id}`);
    }
  };

  const deleteOmsetRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'omsetRecords', id));
      await logActivity('Hapus Catatan Omset', `Menghapus log omset nominal dari pembukuan.`, 'logOmset');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `omsetRecords/${id}`);
    }
  };

  // UTILITIES
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const updateLoggingSettings = async (newSettings: Partial<LoggingSettings>) => {
    try {
      const merged = { ...loggingSettings, ...newSettings };
      await setDoc(doc(db, 'settings', 'logging'), merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `settings/logging`);
    }
  };

  const clearActivityLogs = async () => {
    try {
      const logsSnap = await getDocs(collection(db, 'activityLogs'));
      const batch = writeBatch(db);
      logsSnap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      if (loggingSettings.logTeam) {
        const clearLogId = `act-${Date.now()}`;
        const clearLog: ActivityLog = {
          id: clearLogId,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Clear Audit Logs',
          details: 'Seluruh riwayat audit log aktivitas telah dibersihkan oleh pengguna.'
        };
        await setDoc(doc(db, 'activityLogs', clearLogId), clearLog);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activityLogs`);
    }
  };

  const resetAllData = async () => {
    try {
      const collectionsToClear = ['users', 'todos', 'sosmedRecords', 'omsetRecords', 'activityLogs'];
      for (const col of collectionsToClear) {
        const snap = await getDocs(collection(db, col));
        const batch = writeBatch(db);
        snap.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      const batchSeed = writeBatch(db);
      defaultUsers.forEach(u => {
        batchSeed.set(doc(db, 'users', u.id), u);
      });
      defaultTodos().forEach(t => {
        batchSeed.set(doc(db, 'todos', t.id), t);
      });
      defaultSosmedRecords().forEach(s => {
        batchSeed.set(doc(db, 'sosmedRecords', s.id), s);
      });
      defaultOmsetRecords().forEach(o => {
        batchSeed.set(doc(db, 'omsetRecords', o.id), o);
      });
      defaultActivities().forEach(a => {
        batchSeed.set(doc(db, 'activityLogs', a.id), a);
      });
      batchSeed.set(doc(db, 'settings', 'logging'), {
        logLoginSwitch: true,
        logTodos: true,
        logOmset: true,
        logSosmed: true,
        logTeam: true,
        retentionLimit: 100
      });

      await batchSeed.commit();

      setCurrentUser(defaultUsers[0]);
      await logActivity('Reset Database', 'Mengembalikan seluruh parameter ke data pabrikan awal.', 'logTeam');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `resetAllData`);
    }
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
