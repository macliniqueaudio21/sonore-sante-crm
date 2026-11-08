import type { BranchId, Prospect } from '../data/types'

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

export const HOUR = 3_600_000
export const DAY = 24 * HOUR

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const formatEur = (n: number) => eur.format(n)
export const formatEurCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k€` : `${n} €`
export const formatInt = (n: number) => n.toLocaleString('fr-FR')
export const formatPct = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`

export const ageHours = (iso: string, now = Date.now()) => (now - new Date(iso).getTime()) / HOUR

export function formatAge(iso: string, now = Date.now()) {
  const h = ageHours(iso, now)
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`
  if (h < 48) return `${Math.floor(h)} h`
  return `${Math.floor(h / 24)} j`
}

export const startOfDay = (d: Date | number = Date.now()) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('fr-FR', opts)
}
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** « Aujourd'hui 14:30 », « Demain 09:00 », « Hier 17:00 », sinon « mar. 12 nov. 10:00 ». */
export function formatRelativeDay(iso: string) {
  const d = new Date(iso)
  const diff = Math.round((startOfDay(d).getTime() - startOfDay().getTime()) / DAY)
  const t = formatTime(iso)
  if (diff === 0) return `Aujourd'hui ${t}`
  if (diff === 1) return `Demain ${t}`
  if (diff === -1) return `Hier ${t}`
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${t}`
}

export const inBranch = (p: Prospect, branch: BranchId) => branch === 'all' || p.centre === branch
export const fullName = (p: Prospect) => `${p.prenom} ${p.nom}`
export const initials = (p: Prospect) => `${p.prenom[0]}${p.nom[0]}`.toUpperCase()

/** Valeur pour <input type="datetime-local"> en heure locale. */
export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Classement d'une date de rappel. */
export function rappelBucket(iso: string | undefined): 'retard' | 'today' | 'week' | 'later' | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  const today = startOfDay().getTime()
  if (t < today) return 'retard'
  if (t < today + DAY) return 'today'
  if (t < today + 8 * DAY) return 'week'
  return 'later'
}
