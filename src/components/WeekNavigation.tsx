import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange } from '../utils/dateUtils';

interface WeekNavigationProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({
  currentDate,
  onPreviousWeek,
  onNextWeek,
}) => {
  return (
    <div className="week-navigation">
      <button
        onClick={onPreviousWeek}
        className="nav-button"
        aria-label="前の週"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {formatWeekRange(currentDate)}
        </h2>
      </div>
      
      <button
        onClick={onNextWeek}
        className="nav-button"
        aria-label="次の週"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}; 