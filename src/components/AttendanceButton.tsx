import React from 'react';
import { AttendanceStatus } from '../types';

interface AttendanceButtonProps {
  status: AttendanceStatus;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  present: {
    icon: '🍽️',
    label: '出席',
    className: 'status-present'
  },
  absent: {
    icon: '❌',
    label: '欠席',
    className: 'status-absent'
  },
  unknown: {
    icon: '❓',
    label: '未定',
    className: 'status-unknown'
  }
};

const sizeConfig = {
  sm: 'text-lg p-1 min-h-[36px] min-w-[36px]',
  md: 'text-xl p-2 min-h-[44px] min-w-[44px]',
  lg: 'text-2xl p-3 min-h-[52px] min-w-[52px]'
};

export const AttendanceButton: React.FC<AttendanceButtonProps> = ({
  status,
  onClick,
  disabled = false,
  size = 'md'
}) => {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`status-button ${config.className} ${sizeClass}`}
      title={config.label}
      aria-label={`${config.label}に変更`}
    >
      <span className="select-none" role="img" aria-label={config.label}>
        {config.icon}
      </span>
    </button>
  );
}; 