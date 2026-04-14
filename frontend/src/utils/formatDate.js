import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return format(parseISO(dateStr), "d 'de' MMMM, yyyy", { locale: es });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
};