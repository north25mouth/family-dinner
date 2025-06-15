import React, { useState } from 'react';
import { Bell, BellOff, Clock, Settings, Save, X, Plus, Trash2, User, MessageCircle } from 'lucide-react';
import { NotificationSettings as NotificationSettingsType, FamilyMember, CustomNotificationSchedule } from '../types';
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
  const [localSettings, setLocalSettings] = useState<NotificationSettingsType>({
    ...settings,
    customSchedules: settings.customSchedules || []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<CustomNotificationSchedule>>({
    memberId: '',
    dayOfWeek: 1, // Monday
    time: '09:00',
    message: 'そろそろ来週の食事の予定を入力してください！',
    enabled: true
  });

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

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

  const addCustomSchedule = () => {
    if (!newSchedule.memberId) {
      toast.error('メンバーを選択してください');
      return;
    }

    const schedule: CustomNotificationSchedule = {
      id: Date.now().toString(),
      memberId: newSchedule.memberId!,
      dayOfWeek: newSchedule.dayOfWeek!,
      time: newSchedule.time!,
      message: newSchedule.message!,
      enabled: newSchedule.enabled!,
      createdAt: new Date()
    };

    setLocalSettings({
      ...localSettings,
      customSchedules: [...localSettings.customSchedules, schedule]
    });

    setNewSchedule({
      memberId: '',
      dayOfWeek: 1,
      time: '09:00',
      message: 'そろそろ来週の食事の予定を入力してください！',
      enabled: true
    });
    setShowAddSchedule(false);
    toast.success('カスタム通知を追加しました');
  };

  const removeCustomSchedule = (scheduleId: string) => {
    setLocalSettings({
      ...localSettings,
      customSchedules: localSettings.customSchedules.filter(s => s.id !== scheduleId)
    });
    toast.success('カスタム通知を削除しました');
  };

  const toggleScheduleEnabled = (scheduleId: string) => {
    setLocalSettings({
      ...localSettings,
      customSchedules: localSettings.customSchedules.map(s =>
        s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
      )
    });
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : '不明なメンバー';
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-2" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
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

        <div className="p-4 sm:p-6 space-y-6">
          {/* 通知許可状態 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* LINE個別通知スケジュール */}
          {localSettings.enabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
                    LINE個別通知スケジュール
                  </h3>
                  <p className="text-sm text-gray-600">
                    家族メンバーごとに個別の通知スケジュールを設定
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSchedule(true)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  追加
                </button>
              </div>

              {/* 既存のスケジュール一覧 */}
              <div className="space-y-3">
                {localSettings.customSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`p-4 border rounded-lg ${
                      schedule.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <User className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="font-medium text-gray-900">
                            {getMemberName(schedule.memberId)}
                          </span>
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {dayNames[schedule.dayOfWeek]} {schedule.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {schedule.message}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleScheduleEnabled(schedule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            schedule.enabled ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              schedule.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => removeCustomSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {localSettings.customSchedules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>個別通知スケジュールが設定されていません</p>
                    <p className="text-sm">「追加」ボタンから新しいスケジュールを作成してください</p>
                  </div>
                )}
              </div>

              {/* 新しいスケジュール追加フォーム */}
              {showAddSchedule && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="font-medium text-gray-900 mb-4">新しい通知スケジュール</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        対象メンバー
                      </label>
                      <select
                        value={newSchedule.memberId}
                        onChange={(e) => setNewSchedule({
                          ...newSchedule,
                          memberId: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">メンバーを選択</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        曜日
                      </label>
                      <select
                        value={newSchedule.dayOfWeek}
                        onChange={(e) => setNewSchedule({
                          ...newSchedule,
                          dayOfWeek: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {dayNames.map((day, index) => (
                          <option key={index} value={index}>
                            {day}曜日
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        時間
                      </label>
                      <input
                        type="time"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({
                          ...newSchedule,
                          time: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ
                    </label>
                    <textarea
                      value={newSchedule.message}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule,
                        message: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="送信するメッセージを入力してください"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddSchedule(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={addCustomSchedule}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <strong>📋 通知について</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>リマインダー通知: 設定した時間に出席確認のお知らせ</li>
                <li>締切通知: 夕飯準備のため、未回答メンバーへの最終確認</li>
                <li>LINE個別通知: 家族メンバーごとに個別のスケジュールでLINEメッセージを送信</li>
                <li>ブラウザが閉じられていても通知を受け取れます</li>
              </ul>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} className="mr-2" />
            {isLoading ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
}; 