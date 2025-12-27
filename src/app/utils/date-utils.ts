export function toDate(value: unknown): Date | null {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return value as Date;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // Firestore Timestamp-like
  try {
    const anyVal: any = value as any;
    if (anyVal && typeof anyVal.toDate === 'function') {
      return anyVal.toDate();
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function formatDateForInput(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameMonthYear(a: Date | string | null | undefined, b: Date | string | null | undefined): boolean {
  const da = toDate(a); const db = toDate(b);
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear() && (da.getMonth() === db.getMonth());
}
