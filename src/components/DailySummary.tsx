import React from 'react';
import { FamilyMember, WeeklyAttendance } from '../types';
import { getWeekDates, formatDate, isDateToday } from '../utils/dateUtils';

interface DailySummaryProps {
  currentDate: Date;
  members: FamilyMember[];
  attendance: WeeklyAttendance;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  currentDate,
  members,
  attendance,
}) => {
  const today = new Date();
  const todayStr = formatDate(today);
  const todayAttendance = attendance[todayStr] || {};
  
  const presentCount = members.filter(
    member => todayAttendance[member.id]?.status === 'present'
  ).length;
  
  const presentMembers = members
    .filter(member => todayAttendance[member.id]?.status === 'present')
    .map(member => member.name);

  return (
    <div className="summary-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        今日の夜ご飯 ({formatDate(today, 'M月d日(E)')})
      </h3>
      
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {presentCount}人分
          </div>
          <div className="text-sm text-gray-600">
            準備が必要です
          </div>
        </div>
        
        {presentMembers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary-200">
            <div className="text-sm text-gray-600 mb-2">出席メンバー:</div>
            <div className="flex flex-wrap gap-2">
              {presentMembers.map((name, index) => (
                <span
                  key={index}
                  className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 