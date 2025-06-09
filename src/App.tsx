import React, { useState, useEffect } from 'react';
import { 
  FamilyMember, 
  AttendanceStatus, 
  WeeklyAttendance, 
  AttendanceRecord, 
  Note, 
  NotificationSettings as NotificationSettingsType,
  FamilySettings 
} from './types';
import { WeekNavigation } from './components/WeekNavigation';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { DailySummary } from './components/DailySummary';
import { MemberManagement } from './components/MemberManagement';
import { NoteModal } from './components/NoteModal';
import { NotificationSettings } from './components/NotificationSettings';
import { AuthComponent } from './components/AuthComponent';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { firestoreService } from './services/firestoreService';
import { getPreviousWeek, getNextWeek, formatDate } from './utils/dateUtils';
import { notificationService } from './services/notificationService';
import toast, { Toaster } from 'react-hot-toast';
import { Users, MessageSquare, Bell, Settings, Wifi, WifiOff } from 'lucide-react';

// デモデータ
const defaultMembers: FamilyMember[] = [
  { id: '1', name: 'お父さん', color: '#3B82F6', order: 1 },
  { id: '2', name: 'お母さん', color: '#EF4444', order: 2 },
  { id: '3', name: '太郎', color: '#10B981', order: 3 },
  { id: '4', name: '花子', color: '#F59E0B', order: 4 },
];

const defaultNotificationSettings: NotificationSettingsType = {
  enabled: false,
  reminderTime: '17:00',
  deadlineTime: '18:00',
  notifyMembers: [],
};

function App() {
  // 認証状態
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // データ状態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType>(defaultNotificationSettings);
  
  // UI状態
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [selectedDateForNote, setSelectedDateForNote] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const handleNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  // Firebase認証の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setAuthLoading(false);
      
      if (user) {
        // Firestoreサービスにユーザーを設定
        firestoreService.setUser(user);
        
        // 家族データが存在しない場合は初期化
        try {
          const family = await firestoreService.getFamily();
          if (!family) {
            await firestoreService.createFamily('我が家');
            await firestoreService.initializeDefaultData();
            toast.success('家族データを初期化しました');
          }
        } catch (error) {
          console.error('家族データの初期化エラー:', error);
        }
      } else {
        // ログアウト時のクリーンアップ
        firestoreService.cleanup();
        setMembers([]);
        setAttendance([]);
        setNotes([]);
        setNotificationSettings(defaultNotificationSettings);
      }
    });

    return () => unsubscribe();
  }, []);

  // データの購読（ユーザーがログインしている場合のみ）
  useEffect(() => {
    if (!user) return;

    const unsubscribes: (() => void)[] = [];

    try {
      // メンバーデータの購読
      const membersUnsubscribe = firestoreService.subscribeToMembers((newMembers) => {
        setMembers(newMembers);
      });
      unsubscribes.push(membersUnsubscribe);

      // 出席データの購読
      const attendanceUnsubscribe = firestoreService.subscribeToAttendance((newAttendance) => {
        setAttendance(newAttendance);
      });
      unsubscribes.push(attendanceUnsubscribe);

      // メモデータの購読
      const notesUnsubscribe = firestoreService.subscribeToNotes((newNotes) => {
        setNotes(newNotes);
      });
      unsubscribes.push(notesUnsubscribe);

      // 通知設定の購読
      const notificationUnsubscribe = firestoreService.subscribeToNotificationSettings((settings) => {
        setNotificationSettings(settings);
      });
      unsubscribes.push(notificationUnsubscribe);

      // 接続状態の監視
      const connectionUnsubscribe = firestoreService.subscribeToConnectionStatus((connected) => {
        setIsConnected(connected);
      });
      unsubscribes.push(connectionUnsubscribe);

    } catch (error) {
      console.error('データ購読エラー:', error);
      toast.error('データの同期に失敗しました');
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  // 通知サービス初期化
  useEffect(() => {
    notificationService.updateSettings(notificationSettings);
    
    return () => {
      notificationService.destroy();
    };
  }, [notificationSettings]);

  const handleAttendanceChange = (memberId: string, date: string, status: AttendanceStatus) => {
    const newRecord: AttendanceRecord = {
      memberId,
      date,
      status,
      updatedAt: new Date(),
    };

    setAttendance(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [memberId]: newRecord,
      },
    }));

    // 成功メッセージを表示
    const member = members.find(m => m.id === memberId);
    const statusText = status === 'present' ? '出席' : status === 'absent' ? '欠席' : '未定';
    toast.success(`${member?.name}さんの${formatDate(new Date(date), 'M月d日')}を${statusText}に変更しました`);

    // 状況変更通知を送信
    if (member && notificationSettings.enabled) {
      notificationService.sendStatusChangeNotification(
        member.name,
        formatDate(new Date(date), 'M月d日'),
        status
      );
    }
  };

  // メンバー管理
  const handleAddMember = async (memberData: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: Date.now().toString(),
    };
    setMembers(prev => [...prev, newMember]);
  };

  const handleUpdateMember = async (id: string, memberData: Partial<FamilyMember>) => {
    setMembers(prev => prev.map(member => 
      member.id === id ? { ...member, ...memberData } : member
    ));
  };

  const handleDeleteMember = async (id: string) => {
    setMembers(prev => prev.filter(member => member.id !== id));
    
    // そのメンバーの出席データも削除
    setAttendance(prev => {
      const newAttendance = { ...prev };
      Object.keys(newAttendance).forEach(date => {
        if (newAttendance[date][id]) {
          delete newAttendance[date][id];
        }
      });
      return newAttendance;
    });

    // そのメンバーのメモも削除
    setNotes(prev => prev.filter(note => note.memberId !== id));
  };

  // メモ機能
  const handleAddNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const handleUpdateNote = async (id: string, text: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, text, updatedAt: new Date() } : note
    ));
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  // 通知設定
  const handleUpdateNotificationSettings = async (settings: NotificationSettingsType) => {
    setNotificationSettings(settings);
    notificationService.updateSettings(settings);
  };

  // 日付別メモ表示
  const handleShowNotes = (date: string) => {
    setSelectedDateForNote(date);
    setShowNoteModal(true);
  };

  const getNotesForDate = (date: string) => {
    return notes.filter(note => note.date === date);
  };

  // ローディング状態の表示
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Firebase認証を確認中...</p>
        </div>
      </div>
    );
  }

  // 未認証時は認証画面を表示
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <AuthComponent user={user} onAuthStateChange={setUser} />
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  // 今日の日付をフォーマット
  const today = formatDate(new Date());

  // 今日のメモを取得
  const todayNotes = notes.filter(note => note.date === today);

  // 週間の出席データを整理
  const weeklyAttendanceData: { [date: string]: { [memberId: string]: AttendanceStatus } } = {};
  attendance.forEach(record => {
    if (!weeklyAttendanceData[record.date]) {
      weeklyAttendanceData[record.date] = {};
    }
    weeklyAttendanceData[record.date][record.memberId] = record.status;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🍽️ 家族夕飯カレンダー
          </h1>
          <p className="text-gray-600">
            家族全員の夕飯出席状況を簡単管理
          </p>
          
          {/* 機能ボタン */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={() => setShowMemberManagement(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Users size={16} className="mr-2" />
              メンバー管理
            </button>
            
            <button
              onClick={() => handleShowNotes(formatDate(new Date()))}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <MessageSquare size={16} className="mr-2" />
              今日のメモ
            </button>
            
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Bell size={16} className="mr-2" />
              通知設定
            </button>
          </div>
        </div>

        {/* 週間ナビゲーション */}
        <WeekNavigation
          currentDate={currentDate}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
        />

        {/* カレンダー */}
        <WeeklyCalendar
          currentDate={currentDate}
          members={members}
          attendance={weeklyAttendanceData}
          notes={notes}
          onAttendanceChange={handleAttendanceChange}
          onShowNotes={handleShowNotes}
        />

        {/* 今日のサマリー */}
        <DailySummary
          currentDate={currentDate}
          members={members}
          attendance={weeklyAttendanceData[today] || {}}
        />

        {/* 使い方ガイド */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📖 使い方
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="text-lg mr-2">🍽️</span>
              <div>
                <div className="font-medium">出席</div>
                <div>夕飯を一緒に食べます</div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">❌</span>
              <div>
                <div className="font-medium">欠席</div>
                <div>夕飯は食べません</div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">❓</span>
              <div>
                <div className="font-medium">未定</div>
                <div>まだ決まっていません</div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">👆</span>
              <div>
                <div className="font-medium">タップで変更</div>
                <div>アイコンをタップして状態を切り替え</div>
              </div>
            </div>
          </div>
        </div>

        {/* モーダル */}
        {showMemberManagement && (
          <MemberManagement
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onClose={() => setShowMemberManagement(false)}
            loading={loading}
          />
        )}

        {showNoteModal && selectedDateForNote && (
          <NoteModal
            date={selectedDateForNote}
            members={members}
            notes={getNotesForDate(selectedDateForNote)}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onClose={() => {
              setShowNoteModal(false);
              setSelectedDateForNote(null);
            }}
          />
        )}

        {showNotificationSettings && (
          <NotificationSettings
            settings={notificationSettings}
            members={members}
            onUpdateSettings={handleUpdateNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        )}
      </div>
      <Toaster position="top-center" />
    </div>
  );
}

export default App; 