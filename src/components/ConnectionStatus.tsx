import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {isConnected ? (
        <>
          <Cloud size={14} className="mr-1 text-green-500" />
          <span className="text-sm text-green-600">Firebase同期中</span>
        </>
      ) : (
        <>
          <CloudOff size={14} className="mr-1 text-red-500" />
          <span className="text-sm text-red-600">接続なし</span>
        </>
      )}
    </div>
  );
}; 