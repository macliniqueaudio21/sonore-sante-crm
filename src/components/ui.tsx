import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'
import { CENTRES, ETAT_DOT, STATUTS, STATUT_DOT } from '../data/constants'
import type { CentreId, EtatProspect, StatutSuivi } from '../data/types'
import { useDesign } from '../design'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card-surface', className)}>{children}</div>
}

/** Badge gris monochrome, avec un petit point de couleur facultatif. */
export function Badge({ dot, className, children }: { dot?: string; className?: string; children: ReactNode }) {
  return (
    <span className={cn('badge-dot', className)}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />}
      {children}
    </span>
  )
}
export const EtatBadge = ({ etat }: { etat: EtatProspect }) => <Badge dot={ETAT_DOT[etat]}>{etat}</Badge>
export const StatutBadge = ({ statut }: { statut: StatutSuivi }) => <Badge dot={STATUT_DOT[statut]}>{statut}</Badge>
export const CentreText = ({ centre }: { centre: CentreId }) => <span className="text-slate-500">{CENTRES[centre].court}</span>
/** Conservé pour compatibilité : le centre s'affiche désormais en texte gris. */
export const CentreBadge = CentreText

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent'
const VARIANTS: Record<Variant, string> = {
  accent: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  onMenu,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  onMenu?: () => void
}) {
  const { design } = useDesign()
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {onMenu && design.layout === 'sidebar' && (
          <button
            onClick={onMenu}
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        )}
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Sélecteur compact type « pilule » (périodes…). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
            o.value === value ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Onglets texte minimalistes sur une ligne : « Tous (127) | RDV Pris (5) | … ». */
export function TextTabs<T extends string>({
  value,
  onChange,
  options,
  right,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number; alert?: boolean }[]
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-x-6">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                '-mb-px cursor-pointer border-b-2 py-2.5 text-sm transition-colors',
                active ? 'border-[var(--accent)] font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {o.label}
              {o.count !== undefined && (
                <span className={cn('ml-1.5 tabular-nums', o.alert && o.count > 0 ? 'text-red-600' : 'text-slate-400')}>({o.count})</span>
              )}
            </button>
          )
        })}
      </div>
      {right && <div className="pb-2 text-sm text-slate-500">{right}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-900/20" onClick={onClose} />
      <div className="animate-pop-in flat-overlay relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none'

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 text-slate-300">{icon}</div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-slate-400">{text}</p>}
    </div>
  )
}

/* ---------------------- Contrôles d'édition en ligne ---------------------- */

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors', checked ? 'bg-[var(--accent)]' : 'bg-slate-200')}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  )
}

/** Menu déroulant « Statut Suivi Patient » : neutre, avec le point de couleur du statut. */
export function StatutSelect({
  value,
  onChange,
  className,
}: {
  value: StatutSuivi | null
  onChange: (v: StatutSuivi | null) => void
  className?: string
}) {
  return (
    <div className={cn('relative inline-flex', className)} onClick={(e) => e.stopPropagation()}>
      <span className="pointer-events-none absolute top-1/2 left-2.5 h-1.5 w-1.5 -translate-y-1/2 rounded-full" style={{ background: value ? STATUT_DOT[value] : '#D4D4D8' }} />
      <select
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || null) as StatutSuivi | null)}
        aria-label="Statut Suivi Patient"
        className="w-full cursor-pointer rounded-md border border-slate-200 bg-white py-1 pr-6 pl-6 text-[13px] text-slate-800 hover:border-slate-300 focus:border-slate-400 focus:outline-none"
      >
        <option value="">(Vide)</option>
        {STATUTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Champ « Panier Moyen (€) » : validé à la sortie du champ ou avec Entrée. */
export function PanierInput({ value, onCommit, className }: { value: number; onCommit: (v: number) => void; className?: string }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => {
    const n = Math.max(0, Math.round(Number(draft.replace(/\s/g, '').replace(',', '.'))))
    if (Number.isFinite(n) && n !== value) onCommit(n)
    else setDraft(String(value))
  }
  return (
    <div className={cn('relative', className)} onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min={0}
        step={50}
        inputMode="numeric"
        aria-label="Panier Moyen (€)"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-full rounded-md border border-transparent bg-transparent py-1 pr-6 pl-2 text-right text-[13px] text-slate-900 tabular-nums hover:border-slate-200 focus:border-slate-400 focus:bg-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-slate-400">€</span>
    </div>
  )
}

/** Nombre de jours d'essai (J+0 → J+30). */
export const essaiJours = (since?: string) => (since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)) : 0)

/** Jauge d'essai J+0 → J+30, fine et neutre. */
export function EssaiGauge({ since }: { since?: string }) {
  const j = essaiJours(since)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[var(--accent-text)]" style={{ width: `${Math.max(4, Math.min((j / 30) * 100, 100))}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">J+{j}/30</span>
    </div>
  )
}
