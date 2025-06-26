import React, { useState } from 'react';
import { 
  signInAnonymously, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import { LogIn, LogOut, UserPlus, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthComponentProps {
  user: User | null;
  onAuthStateChange: (user: User | null) => void;
}

export const AuthComponent: React.FC<AuthComponentProps> = ({ 
  user, 
  onAuthStateChange 
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const handleAnonymousLogin = async () => {
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      onAuthStateChange(result.user);
      toast.success('ゲストとしてログインしました');
    } catch (error: any) {
      toast.error(`ログインに失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ユーザーネームの重複チェック
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);
      setUsernameAvailable(snapshot.empty);
    } catch (error) {
      console.error('ユーザーネームチェックエラー:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // ユーザーネーム入力時の処理
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (!isLogin) {
      // 新規登録時のみ重複チェック
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500); // 500ms後にチェック実行

      return () => clearTimeout(timeoutId);
    }
  };

  const handleUsernameLogin = async () => {
    if (!username || !password) {
      toast.error('ユーザー名とパスワードを入力してください');
      return;
    }

    if (!isLogin && username.length < 3) {
      toast.error('ユーザー名は3文字以上で入力してください');
      return;
    }

    if (!isLogin && password.length < 6) {
      toast.error('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      if (isLogin) {
        // ログイン
        const q = query(usersRef, where('username', '==', username), where('password', '==', password));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          toast.error('ユーザー名またはパスワードが間違っています');
        } else {
          // 匿名ログインしてFirebase Userオブジェクトを作成
          const result = await signInAnonymously(auth);
          // displayNameにユーザー名を設定し、カスタムクレームとしてfamilyIdも設定
          await updateProfile(result.user, { 
            displayName: username,
            // photoURLにfamilyIdを格納（一時的な解決策）
            photoURL: `family_${username}`
          });
          onAuthStateChange(result.user);
          toast.success(`${username}さん、おかえりなさい！`);
        }
      } else {
        // 新規登録 - 最終的な重複チェック
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          toast.error('このユーザー名は既に使われています');
          setUsernameAvailable(false);
        } else {
          // ユーザー作成
          await addDoc(usersRef, { 
            username, 
            password,
            familyId: `family_${username}`, // familyIdを明示的に保存
            createdAt: new Date().toISOString()
          });
          toast.success('アカウントを作成しました！ログインしてください。');
          setIsLogin(true);
          setPassword(''); // パスワードをクリア
        }
      }
    } catch (error) {
      toast.error('認証エラー: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onAuthStateChange(null);
      toast.success('ログアウトしました');
    } catch (error: any) {
      toast.error(`ログアウトに失敗しました: ${error.message}`);
    }
  };

  if (user) {
    const displayName = user.displayName || 'ユーザー';
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-primary-600 mr-2" />
            <div>
              <div className="font-medium text-gray-900">
                {displayName}
              </div>
              <div className="text-sm text-gray-600">
                全デバイスでデータが同期されます
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-1" />
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🍽️ 家族の夜ご飯スケジュール
        </h2>
        <p className="text-gray-600">
          家族全員で夜ご飯の出席状況を共有しましょう
        </p>
      </div>

      {/* 認証フォーム */}
      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => {
              setIsLogin(true);
              setUsernameAvailable(null);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              isLogin 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setUsernameAvailable(null);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              !isLogin 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            新規登録
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ユーザー名
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                !isLogin && usernameAvailable === false 
                  ? 'border-red-300' 
                  : !isLogin && usernameAvailable === true 
                  ? 'border-green-300' 
                  : 'border-gray-300'
              }`}
              placeholder={isLogin ? "ユーザー名を入力" : "3文字以上のユーザー名"}
            />
            {!isLogin && username.length >= 3 && (
              <div className="absolute right-3 top-2.5">
                {checkingUsername ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                ) : usernameAvailable === true ? (
                  <div className="text-green-600">✓</div>
                ) : usernameAvailable === false ? (
                  <div className="text-red-600">✗</div>
                ) : null}
              </div>
            )}
          </div>
          {!isLogin && usernameAvailable === false && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              このユーザー名は既に使用されています
            </p>
          )}
          {!isLogin && usernameAvailable === true && (
            <p className="text-green-600 text-xs mt-1">
              ✓ このユーザー名は利用可能です
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="6文字以上"
          />
        </div>

        <button
          onClick={handleUsernameLogin}
          disabled={loading || (!isLogin && usernameAvailable === false)}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLogin ? <LogIn size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
          {loading 
            ? '処理中...' 
            : isLogin 
            ? 'ログイン' 
            : 'アカウント作成'}
        </button>

        <div className="text-xs text-gray-500 text-center">
          {isLogin ? (
            <>アカウントをお持ちでない方は「新規登録」タブから</>
          ) : (
            <>すでにアカウントをお持ちの方は「ログイン」タブから</>
          )}
        </div>
      </div>

      {/* 利点説明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <strong>🔥 アカウント作成の利点</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>スマホ・PC・タブレット間で即座に同期</li>
            <li>家族全員が同じデータを共有</li>
            <li>出席状況の変更が瞬時に反映</li>
            <li>どこからでもアクセス可能</li>
          </ul>
        </div>
      </div>

      {/* 家族共有説明 */}
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-sm text-green-800">
          <strong>👨‍👩‍👧‍👦 家族での使い方</strong>
          <div className="mt-2">
            <p className="mb-2">
              <span className="font-medium">同じアカウントを家族で共有できます！</span>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>お父さん、お母さん、お子さんが同じユーザー名・パスワードでログイン</li>
              <li>誰かが予定を変更すると、家族全員のデバイスに即座に反映</li>
              <li>外出先からでも家族の夕飯予定を確認・更新可能</li>
            </ul>
            <div className="mt-2 text-xs text-green-600">
              💡 例：ユーザー名「田中家」、パスワード「tanaka2024」を家族全員で使用
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 