export const SLA_CONFIG = { CAN_HO: 45, DAT_NEN: 25, MAC_DINH_BUOC: 10 };

/**
 * Tính số ngày làm việc giữa 2 mốc thời gian (Không dùng vòng lặp, loại trừ T7, CN)
 * Thuật toán O(1) chống treo trình duyệt.
 */
export function calculateWorkingDays(startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const isReverse = start > end;
  const d1 = isReverse ? end : start;
  const d2 = isReverse ? start : end;

  const diffMs = d2.getTime() - d1.getTime();
  const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays === 0) return 0;

  const weeks = Math.floor(totalDays / 7);
  let workingDays = weeks * 5;

  const d1Target = d1.getDay() === 0 ? 7 : d1.getDay();
  const d2Target = d2.getDay() === 0 ? 7 : d2.getDay();
  
  let remainder = 0;
  if (d1Target <= d2Target) {
    const endDays = Math.min(d2Target, 5);
    const startDays = Math.min(d1Target, 5);
    remainder = Math.max(0, endDays - startDays);
  } else {
    const daysToFriday = Math.max(0, 5 - d1Target);
    const daysFromMonday = Math.min(d2Target, 5);
    remainder = daysToFriday + daysFromMonday;
  }

  workingDays += remainder;

  return isReverse ? -workingDays : workingDays;
}

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
