import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { DeleteAccountModal } from './DeleteAccountModal';
import { FirestoreService } from '../services/firestoreService';

interface AccountDeletionSectionProps {
  user: User | null;
  onDeleteAccount: (password: string) => Promise<void>;
}

export const AccountDeletionSection: React.FC<AccountDeletionSectionProps> = ({ user, onDeleteAccount }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async (password: string) => {
    try {
      await onDeleteAccount(password);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      // エラーはモーダル側で表示するため、ここでは再スロー
      throw error;
    }
  };

  if (!user || !user.displayName) {
    return null; // ログインしていない、またはゲストユーザーの場合は何も表示しない
  }

  return (
    <>
      <div className="mt-8 mb-4 px-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShieldAlert className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="font-bold text-gray-800">アカウントの管理</h3>
                <p className="text-sm text-gray-600">
                  アカウントを削除すると、すべてのデータが失われます。
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 size={16} className="mr-2" />
              アカウントを削除
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
        username={user.displayName}
      />
    </>
  );
}; 