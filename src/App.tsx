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
import { Footer } from './components/Footer';
import { SubPage } from './components/SubPages';
import { AccountDeletionSection } from './components/AccountDeletionSection';

import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import { firestoreService } from './services/firestoreService';
import { getPreviousWeek, getNextWeek, formatDate } from './utils/dateUtils';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Calendar,
  Users,
  HelpCircle,
  LogOut
} from 'lucide-react';

function App() {
  // 認証状態
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // データ状態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState<(() => void)[]>([]);
  
  // UI状態
  const [currentTab, setCurrentTab] = useState<'calendar' | 'members'>('calendar');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDateForNote, setSelectedDateForNote] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  
  // 初期化状態の管理
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFirstLoginHelp, setShowFirstLoginHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // ページ遷移処理
  const [currentPage, setCurrentPage] = useState('main');

  // Auth状態の変更をハンドリング
  const handleAuthChange = (newUser: User | null) => {
    setUser(newUser);
  };

  // デフォルトメンバーかどうかを判定する関数
  const isDefaultMemberSet = (members: FamilyMember[]): boolean => {
    if (members.length !== 4) return false;
    
    const defaultNames = ['お父さん', 'お母さん', '太郎', '花子'];
    const memberNames = members.map(m => m.name).sort();
    const sortedDefaultNames = [...defaultNames].sort();
    
    return JSON.stringify(memberNames) === JSON.stringify(sortedDefaultNames);
  };

  // 初回ユーザーかどうかを判定（ローカルストレージをチェック）
  useEffect(() => {
    if (user) {
      const hasVisitedBefore = localStorage.getItem(`visited_${user.uid}`);
      if (!hasVisitedBefore) {
        setIsFirstTimeUser(true);
        localStorage.setItem(`visited_${user.uid}`, 'true');
      } else {
        setIsFirstTimeUser(false);
      }
    }
  }, [user]);

  // 初回ログイン案内の通知を管理
  useEffect(() => {
    if (members.length > 0 && !dataLoading) {
      if (isDefaultMemberSet(members)) {
        // デフォルトメンバーの場合
        const timer = setTimeout(() => {
          if (isFirstTimeUser) {
            // 初回ユーザーの場合はチュートリアル
            setShowTutorial(true);
            toast('夕飯予定管理へようこそ！まずはメンバー管理から始めましょう。', {
              duration: 8000,
              id: 'welcome-tutorial',
              icon: '🍽️',
              style: {
                background: '#F59E0B',
                color: '#fff',
              }
            });
          }
          // 既存ユーザーの場合は何も表示しない（自動同期のため）
        }, 2000);
        
        return () => clearTimeout(timer);
      } else {
        // 実際のメンバーデータが表示されている場合は案内を非表示
        setShowFirstLoginHelp(false);
        setShowTutorial(false);
        toast.dismiss('welcome-tutorial');
      }
    }
  }, [members, dataLoading, isFirstTimeUser]);

  // Firebase認証の監視とデータ購読
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      
      if (firebaseUser) {
        try {
          setDataLoading(true);
          console.log('ユーザーログイン:', firebaseUser.uid);
          
          // FirestoreServiceにユーザーを設定
          firestoreService.setUser(firebaseUser);
          
          // 家族データの初期化を確実に実行（時間がかかってもOK）
          console.log('家族データの初期化開始...');
          await firestoreService.ensureFamilyExists();
          console.log('家族データの初期化完了');
          
          // データ購読を開始
          console.log('データ購読開始...');
          
          // メンバーデータの購読
          const unsubscribeMembers = firestoreService.subscribeToMembers((newMembers) => {
            console.log('メンバーデータ受信:', newMembers.length, '件');
            setMembers(newMembers);
            
            // 実際のメンバーデータが読み込まれた場合の処理
            if (newMembers.length > 0 && !isDefaultMemberSet(newMembers)) {
              setShowFirstLoginHelp(false);
              setShowTutorial(false);
              toast.dismiss('welcome-tutorial');
              
              // 実際のメンバーデータが読み込まれた場合の成功メッセージ
              toast.success('データが正常に読み込まれました', {
                duration: 3000,
                icon: '✅'
              });
            }
          });
          
          // 出席データの購読
          const unsubscribeAttendance = firestoreService.subscribeToAttendance((newAttendance) => {
            console.log('出席データ受信');
            setWeeklyAttendance(newAttendance);
          });
          
          // ノートデータの購読
          const unsubscribeNotes = firestoreService.subscribeToNotes((newNotes) => {
            console.log('ノートデータ受信:', newNotes.length, '件');
            setNotes(newNotes);
          });
          
          // 接続状態の購読
          const unsubscribeConnection = firestoreService.subscribeToConnectionStatus((connected) => {
            setIsOnline(connected);
          });
          
          console.log('すべてのデータ購読完了');
          setIsInitialized(true);
          setDataLoading(false);
          
          // クリーンアップ関数を保存
          setUnsubscribeFunctions([unsubscribeMembers, unsubscribeAttendance, unsubscribeNotes, unsubscribeConnection]);
          
        } catch (error) {
          console.error('データ初期化エラー:', error);
          setDataLoading(false);
          
          // 重要でないエラーの場合は処理を続行
          if (error instanceof Error && (
            error.message.includes('network') || 
            error.message.includes('offline') ||
            error.message.includes('timeout')
          )) {
            console.log('ネットワークエラーですが処理を続行します');
            setIsInitialized(true);
          } else {
            setError('データの読み込みに失敗しました');
            
            // 5秒後にフォールバック処理
            setTimeout(() => {
              console.log('フォールバック: 初期化フラグを設定');
              setIsInitialized(true);
              setDataLoading(false);
            }, 5000);
          }
        }
      } else {
        // ログアウト時のクリーンアップ
        console.log('ユーザーログアウト');
        setMembers([]);
        setWeeklyAttendance({});
        setNotes([]);
        setIsInitialized(false);
        setDataLoading(false);
        setError(null);
        setShowFirstLoginHelp(false);
        setShowTutorial(false);
        
        // 購読の解除
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        setUnsubscribeFunctions([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [isFirstTimeUser]); // isFirstTimeUserを依存配列に追加

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

  // ページ遷移処理
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  // 使い方ページを新しいタブで開く
  const handleShowUsage = () => {
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

  // タブ切り替えの処理
  const handleTabChange = (tab: 'calendar' | 'members') => {
    // チュートリアル中にメンバー管理タブがクリックされた場合（初回ユーザーのみ）
    if (showTutorial && isFirstTimeUser && tab === 'members') {
      setShowTutorial(false);
      setShowFirstLoginHelp(false);
      toast.dismiss('welcome-tutorial');
      toast.success('メンバー管理画面へようこそ！ここで家族のメンバーを追加・編集できます。', {
        duration: 5000,
        icon: '👥'
      });
    }
    setCurrentTab(tab);
  };

  // 認証ローディング中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  // データローディング中
  if (user && dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合は認証画面を表示
  if (!user) {
    return <AuthComponent user={user} onAuthStateChange={handleAuthChange} />;
  }

  // サブページ表示
  if (currentPage !== 'main') {
    return <SubPage currentPage={currentPage} onBack={handleBackToMain} />;
  }

  const today = formatDate(new Date());

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="flex-grow">
        <Toaster position="top-center" reverseOrder={false} />
        
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                🍽️ 家族の夜ご飯予定
              </h1>
              <ConnectionStatus isConnected={isOnline} />
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <AuthComponent user={user} onAuthStateChange={handleAuthChange} />
          
          {authLoading ? (
            <div className="text-center p-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : user ? (
            <>
              {currentPage === 'main' ? (
                <>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
                    <button
                      onClick={() => handleTabChange('calendar')}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        currentTab === 'calendar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Calendar size={16} className="mr-2" />
                      カレンダー
                    </button>
                    <button
                      onClick={() => handleTabChange('members')}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center ${
                        currentTab === 'members'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Users size={16} className="mr-2" />
                      メンバー管理
                    </button>
                    <button
                      onClick={handleShowUsage}
                      className="px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <HelpCircle size={16} className="mr-2" />
                      使い方
                    </button>
                  </div>

                  {currentTab === 'calendar' && (
                    <>
                      <WeekNavigation
                        currentDate={currentDate}
                        onPreviousWeek={handlePreviousWeek}
                        onNextWeek={handleNextWeek}
                      />
                      <WeeklyCalendar
                        currentDate={currentDate}
                        members={members}
                        attendance={weeklyAttendance}
                        notes={notes}
                        onAttendanceChange={handleAttendanceChange}
                        onShowNotes={handleShowNotes}
                      />
                       <div className="mt-4">
                        <DailySummary attendance={weeklyAttendance} members={members} currentDate={currentDate} />
                      </div>
                    </>
                  )}

                  {currentTab === 'members' && (
                    <MemberManagement
                      members={members}
                      onAddMember={handleAddMember}
                      onUpdateMember={handleUpdateMember}
                      onDeleteMember={handleDeleteMember}
                      onClose={() => handleTabChange('calendar')}
                    />
                  )}
                </>
              ) : (
                <SubPage currentPage={currentPage} onBack={handleBackToMain} />
              )}
            </>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">ようこそ！</h2>
              <p className="text-gray-600">
                ログインまたはアカウントを作成して、家族の予定を共有しましょう。
              </p>
            </div>
          )}
        </main>
      </div>

      <AccountDeletionSection user={user} onAuthStateChange={handleAuthChange} />
      <Footer onPageChange={handlePageChange} />

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
    </div>
  );
}

export default App; 