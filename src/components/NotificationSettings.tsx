import React, { useState } from 'react';
import { Bell, BellOff, Clock, Settings, Save, X } from 'lucide-react';
import { NotificationSettings as NotificationSettingsType, FamilyMember } from '../types';
import toast from 'react-hot-toast';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  members: FamilyMember[];
  onUpdateSettings: (settings: NotificationSettingsType) => Promise<void>;
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  members,
  onUpdateSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettingsType>(settings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await onUpdateSettings(localSettings);
      toast.success('通知設定を保存しました');
      onClose();
    } catch (error) {
      toast.error('通知設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    const newNotifyMembers = localSettings.notifyMembers.includes(memberId)
      ? localSettings.notifyMembers.filter(id => id !== memberId)
      : [...localSettings.notifyMembers, memberId];
    
    setLocalSettings({
      ...localSettings,
      notifyMembers: newNotifyMembers
    });
  };

  // 通知が利用可能かチェック
  const isNotificationSupported = 'Notification' in window;
  const notificationPermission = isNotificationSupported ? Notification.permission : 'denied';

  const requestNotificationPermission = async () => {
    if (isNotificationSupported) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('通知許可が有効になりました');
      } else {
        toast.error('通知許可が拒否されました');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              通知設定
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 通知許可状態 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">ブラウザ通知許可</h3>
                <p className="text-sm text-gray-600">
                  {notificationPermission === 'granted' ? '許可されています' : 
                   notificationPermission === 'denied' ? '拒否されています' : 
                   '未設定です'}
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  許可を要求
                </button>
              )}
            </div>
          </div>

          {/* 通知のオン/オフ */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本設定</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {localSettings.enabled ? (
                  <Bell className="w-5 h-5 text-primary-600 mr-3" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <div>
                  <div className="font-medium text-gray-900">通知機能</div>
                  <div className="text-sm text-gray-600">
                    リマインダーと締切通知を受け取る
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLocalSettings({
                  ...localSettings,
                  enabled: !localSettings.enabled
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  localSettings.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 時間設定 */}
          {localSettings.enabled && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">通知時間</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    リマインダー通知
                  </label>
                  <input
                    type="time"
                    value={localSettings.reminderTime}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      reminderTime: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    毎日この時間に出席確認をリマインド
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    締切通知
                  </label>
                  <input
                    type="time"
                    value={localSettings.deadlineTime}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      deadlineTime: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    未回答メンバーに最終確認通知
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 通知対象メンバー */}
          {localSettings.enabled && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">通知対象メンバー</h3>
              <p className="text-sm text-gray-600">
                どのメンバーが通知を受け取るかを設定してください
              </p>
              
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {member.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMemberToggle(member.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        localSettings.notifyMembers.includes(member.id) 
                          ? 'bg-primary-600' 
                          : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.notifyMembers.includes(member.id) 
                            ? 'translate-x-6' 
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <strong>📋 通知について</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>リマインダー通知: 設定した時間に出席確認のお知らせ</li>
                <li>締切通知: 夕飯準備のため、未回答メンバーへの最終確認</li>
                <li>状況変更通知: 他のメンバーが出席状況を変更した際の通知</li>
                <li>ブラウザが閉じられていても通知を受け取れます</li>
              </ul>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} className="mr-2" />
            {isLoading ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
}; 