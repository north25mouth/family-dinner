import React, { useState } from 'react';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import { LogIn, LogOut, UserPlus, Users } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [authMode, setAuthMode] = useState<'email' | 'username'>('username');

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

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onAuthStateChange(result.user);
        toast.success('ログインしました');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        onAuthStateChange(result.user);
        toast.success('アカウントを作成しました');
      }
    } catch (error: any) {
      const errorMessage = error.code === 'auth/user-not-found' 
        ? 'ユーザーが見つかりません' 
        : error.code === 'auth/wrong-password'
        ? 'パスワードが間違っています'
        : error.code === 'auth/email-already-in-use'
        ? 'このメールアドレスは既に使用されています'
        : error.message;
      toast.error(`認証エラー: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameLogin = async () => {
    if (!username || !password) {
      toast.error('ユーザー名とパスワードを入力してください');
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
          // displayNameにユーザー名を設定
          await updateProfile(result.user, { displayName: username });
          onAuthStateChange(result.user);
          toast.success('ログインしました');
        }
      } else {
        // 新規登録
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          toast.error('このユーザー名は既に使われています');
        } else {
          await addDoc(usersRef, { username, password });
          toast.success('アカウントを作成しました。ログインしてください。');
          setIsLogin(true);
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
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-primary-600 mr-2" />
            <div>
              <div className="font-medium text-gray-900">
                {user.isAnonymous ? 'ゲストユーザー' : user.email}
              </div>
              <div className="text-sm text-gray-600">
                {user.isAnonymous 
                  ? 'このデバイスでのみデータが保存されます' 
                  : '全デバイスでデータが同期されます'}
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
          🍽️ 家族夕飯カレンダー
        </h2>
        <p className="text-gray-600">
          家族全員でリアルタイム共有
        </p>
      </div>

      {/* 簡単ログイン */}
      <div className="mb-6">
        <button
          onClick={handleAnonymousLogin}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Users size={20} className="mr-2" />
          {loading ? '接続中...' : '今すぐ始める（ゲスト）'}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          アカウント不要でお試しいただけます
        </p>
      </div>

      {/* 認証方式選択 */}
      <div className="mb-6">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setAuthMode('username')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              authMode === 'username' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ユーザー名
          </button>
          <button
            onClick={() => setAuthMode('email')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              authMode === 'email' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            メールアドレス
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">または</span>
        </div>
      </div>

      {/* 認証フォーム */}
      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              isLogin 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              !isLogin 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            新規登録
          </button>
        </div>

        {authMode === 'username' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="familyname"
              />
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
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLogin ? <LogIn size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
              {loading 
                ? '処理中...' 
                : isLogin 
                ? 'ログイン' 
                : 'アカウント作成'}
            </button>
          </>
        ) : (
          <>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家族名（オプション）
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="田中家"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="family@example.com"
              />
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
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLogin ? <LogIn size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
              {loading 
                ? '処理中...' 
                : isLogin 
                ? 'ログイン' 
                : 'アカウント作成'}
            </button>
          </>
        )}

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
          <strong>🔥 リアルタイム同期の利点</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>スマホ・PC・タブレット間で即座に同期</li>
            <li>家族全員が同じデータを共有</li>
            <li>出席状況の変更が瞬時に反映</li>
            <li>どこからでもアクセス可能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 