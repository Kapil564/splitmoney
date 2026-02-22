import { format, formatDistance, parseISO } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

export const formatTimeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true });
};

export const getDateHeader = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = format(d, 'yyyy-MM-dd');
  if (dateStr === format(now, 'yyyy-MM-dd')) return 'Today';
  if (dateStr === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday';
  if (d > new Date(now.getTime() - 7 * 86400000)) return format(d, 'EEEE');
  return format(d, 'MMM dd, yyyy');
};

export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
};
