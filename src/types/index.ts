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

 