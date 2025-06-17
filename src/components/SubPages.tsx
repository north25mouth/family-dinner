import React from 'react';
import { ArrowLeft, Mail, Shield, FileText, HelpCircle, Phone, Clock, MapPin } from 'lucide-react';

interface SubPageProps {
  currentPage: string;
  onBack: () => void;
}

export const SubPage: React.FC<SubPageProps> = ({ currentPage, onBack }) => {
  const renderContent = () => {
    switch (currentPage) {
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsOfServicePage />;
      case 'contact':
        return <ContactPage />;
      case 'help':
        return <HelpPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 戻るボタン */}
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          メインページに戻る
        </button>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// プライバシーポリシーページ
const PrivacyPolicyPage: React.FC = () => (
  <div>
    <div className="flex items-center mb-6">
      <Shield className="text-blue-600 mr-3" size={24} />
      <h1 className="text-2xl font-bold text-gray-900">プライバシーポリシー</h1>
    </div>
    
    <div className="space-y-6 text-gray-700">
      <div>
        <p className="text-sm text-gray-500 mb-4">最終更新日: 2025年6月15日</p>
        <p className="mb-4">
          家族の夜ご飯スケジュール（以下「本サービス」）は、ユーザーの皆様のプライバシーを尊重し、
          個人情報の保護に努めています。本プライバシーポリシーでは、本サービスにおける個人情報の取り扱いについて説明します。
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 収集する情報</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>アカウント作成時に提供されるユーザー名とパスワード</li>
          <li>家族メンバーの名前と出席予定情報</li>
          <li>メモやノート機能で入力された内容</li>
          <li>サービス利用時のアクセスログ（IPアドレス、アクセス時刻等）</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 情報の利用目的</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>本サービスの提供・運営・改善</li>
          <li>ユーザーサポートの提供</li>
          <li>システムの安全性・セキュリティの維持</li>
          <li>利用状況の分析と機能改善</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 情報の共有・開示</h2>
        <p className="mb-3">
          本サービスでは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません：
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく開示が必要な場合</li>
          <li>生命、身体または財産の保護のために必要な場合</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. データの保存・削除</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>データはFirebase（Google Cloud Platform）に安全に保存されます</li>
          <li>アカウント削除時は、関連するすべてのデータが削除されます</li>
          <li>データの削除をご希望の場合は、お問い合わせください</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5. セキュリティ</h2>
        <p>
          本サービスでは、ユーザーの個人情報を保護するため、適切な技術的・管理的安全対策を実施しています。
          ただし、インターネット上でのデータ送信の完全な安全性を保証することはできません。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">6. お問い合わせ</h2>
        <p>
          本プライバシーポリシーに関するご質問やご意見がございましたら、
          お問い合わせページよりご連絡ください。
        </p>
      </section>
    </div>
  </div>
);

// 利用規約ページ
const TermsOfServicePage: React.FC = () => (
  <div>
    <div className="flex items-center mb-6">
      <FileText className="text-green-600 mr-3" size={24} />
      <h1 className="text-2xl font-bold text-gray-900">利用規約</h1>
    </div>
    
    <div className="space-y-6 text-gray-700">
      <div>
        <p className="text-sm text-gray-500 mb-4">最終更新日: 2025年6月15日</p>
        <p className="mb-4">
          本利用規約（以下「本規約」）は、家族の夜ご飯スケジュール（以下「本サービス」）の利用条件を定めるものです。
          本サービスをご利用いただく際は、本規約に同意いただいたものとみなします。
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">1. サービス概要</h2>
        <p>
          本サービスは、家族間で夜ご飯の出席予定を共有・管理するためのWebアプリケーションです。
          リアルタイムでの情報同期により、家族全員が最新の予定を確認できます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 利用資格</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>本サービスは、家族での利用を目的として提供されています</li>
          <li>未成年者が利用する場合は、保護者の同意が必要です</li>
          <li>商用利用は禁止されています</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 禁止事項</h2>
        <p className="mb-3">本サービスの利用において、以下の行為を禁止します：</p>
        <ul className="list-disc list-inside space-y-2">
          <li>他人のアカウントを無断で使用すること</li>
          <li>虚偽の情報を登録すること</li>
          <li>システムに過度な負荷をかける行為</li>
          <li>他の利用者や第三者に迷惑をかける行為</li>
          <li>法令に違反する行為</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. サービスの変更・停止</h2>
        <p>
          本サービスは、事前の通知なくサービス内容の変更や停止を行う場合があります。
          これによりユーザーに生じた損害について、責任を負いません。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5. 免責事項</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>本サービスは「現状有姿」で提供され、動作の保証はありません</li>
          <li>システム障害やデータ損失による損害の責任は負いません</li>
          <li>他の利用者との間で生じたトラブルについて責任を負いません</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 規約の変更</h2>
        <p>
          本規約は、必要に応じて変更される場合があります。
          変更後の規約は、本サービス上での掲載をもって効力を生じます。
        </p>
      </section>
    </div>
  </div>
);

// お問い合わせページ
const ContactPage: React.FC = () => (
  <div>
    <div className="flex items-center mb-6">
      <Mail className="text-purple-600 mr-3" size={24} />
      <h1 className="text-2xl font-bold text-gray-900">お問い合わせ</h1>
    </div>
    
    <div className="space-y-6 text-gray-700">
      <p className="text-lg">
        本サービスに関するご質問、ご意見、不具合報告などがございましたら、
        以下の方法でお気軽にお問い合わせください。
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="flex items-center text-lg font-semibold text-blue-900 mb-4">
            <Mail className="mr-2" size={20} />
            メールでのお問い合わせ
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-blue-800">メールアドレス:</span>
              <span className="ml-2 text-blue-700">north8mouth@gmail.com</span>
            </div>
            <div className="flex items-start">
              <Clock className="mr-2 mt-1 text-blue-600" size={16} />
              <div>
                <div className="font-medium text-blue-800">対応時間</div>
                <div className="text-blue-700 text-sm">平日 9:00-18:00</div>
                <div className="text-blue-600 text-xs">※土日祝日は対応が遅れる場合があります</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="flex items-center text-lg font-semibold text-green-900 mb-4">
            <HelpCircle className="mr-2" size={20} />
            よくある質問
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium text-green-800">Q. 家族で同じアカウントを使えますか？</div>
              <div className="text-green-700">A. はい、同じユーザー名・パスワードで複数のデバイスからログインできます。</div>
            </div>
            <div>
              <div className="font-medium text-green-800">Q. データは安全に保存されますか？</div>
              <div className="text-green-700">A. Google Firebaseを使用し、暗号化されて安全に保存されます。</div>
            </div>
            <div>
              <div className="font-medium text-green-800">Q. 利用料金はかかりますか？</div>
              <div className="text-green-700">A. 現在、本サービスは無料でご利用いただけます。</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
          お問い合わせ時のお願い
        </h3>
        <ul className="list-disc list-inside space-y-2 text-yellow-800">
          <li>使用しているデバイス（スマートフォン、PC等）</li>
          <li>ブラウザの種類とバージョン</li>
          <li>発生した問題の詳細な状況</li>
          <li>エラーメッセージ（表示された場合）</li>
        </ul>
        <p className="mt-3 text-sm text-yellow-700">
          上記の情報をお教えいただくと、より迅速で正確なサポートを提供できます。
        </p>
      </div>
    </div>
  </div>
);

// ヘルプページ
const HelpPage: React.FC = () => (
  <div>
    <div className="flex items-center mb-6">
      <HelpCircle className="text-orange-600 mr-3" size={24} />
      <h1 className="text-2xl font-bold text-gray-900">使い方・FAQ</h1>
    </div>
    
    <div className="space-y-8 text-gray-700">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 はじめに</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            家族の夜ご飯スケジュールは、家族全員で夜ご飯の出席予定を共有・管理するためのWebアプリです。
            リアルタイムで同期されるため、誰かが予定を変更すると瞬時に全員のデバイスに反映されます。
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 基本的な使い方</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">1. アカウント作成・ログイン</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>「新規登録」タブでユーザー名とパスワードを設定</li>
              <li>家族全員が同じユーザー名・パスワードを使用可能</li>
              <li>ゲストログインでお試し利用も可能</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">2. メンバー管理</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>「メンバー管理」タブで家族メンバーを追加・編集</li>
              <li>名前、色、アイコンを設定可能</li>
              <li>並び順をドラッグ&ドロップで変更</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">3. 出席予定の管理</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>カレンダー画面で各日の出席状況を設定</li>
              <li>○（出席）、×（欠席）、？（未定）から選択</li>
              <li>メモ機能で詳細な情報を追加可能</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">❓ よくある質問</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">家族で同じアカウントを使っても大丈夫？</h3>
            <p className="text-sm">
              はい、問題ありません。むしろ推奨されています。同じユーザー名とパスワードで、
              お父さん、お母さん、お子さんが各自のデバイスからログインして使用できます。
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">データはリアルタイムで同期される？</h3>
            <p className="text-sm">
              はい、誰かが出席状況を変更すると、他の家族のデバイスにも瞬時に反映されます。
              インターネット接続があれば、常に最新の情報を確認できます。
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">スマートフォンでも使える？</h3>
            <p className="text-sm">
              はい、スマートフォン、タブレット、PCのどのデバイスでも快適に使用できます。
              レスポンシブデザインにより、画面サイズに応じて最適化されます。
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">データは安全に保存される？</h3>
            <p className="text-sm">
              Google Firebaseを使用してデータを暗号化して保存しています。
              高いセキュリティレベルで、データの安全性を確保しています。
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">利用料金はかかる？</h3>
            <p className="text-sm">
              現在、本サービスは完全無料でご利用いただけます。
              今後も基本機能は無料で提供を続ける予定です。
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 トラブルシューティング</h2>
        <div className="space-y-4">
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">データが表示されない場合</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              <li>インターネット接続を確認してください</li>
              <li>ブラウザを更新（リロード）してください</li>
              <li>別のブラウザで試してください</li>
              <li>問題が続く場合はお問い合わせください</li>
            </ul>
          </div>
          
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <h3 className="font-semibold text-yellow-900 mb-2">ログインできない場合</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>ユーザー名とパスワードを正確に入力してください</li>
              <li>大文字・小文字の区別にご注意ください</li>
              <li>ブラウザのキャッシュをクリアしてください</li>
              <li>パスワードを忘れた場合はお問い合わせください</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
); 