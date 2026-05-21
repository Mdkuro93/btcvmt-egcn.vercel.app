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
