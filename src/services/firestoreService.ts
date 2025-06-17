import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
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
  Family,
  WeeklyAttendance,
  AttendanceStatus
} from '../types';

export class FirestoreService {
  private static instance: FirestoreService;
  private user: User | null = null;
  private familyId: string | null = null;
  private initializationPromise: Promise<void> | null = null; // 初期化の重複実行を防ぐ

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
    const attendanceDocs = await getDocs(attendanceQuery);
    attendanceDocs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    
    // そのメンバーのメモを削除
    const notesQuery = query(
      collection(db, 'families', familyId, 'notes'),
      where('memberId', '==', memberId)
    );
    const notesDocs = await getDocs(notesQuery);
    notesDocs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

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



  // ========== Real-time Sync Utilities ==========

  async getConnectionStatus(): Promise<boolean> {
    try {
      // Firestoreの接続テスト用に軽量なクエリを実行
      const familyId = this.getUserFamilyId();
      await getDoc(doc(db, 'families', familyId));
      return true;
    } catch (error) {
      return false;
    }
  }

  subscribeToConnectionStatus(callback: (connected: boolean) => void): Unsubscribe {
    // Firestoreでは定期的に接続テストを実行
    const interval = setInterval(async () => {
      const connected = await this.getConnectionStatus();
      callback(connected);
    }, 10000); // 10秒間隔

    // 初回実行
    this.getConnectionStatus().then(callback);

    return () => clearInterval(interval);
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

  async ensureFamilyExists(): Promise<void> {
    // 既に初期化処理が実行中の場合は、その完了を待つ
    if (this.initializationPromise) {
      console.log('初期化処理が既に実行中です。完了を待機中...');
      await this.initializationPromise;
      return;
    }

    const familyId = this.getUserFamilyId();
    console.log('家族データ確認開始 - familyId:', familyId);
    
    // 初期化処理を開始し、Promiseを保存
    this.initializationPromise = this.performInitialization(familyId);
    
    try {
      await this.initializationPromise;
    } finally {
      // 初期化完了後はPromiseをクリア
      this.initializationPromise = null;
    }
  }

  private async performInitialization(familyId: string): Promise<void> {
    try {
      // 1. 家族データの存在確認と作成（必要に応じて）
      try {
        const family = await this.getFamily();
        
        if (!family) {
          console.log('家族データが存在しないため新規作成します');
          await this.createFamily('我が家');
          console.log('新しい家族データを作成しました');
        } else {
          console.log('既存の家族データを確認しました:', family.name);
        }
      } catch (familyError) {
        console.warn('家族データの処理でエラーが発生しましたが、メンバー確認を継続します:', familyError);
      }
      
      // 2. メンバーデータの存在確認（より確実な方法で）
      try {
        const membersSnapshot = await getDocs(collection(db, 'families', familyId, 'members'));
        console.log('メンバーコレクション確認 - 件数:', membersSnapshot.size);
        
        if (membersSnapshot.empty) {
          console.log('メンバーが存在しないためデフォルトメンバーを作成します');
          
          // 3. 再度確認してから作成（二重作成防止）
          const doubleCheckSnapshot = await getDocs(collection(db, 'families', familyId, 'members'));
          if (doubleCheckSnapshot.empty) {
            await this.initializeDefaultDataSafely(familyId);
            console.log('デフォルトメンバーを作成しました');
          } else {
            console.log('二重確認で既存メンバーが見つかりました。作成をスキップします。');
          }
        } else {
          console.log(`既存のメンバー ${membersSnapshot.size}人を確認しました`);
          membersSnapshot.forEach(doc => {
            const member = doc.data();
            console.log('- 既存メンバー:', member.name, '(order:', member.order, ')');
          });
        }
      } catch (memberError) {
        console.error('メンバーデータの処理でエラーが発生しました:', memberError);
        // メンバー関連のエラーは重要なので再スロー
        throw memberError;
      }
    } catch (error) {
      console.error('初期化処理でエラーが発生しました:', error);
      // 致命的でないエラーの場合は警告のみ
      if (error instanceof Error) {
        if (error.message.includes('offline') || error.message.includes('network')) {
          console.warn('ネットワークエラーのため初期化をスキップします');
          return; // ネットワークエラーは無視
        }
        if (error.message.includes('already-exists')) {
          console.log('データは既に存在しています');
          return; // 既存データがある場合は正常
        }
      }
      throw error;
    }
  }

  private async initializeDefaultDataSafely(familyId: string): Promise<void> {
    console.log('安全なデフォルトデータ初期化開始 - familyId:', familyId);
    
    // 一意な初期化フラグドキュメントを使用して重複作成を防ぐ
    const initFlagRef = doc(db, 'families', familyId, 'system', 'initialization');
    let shouldProceed = false;
    
    try {
      // 初期化フラグを原子的に設定（既に存在する場合は失敗）
      await setDoc(initFlagRef, {
        status: 'initializing',
        timestamp: serverTimestamp(),
        createdBy: this.user?.uid || 'anonymous'
      }, { merge: false }); // merge: false で既存ドキュメントがあれば失敗
      
      console.log('初期化フラグを設定しました');
      shouldProceed = true;
      
    } catch (error: any) {
      console.log('初期化フラグ設定時のエラー:', error);
      
      // フラグの存在確認
      try {
        const flagDoc = await getDoc(initFlagRef);
        if (flagDoc.exists()) {
          const flagData = flagDoc.data();
          console.log('初期化フラグが既に存在します:', flagData);
          
          // 初期化が完了済みの場合はスキップ
          if (flagData.status === 'completed') {
            console.log('初期化は既に完了しています。処理をスキップします。');
            return;
          }
          
          // 初期化中の場合も基本的にはスキップ
          console.log('他のプロセスが初期化中です。処理をスキップします。');
          return;
        } else {
          // フラグが存在しない場合は処理を続行
          console.log('フラグが存在しないため、処理を続行します');
          shouldProceed = true;
        }
      } catch (checkError) {
        console.warn('フラグ確認でエラーが発生しましたが、処理を続行します:', checkError);
        shouldProceed = true;
      }
    }

    if (!shouldProceed) {
      return;
    }

    try {
      // 最終確認：メンバーが本当に存在しないか確認
      const finalCheck = await getDocs(collection(db, 'families', familyId, 'members'));
      if (!finalCheck.empty) {
        console.log('最終確認でメンバーが見つかりました。作成をスキップします。');
        return;
      }

      // デフォルトメンバーを作成
      const batch = writeBatch(db);
      const defaultMembers = [
        { name: 'お父さん', color: '#3B82F6', order: 1 },
        { name: 'お母さん', color: '#EF4444', order: 2 },
        { name: '太郎', color: '#10B981', order: 3 },
        { name: '花子', color: '#F59E0B', order: 4 },
      ];

      console.log('作成するデフォルトメンバー:', defaultMembers.length + '人');
      defaultMembers.forEach((member, index) => {
        console.log(`- ${index + 1}: ${member.name} (${member.color})`);
        const memberRef = doc(collection(db, 'families', familyId, 'members'));
        batch.set(memberRef, member);
      });

      await batch.commit();
      console.log('デフォルトメンバーのバッチ作成完了');
      
      // 初期化完了フラグを更新
      try {
        await updateDoc(initFlagRef, {
          status: 'completed',
          completedAt: serverTimestamp()
        });
      } catch (updateError) {
        console.warn('完了フラグの更新に失敗しましたが、処理は正常に完了しました:', updateError);
      }
      
    } catch (error) {
      console.error('メンバー作成でエラーが発生しました:', error);
      // 初期化失敗時はフラグを削除
      try {
        await deleteDoc(initFlagRef);
      } catch (deleteError) {
        console.warn('初期化フラグの削除に失敗:', deleteError);
      }
      throw error;
    }
  }

  // ========== Cleanup ==========

  cleanup() {
    this.user = null;
    this.familyId = null;
    this.initializationPromise = null; // 初期化状態もリセット
  }
}

// シングルトンインスタンスをエクスポート
export const firestoreService = FirestoreService.getInstance(); 