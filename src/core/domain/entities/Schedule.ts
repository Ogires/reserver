export interface Schedule {
  id: string; // UUID
  tenantId: string; // UUID
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  openTime: string; // 'HH:mm' format (e.g., '09:00')
  closeTime: string; // 'HH:mm' format (e.g., '18:00')
}
