const LOCALE = 'en-US';

const DATE_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const DATETIME_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString(LOCALE, DATE_OPTIONS);
}

export function formatDateTime(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleString(LOCALE, DATETIME_OPTIONS);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
