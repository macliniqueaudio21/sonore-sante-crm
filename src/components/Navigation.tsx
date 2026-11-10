import { useEffect, useState } from 'react'
import {
  ChevronRight,
  CreditCard,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  PhoneCall,
  Route,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, CURRENT_USER } from '../data/constants'
import type { BranchId, CentreId, ViewId } from '../data/types'
import { cn } from '../lib/utils'

const CENTRE_IDS = Object.keys(CENTRES) as CentreId[]
const MULTI = CENTRE_IDS.length > 1

/** Pastille d'alerte : rouge (nouveaux leads à traiter) ou ambre (relances dues). */
function Pill({ n, tone, title }: { n: number; tone: 'red' | 'amber'; title: string }) {
  if (!n) return null
  return (
    <span
      title={title}
      className={cn(
        'grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-semibold tabular-nums',
        tone === 'red' ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-950',
      )}
    >
      {n}
    </span>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--nav-logo)]">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M4 8v4M7.5 5.5v9M11 7v6M14.5 8.5v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[14px] font-semibold tracking-tight text-[var(--nav-logo)]">Sonore Santé</div>
        <div className="text-[10.5px] font-medium text-[var(--nav-sub)]">Espace Partenaire</div>
      </div>
    </div>
  )
}

const itemCls = (active: boolean) =>
  cn(
    'relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors',
    active
      ? 'bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]'
      : 'text-[var(--nav-text)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--nav-title)]',
  )

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  children,
  compact,
}: {
  icon?: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  children?: React.ReactNode
  compact?: boolean
}) {
  return (
    <button onClick={onClick} className={cn(itemCls(active), compact && 'py-1.5')} aria-current={active ? 'page' : undefined}>
      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-[var(--nav-active-bar)]" />}
      {Icon && <Icon size={16} strokeWidth={1.75} className={cn('shrink-0', !active && 'text-[var(--nav-muted)]')} />}
      <span className="flex-1 truncate">{label}</span>
      {children}
    </button>
  )
}

const CENTRE_VIEWS: { view: ViewId; label: string; icon: LucideIcon }[] = [
  { view: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'kanban', label: 'Suivi des Prospects', icon: KanbanSquare },
  { view: 'relance', label: 'Relance Phoning', icon: PhoneCall },
  { view: 'parcours', label: 'Parcours Patient', icon: Route },
]

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { state, go, countsByCentre } = useStore()
  // Mono-centre : déplié d'office. Multi-centres : le premier centre est déplié au chargement.
  const [open, setOpen] = useState<Set<CentreId>>(() => new Set([CENTRE_IDS[0]]))

  // Un centre sélectionné ailleurs (ex. filtre du tableau de bord) se déplie automatiquement.
  useEffect(() => {
    if (state.branch !== 'all') setOpen((s) => (s.has(state.branch as CentreId) ? s : new Set(s).add(state.branch as CentreId)))
  }, [state.branch])

  const nav = (view: ViewId, branch: BranchId) => {
    go(view, branch)
    onClose()
  }
  const toggle = (c: CentreId) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })
  const isActive = (view: ViewId, branch: BranchId) => state.view === view && state.branch === branch

  return (
    <>
      {mobileOpen && <div className="animate-fade-in fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col bg-[var(--nav-bg)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-5">
          <Logo />
          <button onClick={onClose} className="rounded-md p-1 text-[var(--nav-muted)] lg:hidden" aria-label="Fermer le menu">
            <X size={16} />
          </button>
        </div>

        <nav className="scrollbar-none flex-1 overflow-y-auto px-3">
          <NavItem
            icon={LayoutDashboard}
            label="Tableau de Bord"
            active={isActive('dashboard', MULTI ? 'all' : CENTRE_IDS[0])}
            onClick={() => nav('dashboard', MULTI ? 'all' : CENTRE_IDS[0])}
          />

          <div className="mt-5 mb-1.5 px-2 text-[10.5px] font-semibold tracking-wider text-[var(--nav-sub)] uppercase">Centres</div>
          <ul className="space-y-0.5">
            {CENTRE_IDS.map((c) => {
              const expanded = open.has(c)
              const a = countsByCentre[c]
              const inCentre = state.branch === c && state.view !== 'prospects'
              return (
                <li key={c}>
                  <button
                    onClick={() => toggle(c)}
                    aria-expanded={expanded}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors hover:bg-[var(--nav-hover-bg)]',
                      inCentre ? 'font-medium text-[var(--nav-title)]' : 'text-[var(--nav-text)]',
                    )}
                  >
                    <MapPin size={15} strokeWidth={1.75} className={cn('shrink-0', inCentre ? 'text-[var(--nav-logo)]' : 'text-[var(--nav-muted)]')} />
                    <span className="flex-1 truncate">{CENTRES[c].court}</span>
                    {!expanded && (
                      <span className="flex items-center gap-1">
                        <Pill n={a.aTraiter} tone="red" title={`${a.aTraiter} nouveau(x) lead(s) à traiter`} />
                        <Pill n={a.relanceDues} tone="amber" title={`${a.relanceDues} relance(s) phoning due(s)`} />
                      </span>
                    )}
                    <ChevronRight size={14} className={cn('shrink-0 text-[var(--nav-muted)] transition-transform duration-200', expanded && 'rotate-90')} />
                  </button>
                  {expanded && (
                    <div className="animate-fade-in mt-0.5 mb-1.5 ml-[15px] space-y-0.5 border-l border-[var(--nav-rule)] pl-2">
                      {CENTRE_VIEWS.map((v) => (
                        <NavItem key={v.view} compact label={v.label} active={isActive(v.view, c)} onClick={() => nav(v.view, c)}>
                          {v.view === 'kanban' && <Pill n={a.aTraiter} tone="red" title={`${a.aTraiter} à traiter`} />}
                          {v.view === 'relance' && <Pill n={a.relanceDues} tone="amber" title={`${a.relanceDues} relance(s) due(s)`} />}
                        </NavItem>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="mt-4">
            <NavItem icon={Users} label="Tous les Prospects" active={state.view === 'prospects'} onClick={() => nav('prospects', 'all')} />
          </div>
        </nav>

        <div className="space-y-0.5 px-3 pt-2 pb-2">
          <NavItem icon={CreditCard} label="Facturation" active={state.view === 'facturation'} onClick={() => nav('facturation', state.branch)} />
          <NavItem icon={LifeBuoy} label="Support" active={state.view === 'support'} onClick={() => nav('support', state.branch)} />
        </div>
        <div className="flex items-center gap-2.5 border-t border-[var(--nav-rule)] p-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--nav-avatar-bg)] text-[11px] font-semibold text-[var(--nav-avatar-text)]">
            {CURRENT_USER.initiales}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-medium text-[var(--nav-title)]">{CURRENT_USER.nom}</div>
            <div className="truncate text-[11px] text-[var(--nav-sub)]">{CURRENT_USER.role}</div>
          </div>
        </div>
      </aside>
    </>
  )
}
