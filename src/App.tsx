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
    return <AuthComponent user={user} onAuthStateChange={setUser} />;
  }

  // サブページ表示
  if (currentPage !== 'main') {
    return <SubPage currentPage={currentPage} onBack={handleBackToMain} />;
  }

  const today = formatDate(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* ヘッダー */}
        <header className="bg-white rounded-lg shadow-sm mb-3 sm:mb-6 p-3 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
                              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">家族の夜ご飯スケジュール</h1>
                              <p className="text-gray-600 mt-1 text-sm sm:text-base">みんなで夜ご飯を管理しよう</p>
            </div>
            <div className="flex items-center space-x-3">
              <ConnectionStatus isConnected={isOnline} />
              <button
                onClick={handleShowUsage}
                className={`flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-colors text-sm ${
                  showTutorial && isFirstTimeUser
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={showTutorial && isFirstTimeUser ? '詳しい使い方はこちら' : '使い方'}
              >
                <HelpCircle size={16} className={`sm:mr-1 ${showTutorial && isFirstTimeUser ? 'text-blue-600' : ''}`} />
                <span className="hidden sm:inline">
                  使い方
                </span>
                {showTutorial && isFirstTimeUser && <span className="ml-1 text-blue-600">📖</span>}
              </button>
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

          {/* チュートリアル用バナー（初回ユーザー） */}
          {showTutorial && isDefaultMemberSet(members) && isFirstTimeUser && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3 sm:mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-orange-400">🍽️</div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-orange-800">
                    夕飯予定管理へようこそ！
                  </h3>
                  <div className="mt-1 text-sm text-orange-700">
                    <p>
                      家族の夕飯スケジュールを簡単に管理できます。まずは上の
                      <span className="font-semibold text-orange-800">「メンバー管理」タブ</span>
                      をクリックして、ご家族のメンバーを登録してください。
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-orange-600">
                    💡 ヒント：メンバー登録後は、カレンダーで出席予定を管理できます
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <button
                    onClick={() => handleTabChange('members')}
                    className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                  >
                    メンバー管理へ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* データ読み込み中の表示 */}
          {dataLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 sm:mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-blue-400 animate-spin">⏳</div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    データを読み込み中...
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>
                      ご家族のメンバーと予定データを取得しています。初回ログイン時は少し時間がかかる場合があります。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* タブナビゲーション */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => handleTabChange('calendar')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentTab === 'calendar'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              カレンダー
            </button>
            <button
              onClick={() => handleTabChange('members')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentTab === 'members'
                  ? 'bg-blue-600 text-white'
                  : showTutorial && isFirstTimeUser
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 animate-pulse border-2 border-orange-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={showTutorial && isFirstTimeUser ? 'ここをクリックしてメンバー管理を始めましょう！' : 'メンバー管理'}
            >
              <Users size={14} className={`mr-1 sm:w-4 sm:h-4 ${showTutorial && isFirstTimeUser ? 'text-orange-600' : ''}`} />
              <span className="hidden sm:inline">メンバー管理</span>
              <span className="sm:hidden">メンバー</span>
              {showTutorial && isFirstTimeUser && <span className="ml-1 text-orange-600">👆</span>}
            </button>

            <button
              onClick={handleShowUsage}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                showTutorial && isFirstTimeUser
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={showTutorial && isFirstTimeUser ? '詳しい使い方はこちら' : '使い方'}
            >
              <HelpCircle size={14} className={`mr-1 sm:w-4 sm:h-4 ${showTutorial && isFirstTimeUser ? 'text-blue-600' : ''}`} />
              <span className="hidden sm:inline">使い方</span>
              <span className="sm:hidden">ヘルプ</span>
              {showTutorial && isFirstTimeUser && <span className="ml-1 text-blue-600">📖</span>}
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
              attendance={weeklyAttendance}
              notes={notes}
              onAttendanceChange={handleAttendanceChange}
              onShowNotes={handleShowNotes}
            />

            <DailySummary
              currentDate={new Date()}
              members={members}
              attendance={weeklyAttendance}
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
      <Footer onPageChange={handlePageChange} />
    </div>
  );
}

export default App; 