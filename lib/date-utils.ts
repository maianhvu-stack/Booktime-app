export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

export function parseDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`)
}
