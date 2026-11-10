import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { CENTRES, ETATS, ETAT_DOT, STATUTS, STATUT_DOT, VIDE_DOT } from '../data/constants'
import type { CentreId, EtatProspect, StatutSuivi } from '../data/types'

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
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {onMenu && (
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

/** Onglets texte minimalistes sur une ligne : « Tous (127) | En attente (5) | … ». */
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
      <div className="animate-pop-in relative w-full max-w-md rounded-2xl bg-white shadow-xl">
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

/** Champ libellé. `group` : pour un ensemble de boutons (pas un <label> qui ne vise qu'un seul contrôle). */
export function Field({ label, children, group }: { label: string; children: ReactNode; group?: boolean }) {
  const caption = <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
  return group ? (
    <div role="group" aria-label={label} className="block">
      {caption}
      {children}
    </div>
  ) : (
    <label className="block">
      {caption}
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

export interface DotOption<T extends string> {
  value: T
  label: string
  /** Pastille de couleur (facultative). */
  dot?: string
}

/**
 * Menu déroulant sobre avec pastille de couleur (8 px) sur le bouton et dans la liste.
 * Se ferme au clic extérieur et avec Échap (sans fermer le panneau qui le contient).
 */
export function DotSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
  className,
}: {
  value: T
  options: DotOption<T>[]
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-white text-left text-slate-800 transition-colors',
          open ? 'border-slate-400' : 'border-slate-200 hover:border-slate-300',
          size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-[38px] px-3 text-sm',
        )}
      >
        {current.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: current.dot }} />}
        <span className="min-w-0 flex-1 truncate">{current.label}</span>
        <ChevronDown size={14} className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul role="listbox" className="animate-pop-in absolute top-full right-0 left-0 z-30 mt-1 max-h-72 min-w-[180px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  setOpen(false)
                  if (o.value !== value) onChange(o.value)
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-slate-50',
                  o.value === value ? 'font-medium text-slate-900' : 'text-slate-600',
                )}
              >
                {o.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.dot }} />}
                <span className="flex-1 truncate">{o.label}</span>
                {o.value === value && <Check size={13} className="text-emerald-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const ETAT_OPTIONS: DotOption<EtatProspect>[] = ETATS.map((e) => ({ value: e, label: e, dot: ETAT_DOT[e] }))
export const STATUT_OPTIONS: DotOption<StatutSuivi | ''>[] = [
  { value: '', label: '(Vide)', dot: VIDE_DOT },
  ...STATUTS.map((s) => ({ value: s, label: s, dot: STATUT_DOT[s] })),
]

/** « Statut Suivi Patient » : menu à pastilles, valeur vide = (Vide). */
export function StatutSelect({
  value,
  onChange,
  size = 'sm',
  className,
}: {
  value: StatutSuivi | null
  onChange: (v: StatutSuivi | null) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <DotSelect
      label="Statut Suivi Patient"
      size={size}
      className={className}
      value={value ?? ''}
      options={STATUT_OPTIONS}
      onChange={(v) => onChange(v === '' ? null : v)}
    />
  )
}

/** Champ « Montant facturé (€) » : jamais pré-rempli, validé à la sortie du champ ou avec Entrée. */
export function MontantInput({
  value,
  onCommit,
  className,
  bordered,
}: {
  value?: number
  onCommit: (v: number | undefined) => void
  className?: string
  bordered?: boolean
}) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value))
  useEffect(() => setDraft(value === undefined ? '' : String(value)), [value])
  const commit = () => {
    const raw = draft.replace(/\s/g, '').replace(',', '.')
    const n = raw === '' ? undefined : Math.max(0, Math.round(Number(raw)))
    if (n !== undefined && !Number.isFinite(n)) return setDraft(value === undefined ? '' : String(value))
    if (n !== value) onCommit(n)
  }
  return (
    <div className={cn('relative', className)} onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min={0}
        step={10}
        inputMode="numeric"
        aria-label="Montant facturé (€)"
        placeholder="—"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={cn(
          'w-full rounded-md border py-1 pr-6 pl-2 text-right text-[13px] text-slate-900 tabular-nums placeholder:text-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
          bordered ? 'h-[38px] rounded-lg border-slate-200 bg-white text-sm' : 'border-transparent bg-transparent hover:border-slate-200',
        )}
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

/** Pastille d'initiales : verte pour un patient (statut suivi renseigné), grise pour un prospect. */
export function Initials({ prenom, nom, green }: { prenom: string; nom: string; green: boolean }) {
  return (
    <span
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold',
        green ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500',
      )}
    >
      {`${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()}
    </span>
  )
}
