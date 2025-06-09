import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, X, Trash2 } from 'lucide-react';
import { Note, FamilyMember } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface NoteModalProps {
  date: string;
  members: FamilyMember[];
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateNote: (id: string, text: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  date,
  members,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onClose,
}) => {
  const [newNote, setNewNote] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('メモを入力してください');
      return;
    }

    try {
      await onAddNote({
        memberId: selectedMemberId,
        date,
        text: newNote.trim(),
      });
      setNewNote('');
      toast.success('メモを追加しました');
    } catch (error) {
      toast.error('メモの追加に失敗しました');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingText.trim()) {
      toast.error('メモを入力してください');
      return;
    }

    try {
      await onUpdateNote(noteId, editingText.trim());
      setEditingNoteId(null);
      setEditingText('');
      toast.success('メモを更新しました');
    } catch (error) {
      toast.error('メモの更新に失敗しました');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('このメモを削除しますか？')) {
      return;
    }

    try {
      await onDeleteNote(noteId);
      toast.success('メモを削除しました');
    } catch (error) {
      toast.error('メモの削除に失敗しました');
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || '不明';
  };

  const getMemberColor = (memberId: string) => {
    return members.find(m => m.id === memberId)?.color || '#6B7280';
  };

  const dateObj = new Date(date + 'T00:00:00');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {formatDateDisplay(dateObj)} のメモ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* 新規メモ追加 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">新しいメモを追加</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メンバー
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ内容
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="例：遅くなります、お弁当持参、好き嫌いあり など"
                />
              </div>
              <button
                onClick={handleAddNote}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save size={16} className="mr-2" />
                メモを追加
              </button>
            </div>
          </div>

          {/* 既存のメモ一覧 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              既存のメモ ({notes.length}件)
            </h3>
            
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p>まだメモがありません</p>
                <p className="text-sm">上記のフォームから新しいメモを追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    {editingNoteId === note.id ? (
                      // 編集モード
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getMemberColor(note.memberId) }}
                          />
                          <span className="font-medium text-gray-900">
                            {getMemberName(note.memberId)}
                          </span>
                        </div>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 表示モード
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getMemberColor(note.memberId) }}
                            />
                            <span className="font-medium text-gray-900">
                              {getMemberName(note.memberId)}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => startEditing(note)}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                            >
                              <MessageSquare size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-danger-600 hover:bg-danger-100 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700">{note.text}</p>
                        <p className="text-xs text-gray-500">
                          {note.updatedAt.toLocaleString('ja-JP')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 