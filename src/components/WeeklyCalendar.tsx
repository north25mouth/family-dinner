import React from 'react';
import { FamilyMember, AttendanceStatus, WeeklyAttendance, Note } from '../types';
import { AttendanceButton } from './AttendanceButton';
import { getWeekDates, formatDate, getDayOfWeekShort, isDateToday } from '../utils/dateUtils';
import { MessageSquare } from 'lucide-react';

interface WeeklyCalendarProps {
  currentDate: Date;
  members: FamilyMember[];
  attendance: WeeklyAttendance;
  notes?: Note[];
  onAttendanceChange: (memberId: string, date: string, status: AttendanceStatus) => void;
  onShowNotes?: (date: string) => void;
}

const getNextStatus = (current: AttendanceStatus): AttendanceStatus => {
  switch (current) {
    case 'unknown':
      return 'present';
    case 'present':
      return 'absent';
    case 'absent':
      return 'unknown';
    default:
      return 'unknown';
  }
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  currentDate,
  members,
  attendance,
  notes = [],
  onAttendanceChange,
  onShowNotes,
}) => {
  const weekDates = getWeekDates(currentDate);

  const getNotesForDate = (date: string) => {
    return notes.filter(note => note.date === date);
  };

  const handleStatusChange = (memberId: string, date: string) => {
    const currentStatus = attendance[date]?.[memberId]?.status || 'unknown';
    const nextStatus = getNextStatus(currentStatus);
    onAttendanceChange(memberId, date, nextStatus);
  };

  return (
    <div className="calendar-grid">
      {/* Header */}
      <div className="calendar-header">
        <div className="p-4 font-semibold text-gray-700">メンバー</div>
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const dayNotes = getNotesForDate(dateStr);
          
          return (
            <div
              key={dateStr}
              className={`p-4 text-center font-semibold relative ${
                isDateToday(date) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
              }`}
            >
              <div className="text-sm">{getDayOfWeekShort(date)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(date, 'M/d')}
              </div>
              
              {/* メモボタン */}
              {onShowNotes && (
                <button
                  onClick={() => onShowNotes(dateStr)}
                  className={`absolute top-2 right-2 p-1 rounded transition-colors ${
                    dayNotes.length > 0 
                      ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title={`${dayNotes.length}件のメモ`}
                >
                  <MessageSquare size={12} />
                  {dayNotes.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {dayNotes.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="calendar-body">
        {members.map((member) => (
          <div key={member.id} className="member-row">
            <div className="member-name">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: member.color }}
                />
                {member.name}
              </div>
            </div>
            {weekDates.map((date) => {
              const dateStr = formatDate(date);
              const attendanceRecord = attendance[dateStr]?.[member.id];
              const status = attendanceRecord?.status || 'unknown';

              return (
                <div key={dateStr} className="day-cell">
                  <AttendanceButton
                    status={status}
                    onClick={() => handleStatusChange(member.id, dateStr)}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}; 