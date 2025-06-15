import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  Unsubscribe,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { 
  FamilyMember, 
  AttendanceRecord, 
  Note, 
  NotificationSettings,
  Family,
  WeeklyAttendance,
  AttendanceStatus
} from '../types';

export class FirestoreService {
  private static instance: FirestoreService;
  private user: User | null = null;
  private familyId: string | null = null;

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  setUser(user: User | null) {
    this.user = user;
    // ユーザーネーム認証の場合はphotoURLからfamilyIdを取得、そうでなければUIDを使用
    if (user && user.photoURL && user.photoURL.startsWith('family_')) {
      this.familyId = user.photoURL;
    } else {
      this.familyId = user ? user.uid : null;
    }
  }

  private getUserFamilyId(): string {
    if (!this.user) {
      throw new Error('ユーザーがログインしていません');
    }
    
    // ユーザーネーム認証の場合はphotoURLからfamilyIdを取得
    if (this.user.photoURL && this.user.photoURL.startsWith('family_')) {
      return this.user.photoURL;
    }
    
    // 従来の匿名認証の場合はUIDを使用
    return this.user.uid;
  }

  // ========== Family Management ==========

  async createFamily(familyName: string): Promise<void> {
    const familyId = this.getUserFamilyId();
    const familyData: Omit<Family, 'id'> = {
      name: familyName,
      inviteCode: this.generateInviteCode(),
      members: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'families', familyId), {
      ...familyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  async getFamily(): Promise<Family | null> {
    const familyId = this.getUserFamilyId();
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (familyDoc.exists()) {
      const data = familyDoc.data();
      return {
        id: familyDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Family;
    }
    return null;
  }

  // ========== Members ==========

  subscribeToMembers(callback: (members: FamilyMember[]) => void): Unsubscribe {
    const familyId = this.getUserFamilyId();
    const membersQuery = query(
      collection(db, 'families', familyId, 'members'),
      orderBy('order', 'asc')
    );

    return onSnapshot(membersQuery, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FamilyMember[];
      callback(members);
    });
  }

  async addMember(memberData: Omit<FamilyMember, 'id'>): Promise<string> {
    const familyId = this.getUserFamilyId();
    const docRef = await addDoc(collection(db, 'families', familyId, 'members'), memberData);
    return docRef.id;
  }

  async updateMember(memberId: string, memberData: Partial<FamilyMember>): Promise<void> {
    const familyId = this.getUserFamilyId();
    await updateDoc(doc(db, 'families', familyId, 'members', memberId), memberData);
  }

  async deleteMember(memberId: string): Promise<void> {
    const familyId = this.getUserFamilyId();
    const batch = writeBatch(db);

    // メンバーを削除
    batch.delete(doc(db, 'families', familyId, 'members', memberId));

    // そのメンバーの出席データを削除
    const attendanceQuery = query(
      collection(db, 'families', familyId, 'attendance'),
      where('memberId', '==', memberId)
    );
    
    // そのメンバーのメモを削除
    const notesQuery = query(
      collection(db, 'families', familyId, 'notes'),
      where('memberId', '==', memberId)
    );

    await batch.commit();
  }

  // ========== Attendance ==========

  subscribeToAttendance(callback: (attendance: WeeklyAttendance) => void): Unsubscribe {
    const familyId = this.getUserFamilyId();
    const attendanceQuery = query(
      collection(db, 'families', familyId, 'attendance'),
      orderBy('date', 'desc')
    );

    return onSnapshot(attendanceQuery, (snapshot) => {
      const weeklyAttendance: WeeklyAttendance = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const record: AttendanceRecord = {
          memberId: data.memberId,
          date: data.date,
          status: data.status,
          note: data.note,
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
        
        if (!weeklyAttendance[record.date]) {
          weeklyAttendance[record.date] = {};
        }
        weeklyAttendance[record.date][record.memberId] = record;
      });
      
      callback(weeklyAttendance);
    });
  }

  async updateAttendance(memberId: string, date: string, status: AttendanceStatus): Promise<void> {
    const familyId = this.getUserFamilyId();
    const attendanceId = `${date}_${memberId}`;
    
    const record: AttendanceRecord = {
      memberId,
      date,
      status,
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'families', familyId, 'attendance', attendanceId), {
      ...record,
      updatedAt: serverTimestamp()
    });
  }

  // ========== Notes ==========

  subscribeToNotes(callback: (notes: Note[]) => void): Unsubscribe {
    const familyId = this.getUserFamilyId();
    const notesQuery = query(
      collection(db, 'families', familyId, 'notes'),
      orderBy('date', 'desc')
    );

    return onSnapshot(notesQuery, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Note[];
      callback(notes);
    });
  }

  async addNote(memberId: string, date: string, text: string): Promise<string> {
    const familyId = this.getUserFamilyId();
    const noteData = {
      memberId,
      date,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'families', familyId, 'notes'), noteData);
    return docRef.id;
  }

  async updateNote(noteId: string, text: string): Promise<void> {
    const familyId = this.getUserFamilyId();
    await updateDoc(doc(db, 'families', familyId, 'notes', noteId), {
      text,
      updatedAt: serverTimestamp()
    });
  }

  async deleteNote(noteId: string): Promise<void> {
    const familyId = this.getUserFamilyId();
    await deleteDoc(doc(db, 'families', familyId, 'notes', noteId));
  }

  // ========== Notification Settings ==========

  subscribeToNotificationSettings(callback: (settings: NotificationSettings) => void): Unsubscribe {
    const familyId = this.getUserFamilyId();
    
    return onSnapshot(doc(db, 'families', familyId, 'settings', 'notifications'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as NotificationSettings);
      } else {
        // デフォルト設定を作成
        const defaultSettings: NotificationSettings = {
          enabled: false,
          reminderTime: '17:00',
          deadlineTime: '18:00',
          notifyMembers: []
        };
        callback(defaultSettings);
      }
    });
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    const familyId = this.getUserFamilyId();
    await setDoc(doc(db, 'families', familyId, 'settings', 'notifications'), settings);
  }

  // ========== Real-time Sync Utilities ==========

  async getConnectionStatus(): Promise<boolean> {
    try {
      const testDoc = await getDoc(doc(db, '.info/connected'));
      return testDoc.exists();
    } catch (error) {
      return false;
    }
  }

  subscribeToConnectionStatus(callback: (connected: boolean) => void): Unsubscribe {
    return onSnapshot(doc(db, '.info/connected'), (doc) => {
      callback(doc.exists());
    });
  }

  // ========== Utilities ==========

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async joinFamilyByInviteCode(inviteCode: string): Promise<boolean> {
    // 招待コード機能（今後実装予定）
    return false;
  }

  // ========== Batch Operations ==========

  async initializeDefaultData(): Promise<void> {
    const familyId = this.getUserFamilyId();
    const batch = writeBatch(db);

    // デフォルトメンバーを追加
    const defaultMembers = [
      { name: 'お父さん', color: '#3B82F6', order: 1 },
      { name: 'お母さん', color: '#EF4444', order: 2 },
      { name: '太郎', color: '#10B981', order: 3 },
      { name: '花子', color: '#F59E0B', order: 4 },
    ];

    defaultMembers.forEach((member, index) => {
      const memberRef = doc(collection(db, 'families', familyId, 'members'));
      batch.set(memberRef, member);
    });

    // デフォルト通知設定
    const notificationSettings: NotificationSettings = {
      enabled: false,
      reminderTime: '17:00',
      deadlineTime: '18:00',
      notifyMembers: []
    };
    
    batch.set(
      doc(db, 'families', familyId, 'settings', 'notifications'), 
      notificationSettings
    );

    await batch.commit();
  }

  // ========== Cleanup ==========

  cleanup() {
    this.user = null;
    this.familyId = null;
  }
}

// シングルトンインスタンスをエクスポート
export const firestoreService = FirestoreService.getInstance(); 