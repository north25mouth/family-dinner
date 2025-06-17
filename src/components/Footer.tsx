import React from 'react';
import { ExternalLink, Mail, Shield, FileText, HelpCircle } from 'lucide-react';

interface FooterProps {
  onPageChange?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onPageChange }) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (page: string) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* サービス情報 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🍽️ 家族の夜ご飯スケジュール
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              家族みんなで夜ご飯の出席状況を簡単に管理できるWebアプリケーションです。
              リアルタイムで同期され、どのデバイスからでもアクセス可能です。
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>© {currentYear} 家族の夜ご飯スケジュール. All rights reserved.</span>
            </div>
          </div>

          {/* サポート */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">サポート</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleLinkClick('help')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <HelpCircle size={14} className="mr-2" />
                  使い方・FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('contact')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Mail size={14} className="mr-2" />
                  お問い合わせ
                </button>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">法的情報</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleLinkClick('privacy')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Shield size={14} className="mr-2" />
                  プライバシーポリシー
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('terms')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FileText size={14} className="mr-2" />
                  利用規約
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 下部境界線 */}
        <div className="border-t border-gray-200 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-xs text-gray-500 mb-2 sm:mb-0">
              このサービスは家族の夜ご飯管理を目的として提供されています
            </div>
            <div className="text-xs text-gray-500">
              バージョン 1.0.1
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 