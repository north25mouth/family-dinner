import { useState, useEffect } from 'react';
import { 
  FamilyMember, 
  AttendanceStatus, 
  WeeklyAttendance, 
  Note
} from './types';
import { WeekNavigation } from './components/WeekNavigation';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { DailySummary } from './components/DailySummary';
import { MemberManagement } from './components/MemberManagement';
import { NoteModal } from './components/NoteModal';
import { ConnectionStatus } from './components/ConnectionStatus';
import { AuthComponent } from './components/AuthComponent';

import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import { firestoreService } from './services/firestoreService';
import { getPreviousWeek, getNextWeek, formatDate } from './utils/dateUtils';
import toast, { Toaster } from 'react-hot-toast';
import { Users, MessageSquare, HelpCircle, LogOut } from 'lucide-react';

function App() {
  // 認証状態
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // データ状態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [attendance, setAttendance] = useState<WeeklyAttendance>({});
  const [notes, setNotes] = useState<Note[]>([]);
  
  // UI状態
  const [currentTab, setCurrentTab] = useState<'calendar' | 'members'>('calendar');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDateForNote, setSelectedDateForNote] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);


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
        setAttendance({});
        setNotes([]);
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

  const handlePreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const handleNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  const handleAttendanceChange = async (memberId: string, date: string, status: AttendanceStatus) => {
    try {
      await firestoreService.updateAttendance(memberId, date, status);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('出席状況の更新に失敗しました');
    }
  };

  // メンバー管理
  const handleAddMember = async (memberData: Omit<FamilyMember, 'id'>) => {
    try {
      await firestoreService.addMember(memberData);
      toast.success('メンバーを追加しました');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('メンバーの追加に失敗しました');
    }
  };

  const handleUpdateMember = async (id: string, memberData: Partial<FamilyMember>) => {
    try {
      await firestoreService.updateMember(id, memberData);
      toast.success('メンバーを更新しました');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('メンバーの更新に失敗しました');
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await firestoreService.deleteMember(id);
      toast.success('メンバーを削除しました');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('メンバーの削除に失敗しました');
    }
  };

  // メモ機能
  const handleAddNote = async (memberId: string, date: string, text: string) => {
    try {
      await firestoreService.addNote(memberId, date, text);
      toast.success('メモを追加しました');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('メモの追加に失敗しました');
    }
  };

  const handleShowNotes = (date: string) => {
    setSelectedDateForNote(date);
    setShowNoteModal(true);
  };

  const getNotesForDate = (date: string) => {
    return notes.filter(note => note.date === date);
  };

  const handleShowUsage = () => {
    // 使い方ページを新しいタブで開く
    window.open('/usage.html', '_blank');
  };



  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('ログアウトしました');
    } catch (error: any) {
      toast.error(`ログアウトに失敗しました: ${error.message}`);
    }
  };

  // 認証ローディング中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合は認証画面を表示
  if (!user) {
    return <AuthComponent user={user} onAuthStateChange={setUser} />;
  }

  const today = formatDate(new Date());
  const todayAttendance = attendance[today] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* ヘッダー */}
        <header className="bg-white rounded-lg shadow-sm mb-3 sm:mb-6 p-3 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">家族夕飯カレンダー</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">みんなで夕飯を管理しよう</p>
            </div>
            <div className="flex items-center space-x-3">
              <ConnectionStatus isConnected={isConnected} />
              <div className="flex items-center text-sm text-gray-600">
                <Users size={16} className="mr-1" />
                <span className="hidden sm:inline">
                  {user?.displayName || 'ゲストユーザー'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-2 sm:px-3 py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                title="ログアウト"
              >
                <LogOut size={16} className="sm:mr-1" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentTab === 'calendar'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              カレンダー
            </button>
            <button
              onClick={() => setCurrentTab('members')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentTab === 'members'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users size={14} className="mr-1 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">メンバー管理</span>
              <span className="sm:hidden">メンバー</span>
            </button>

            <button
              onClick={handleShowUsage}
              className="flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <HelpCircle size={14} className="mr-1 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">使い方</span>
              <span className="sm:hidden">ヘルプ</span>
            </button>
          </div>
        </header>

        {/* 週間ナビゲーション */}
        {currentTab === 'calendar' && (
          <WeekNavigation
            currentDate={currentDate}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />
        )}

        {/* メインコンテンツ */}
        {currentTab === 'calendar' && (
          <>
            <WeeklyCalendar
              currentDate={currentDate}
              members={members}
              attendance={attendance}
              notes={notes}
              onAttendanceChange={handleAttendanceChange}
              onShowNotes={handleShowNotes}
            />

            <DailySummary
              currentDate={new Date()}
              members={members}
              attendance={attendance}
            />
          </>
        )}

        {currentTab === 'members' && (
          <MemberManagement
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onClose={() => setCurrentTab('calendar')}
          />
        )}

        {/* モーダル */}
        {showNoteModal && selectedDateForNote && (
          <NoteModal
            date={selectedDateForNote}
            members={members}
            notes={getNotesForDate(selectedDateForNote)}
            onAddNote={async (note) => {
              await handleAddNote(note.memberId, note.date, note.text);
            }}
            onUpdateNote={async () => {
              // TODO: 更新実装
            }}
            onDeleteNote={async () => {
              // TODO: 削除実装
            }}
            onClose={() => {
              setShowNoteModal(false);
              setSelectedDateForNote(null);
            }}
          />
        )}



        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </div>
  );
}

export default App; 