export const NBSP = ' '

/** Applique la typographie française : espace insécable avant € % : ? ! ; » et après «. */
export function fr(text: string): string {
  return text
    .replace(/ ([€%:;?!»])/g, NBSP + '$1')
    .replace(/« /g, '«' + NBSP)
}

export function formatEuros(value: number): string {
  const rounded = Math.round(value)
  return new Intl.NumberFormat('fr-FR').format(rounded) + NBSP + '€'
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

/** 400 → « 6 h 40 », 45 → « 45 min », 120 → « 2 h ». */
export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total))
  if (minutes < 60) return minutes + NBSP + 'min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return h + NBSP + 'h'
  return h + NBSP + 'h' + NBSP + String(m).padStart(2, '0')
}

export function toIsoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso(): string {
  return toIsoDay(new Date())
}

export function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isoToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

/** « mardi 23 septembre » */
export function formatDayLabel(iso: string): string {
  const date = isoToDate(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/** « mar. 23 sept. » */
export function formatShortDay(iso: string): string {
  const date = isoToDate(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    date,
  )
}

/** 10 → « entre 10 h et 12 h » */
export function formatSlot(startHour: number): string {
  return `entre ${startHour}${NBSP}h et ${startHour + 2}${NBSP}h`
}

export function formatTime(time: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!m) return time
  return `${m[1]}${NBSP}h${NBSP}${m[2]}`
}
