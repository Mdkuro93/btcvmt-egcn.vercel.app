/**
 * Calculates the difference in days between today and a given date.
 * @param date The date to compare with today.
 * @returns Number of days difference.
 */
export function diffDays(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const now = new Date();
  const d = new Date(date);
  
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcTarget = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  
  return Math.floor((utcNow - utcTarget) / (1000 * 60 * 60 * 24));
}

/**
 * Formats a date string or Date object to DD/MM/YYYY format.
 * @param val The date to format.
 * @returns Formatted date string.
 */
export const formatDate = (val: string | Date | undefined) => {
  if (!val) return '---';
  // If it's already in dd/mm/yyyy format, return it
  if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
  
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    // If it's a string that doesn't look like ISO but might be something else
    return String(val);
  }
  
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};
