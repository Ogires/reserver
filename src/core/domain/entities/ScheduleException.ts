export interface ScheduleException {
  id: string; // UUID
  tenantId: string; // UUID
  exceptionDate: string; // 'YYYY-MM-DD' format (e.g., '2026-12-25')
  isClosed: boolean; // if true, whole day is blocked
  openTime?: string; // 'HH:mm' format. Used if isClosed is false for custom hours.
  closeTime?: string; // 'HH:mm' format
}
