import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'
import { CENTRES, ETAT_STYLE, STATUT_STYLE } from '../data/constants'
import type { CentreId, EtatProspect, StatutSuivi } from '../data/types'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-6px_rgba(15,23,42,0.06)]', className)}>
      {children}
    </div>
  )
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', className)}>
      {children}
    </span>
  )
}

export const EtatBadge = ({ etat }: { etat: EtatProspect }) => <Badge className={ETAT_STYLE[etat]}>{etat}</Badge>
export const StatutBadge = ({ statut }: { statut: StatutSuivi }) => <Badge className={STATUT_STYLE[statut]}>{statut}</Badge>
export const CentreBadge = ({ centre }: { centre: CentreId }) => (
  <Badge className="bg-white text-slate-600 ring-slate-200">{CENTRES[centre].court}</Badge>
)

type Variant = 'primary' | 'secondary' | 'ghost' | 'emerald' | 'danger'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  emerald: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50',
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
        'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-4 text-sm',
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
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; count?: number; tone?: 'rose' | 'amber' | 'slate' }[]
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                  o.tone === 'rose' ? 'bg-rose-100 text-rose-700' : o.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
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
      <div className="animate-fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-pop-in relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10'

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-slate-500">{text}</p>}
    </div>
  )
}
