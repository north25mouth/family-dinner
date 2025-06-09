import { NotificationSettings, FamilyMember, AttendanceStatus } from '../types';

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings | null = null;
  private reminderTimeoutId: number | null = null;
  private deadlineTimeoutId: number | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知権限をリクエスト
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // 設定を更新
  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
    this.scheduleNotifications();
  }

  // 通知をスケジュール
  private scheduleNotifications() {
    // 既存のタイマーをクリア
    if (this.reminderTimeoutId) {
      clearTimeout(this.reminderTimeoutId);
    }
    if (this.deadlineTimeoutId) {
      clearTimeout(this.deadlineTimeoutId);
    }

    if (!this.settings?.enabled) {
      return;
    }

    // 次のリマインダー時刻を計算
    const now = new Date();
    const reminderTime = this.getNextScheduledTime(this.settings.reminderTime);
    const deadlineTime = this.getNextScheduledTime(this.settings.deadlineTime);

    // リマインダー通知をスケジュール
    if (reminderTime > now) {
      this.reminderTimeoutId = window.setTimeout(() => {
        this.sendReminderNotification();
        // 24時間後に再スケジュール
        this.scheduleNotifications();
      }, reminderTime.getTime() - now.getTime());
    }

    // 締切通知をスケジュール
    if (deadlineTime > now) {
      this.deadlineTimeoutId = window.setTimeout(() => {
        this.sendDeadlineNotification();
        // 24時間後に再スケジュール
        this.scheduleNotifications();
      }, deadlineTime.getTime() - now.getTime());
    }
  }

  // 指定時刻の次回実行時刻を計算
  private getNextScheduledTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // 今日の指定時刻が過ぎていれば明日にスケジュール
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    return scheduledTime;
  }

  // リマインダー通知を送信
  private async sendReminderNotification() {
    if (!this.canSendNotification()) return;

    try {
      const notification = new Notification('🍽️ 夕飯出席確認', {
        body: '今日の夕飯の出席状況を確認してください',
        icon: '/vite.svg',
        tag: 'dinner-reminder',
        requireInteraction: false,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 10秒後に自動で閉じる
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('リマインダー通知の送信に失敗:', error);
    }
  }

  // 締切通知を送信
  private async sendDeadlineNotification() {
    if (!this.canSendNotification()) return;

    try {
      const notification = new Notification('⏰ 夕飯準備締切間近', {
        body: '夕飯の準備のため、出席状況の最終確認をお願いします',
        icon: '/vite.svg',
        tag: 'dinner-deadline',
        requireInteraction: true,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('締切通知の送信に失敗:', error);
    }
  }

  // 状況変更通知を送信
  async sendStatusChangeNotification(
    memberName: string, 
    date: string, 
    status: AttendanceStatus
  ) {
    if (!this.canSendNotification()) return;

    const statusText = status === 'present' ? '出席' : status === 'absent' ? '欠席' : '未定';
    const emoji = status === 'present' ? '🍽️' : status === 'absent' ? '❌' : '❓';

    try {
      const notification = new Notification(`${emoji} 出席状況が更新されました`, {
        body: `${memberName}さんが${date}を${statusText}に変更しました`,
        icon: '/vite.svg',
        tag: 'status-change',
        requireInteraction: false,
        silent: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 5秒後に自動で閉じる
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('状況変更通知の送信に失敗:', error);
    }
  }

  // 通知送信可能かチェック
  private canSendNotification(): boolean {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    if (!this.settings?.enabled) {
      return false;
    }

    return true;
  }

  // テスト通知を送信
  async sendTestNotification(): Promise<boolean> {
    if (!this.canSendNotification()) {
      return false;
    }

    try {
      const notification = new Notification('🧪 テスト通知', {
        body: '通知設定が正常に動作しています',
        icon: '/vite.svg',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 3000);
      return true;
    } catch (error) {
      console.error('テスト通知の送信に失敗:', error);
      return false;
    }
  }

  // サービスワーカーを使用したバックグラウンド通知（PWA用）
  async scheduleBackgroundNotification(
    title: string,
    body: string,
    showTime: Date
  ) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if ('showNotification' in registration) {
          // 指定時刻になったら通知を表示
          const delay = showTime.getTime() - Date.now();
          
          if (delay > 0) {
            setTimeout(() => {
              registration.showNotification(title, {
                body,
                icon: '/vite.svg',
                badge: '/vite.svg',
                tag: 'scheduled-notification',
                requireInteraction: false,
                actions: [
                  {
                    action: 'open',
                    title: '確認する'
                  },
                  {
                    action: 'close',
                    title: '閉じる'
                  }
                ]
              });
            }, delay);
          }
        }
      } catch (error) {
        console.error('バックグラウンド通知のスケジュールに失敗:', error);
      }
    }
  }

  // 通知をクリア
  clearNotifications() {
    if (this.reminderTimeoutId) {
      clearTimeout(this.reminderTimeoutId);
      this.reminderTimeoutId = null;
    }
    if (this.deadlineTimeoutId) {
      clearTimeout(this.deadlineTimeoutId);
      this.deadlineTimeoutId = null;
    }
  }

  // サービス停止
  destroy() {
    this.clearNotifications();
    this.settings = null;
  }
}

// シングルトンインスタンスをエクスポート
export const notificationService = NotificationService.getInstance(); 