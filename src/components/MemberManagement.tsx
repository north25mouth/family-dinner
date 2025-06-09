import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Users } from 'lucide-react';
import { FamilyMember } from '../types';
import toast from 'react-hot-toast';

interface MemberManagementProps {
  members: FamilyMember[];
  onAddMember: (member: Omit<FamilyMember, 'id'>) => Promise<void>;
  onUpdateMember: (id: string, member: Partial<FamilyMember>) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onClose: () => void;
}

const defaultColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#F43F5E', '#06B6D4'
];

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    color: defaultColors[0],
    order: members.length + 1
  });
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      toast.error('メンバー名を入力してください');
      return;
    }

    try {
      await onAddMember(newMember);
      setNewMember({
        name: '',
        color: defaultColors[0],
        order: members.length + 2
      });
      setIsAdding(false);
      toast.success('メンバーを追加しました');
    } catch (error) {
      toast.error('メンバーの追加に失敗しました');
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMember.name.trim()) {
      toast.error('メンバー名を入力してください');
      return;
    }

    try {
      await onUpdateMember(editingMember.id, {
        name: editingMember.name,
        color: editingMember.color,
        order: editingMember.order
      });
      setEditingId(null);
      setEditingMember(null);
      toast.success('メンバー情報を更新しました');
    } catch (error) {
      toast.error('メンバー情報の更新に失敗しました');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`${name}さんを削除しますか？\n※出席データも一緒に削除されます`)) {
      return;
    }

    try {
      await onDeleteMember(id);
      toast.success('メンバーを削除しました');
    } catch (error) {
      toast.error('メンバーの削除に失敗しました');
    }
  };

  const startEditing = (member: FamilyMember) => {
    setEditingId(member.id);
    setEditingMember({ ...member });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingMember(null);
  };

  const getAvailableColor = () => {
    const usedColors = members.map(m => m.color);
    return defaultColors.find(color => !usedColors.includes(color)) || defaultColors[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              メンバー管理
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* メンバーリスト */}
        <div className="p-6">
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                {editingId === member.id && editingMember ? (
                  // 編集モード
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: editingMember.color }}
                    />
                    <input
                      type="text"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({
                        ...editingMember,
                        name: e.target.value
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="メンバー名"
                    />
                    <select
                      value={editingMember.color}
                      onChange={(e) => setEditingMember({
                        ...editingMember,
                        color: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {defaultColors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateMember}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {member.name}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(member)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="p-2 text-danger-600 hover:bg-danger-100 rounded-lg transition-colors"
                        disabled={members.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* 新規追加フォーム */}
            {isAdding && (
              <div className="flex items-center space-x-4 p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: newMember.color }}
                />
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="新しいメンバー名"
                  autoFocus
                />
                <select
                  value={newMember.color}
                  onChange={(e) => setNewMember({ ...newMember, color: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {defaultColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddMember}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 追加ボタン */}
          {!isAdding && (
            <button
              onClick={() => {
                setIsAdding(true);
                setNewMember({
                  name: '',
                  color: getAvailableColor(),
                  order: members.length + 1
                });
              }}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              新しいメンバーを追加
            </button>
          )}
        </div>

        {/* 注意事項 */}
        <div className="px-6 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-800">
              <strong>⚠️ 注意事項</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>メンバーを削除すると、そのメンバーの出席データも削除されます</li>
                <li>最後のメンバーは削除できません</li>
                <li>色は他のメンバーと重複しないように自動で選択されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 