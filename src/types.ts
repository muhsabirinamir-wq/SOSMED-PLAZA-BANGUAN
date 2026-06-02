/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  targetFollowers: number;
  pinCode?: string;
}

export type TodoPriority = 'TINGGI' | 'SEDANG' | 'RENDAH';
export type TodoStatus = 'BELUM_MULAI' | 'SEDANG_DIKERJAKAN' | 'SELESAI';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  reporterId: string; // manager or owner who checked/assigned
  priority: TodoPriority;
  status: TodoStatus;
  date: string; // YYYY-MM-DD
  notesStaff?: string;
  completedAt?: string;
}

export type SosmedPlatform = 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK' | 'WHATSAPP' | 'MARKETPLACE';

export interface SosmedRecord {
  id: string;
  date: string; // YYYY-MM-DD
  platform: SosmedPlatform;
  followersCount: number; // For WA, this can be total chat leads
  growth: number; // automatic or input difference
  reportedById: string;
  reportedByName: string;
  notes?: string;
}

export type SalesChannel = 'SHOPEE' | 'TOKOPEDIA' | 'TIKTOK_SHOP' | 'SHOPEE_LIVE' | 'TIKTOK_LIVE' | 'WHATSAPP' | 'INSTAGRAM_DM';

export interface OmsetRecord {
  id: string;
  date: string; // YYYY-MM-DD
  nominal: number;
  channel: SalesChannel;
  reportedById: string;
  reportedByName: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface LoggingSettings {
  logLoginSwitch: boolean;
  logTodos: boolean;
  logOmset: boolean;
  logSosmed: boolean;
  logTeam: boolean;
  retentionLimit: number; // e.g. 50, 100, 200 logs
}

