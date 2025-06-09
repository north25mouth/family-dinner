export type AttendanceStatus = 'present' | 'absent' | 'unknown';

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface AttendanceRecord {
  memberId: string;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  note?: string;
  updatedAt: Date;
}

export interface WeeklyAttendance {
  [date: string]: {
    [memberId: string]: AttendanceRecord;
  };
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  members: FamilyMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DailySummary {
  date: string;
  presentCount: number;
  totalMembers: number;
  presentMembers: string[];
  notes: string[];
}

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  dailySummaries: DailySummary[];
}

export interface Note {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD format
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM format
  deadlineTime: string; // HH:MM format
  notifyMembers: string[]; // member IDs
}

export interface Notification {
  id: string;
  type: 'reminder' | 'deadline' | 'status_change';
  title: string;
  message: string;
  targetMembers: string[];
  date: string;
  read: boolean;
  createdAt: Date;
}

export interface FamilySettings {
  familyId: string;
  notifications: NotificationSettings;
  timezone: string;
  lastSyncAt: Date;
} 