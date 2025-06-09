import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';

export const formatDate = (date: Date, formatStr: string = 'yyyy-MM-dd'): string => {
  return format(date, formatStr, { locale: ja });
};

export const formatDateDisplay = (date: Date): string => {
  return format(date, 'M月d日(E)', { locale: ja });
};

export const formatWeekRange = (date: Date): string => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  return `${format(weekStart, 'yyyy年M月d日', { locale: ja })}〜${format(weekEnd, 'M月d日', { locale: ja })}`;
};

export const getWeekDates = (currentDate: Date): Date[] => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

export const getPreviousWeek = (currentDate: Date): Date => {
  return subWeeks(currentDate, 1);
};

export const getNextWeek = (currentDate: Date): Date => {
  return addWeeks(currentDate, 1);
};

export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

export const isDateSame = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const getDayOfWeekShort = (date: Date): string => {
  return format(date, 'E', { locale: ja });
}; 