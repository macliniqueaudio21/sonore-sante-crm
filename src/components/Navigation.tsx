import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  CreditCard,
  Globe,
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
import { BRANCHES, CURRENT_USER } from '../data/constants'
import type { ViewId } from '../data/types'
import { cn } from '../lib/utils'
import { useDesign } from '../design'

interface NavEntry {
  id: ViewId
  label: string
  short: string
  icon: LucideIcon
  count?: number
  countTitle?: string
  tone?: 'red' | 'amber'
}

function useNavEntries(): NavEntry[] {
  const { counts } = useStore()
  return [
    { id: 'dashboard', label: 'Tableau de Bord', short: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'kanban', label: 'Suivi des Prospects', short: 'Prospects', icon: KanbanSquare, count: counts.aTraiter, countTitle: `${counts.aTraiter} à traiter`, tone: 'red' },
    { id: 'relance', label: 'Relance Phoning', short: 'Relances', icon: PhoneCall, count: counts.relanceToday, countTitle: `${counts.relanceToday} aujourd'hui`, tone: 'amber' },
    { id: 'parcours', label: 'Parcours Patient', short: 'Parcours patient', icon: Route },
    { id: 'prospects', label: 'Tous les Prospects', short: 'Tous les prospects', icon: Users },
  ]
}

/** Compteur discret : chiffre gris + petit point rouge (à traiter) ou ambre (aujourd'hui). */
function Count({ n, tone, title }: { n?: number; tone?: 'red' | 'amber'; title?: string }) {
  if (!n) return null
  return (
    <span title={title} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 tabular-nums">
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'red' ? 'bg-red-500' : 'bg-amber-500')} />
      {n}
    </span>
  )
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent)]">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M4 8v4M7.5 5.5v9M11 7v6M14.5 8.5v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[14px] font-semibold tracking-tight text-slate-900">Sonore Santé</div>
        {!compact && <div className="text-[10.5px] font-medium text-slate-400">Espace Partenaire</div>}
      </div>
      {compact && <span className="rounded border border-slate-200 px-1.5 py-px text-[10px] font-medium text-slate-500">Espace Partenaire</span>}
    </div>
  )
}

export function BranchSwitcher({ compact }: { compact?: boolean }) {
  const { state, setBranch } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = BRANCHES.find((b) => b.id === state.branch)!

  useEffect(() => {
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const label = current.id === 'all' ? 'Tous les centres' : current.label.replace('Centre de ', '')
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white text-left transition-colors hover:border-slate-300',
          compact ? 'h-9 px-2.5' : 'px-2.5 py-2',
        )}
      >
        {current.id === 'all' ? <Globe size={14} className="shrink-0 text-slate-400" /> : <MapPin size={14} className="shrink-0 text-slate-400" />}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{label}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className={cn('animate-pop-in flat-overlay absolute top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg', compact ? 'left-0 w-64' : 'right-0 left-0')}>
          {BRANCHES.map((b, i) => (
            <div key={b.id}>
              {i === 1 && <div className="mx-2 my-1 h-px bg-slate-100" />}
              <button
                onClick={() => {
                  setBranch(b.id)
                  setOpen(false)
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{b.id === 'all' ? `Vue Globale Groupe` : b.label}</span>
                  {b.id === 'all' && <span className="block text-[11px] text-slate-400">{b.sub}</span>}
                </span>
                {b.id === state.branch && <Check size={14} className="text-[var(--accent-text)]" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserChip() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{CURRENT_USER.initiales}</div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[13px] font-medium text-slate-800">{CURRENT_USER.nom}</div>
        <div className="truncate text-[11px] text-slate-400">{CURRENT_USER.role}</div>
      </div>
    </div>
  )
}

/* -------------------------- Barre latérale fine --------------------------- */
export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { state, setView } = useStore()
  const { design } = useDesign()
  const entries = useNavEntries()
  const swiss = design.id === 'swiss'
  const go = (v: ViewId) => {
    setView(v)
    onClose()
  }
  const item = (active: boolean) =>
    cn(
      'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left transition-colors',
      swiss ? 'py-1.5 text-[13px]' : 'py-2 text-[13px]',
      active
        ? swiss
          ? 'bg-slate-200/70 font-medium text-slate-900'
          : 'bg-[var(--accent-soft)] font-medium text-[var(--accent-soft-text)]'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    )

  return (
    <>
      {mobileOpen && <div className="animate-fade-in fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-[var(--nav-border)] bg-[var(--nav-bg)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <Logo />
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-700 lg:hidden" aria-label="Fermer le menu">
            <X size={16} />
          </button>
        </div>
        <div className="px-3">
          <BranchSwitcher />
        </div>
        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3">
          {entries.map((e) => {
            const Icon = e.icon
            const active = state.view === e.id
            return (
              <button key={e.id} onClick={() => go(e.id)} className={item(active)}>
                <Icon size={16} strokeWidth={1.75} className={cn('shrink-0', active ? '' : 'text-slate-400')} />
                <span className="flex-1 truncate">{e.label}</span>
                <Count n={e.count} tone={e.tone} title={e.countTitle} />
              </button>
            )
          })}
        </nav>
        <div className="space-y-0.5 px-3 pb-2">
          <button onClick={() => go('facturation')} className={item(state.view === 'facturation')}>
            <CreditCard size={16} strokeWidth={1.75} className="text-slate-400" /> Facturation
          </button>
          <button onClick={() => go('support')} className={item(state.view === 'support')}>
            <LifeBuoy size={16} strokeWidth={1.75} className="text-slate-400" /> Support
          </button>
        </div>
        <div className="border-t border-[var(--nav-border)] p-3">
          <UserChip />
        </div>
      </aside>
    </>
  )
}

/* ----------------------- Barre de navigation en haut ---------------------- */
export function TopNav() {
  const { state, setView } = useStore()
  const entries = useNavEntries()
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--nav-border)] bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-6 px-6 lg:px-10">
        <div className="hidden shrink-0 md:block">
          <Logo compact />
        </div>
        <div className="w-44 shrink-0 md:w-52">
          <BranchSwitcher compact />
        </div>
        <nav className="scrollbar-none flex h-full min-w-0 flex-1 items-stretch gap-1 overflow-x-auto">
          {entries.map((e) => {
            const active = state.view === e.id
            return (
              <button
                key={e.id}
                onClick={() => setView(e.id)}
                className={cn(
                  '-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 text-[13.5px] whitespace-nowrap transition-colors',
                  active ? 'border-[var(--accent)] font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900',
                )}
              >
                {e.short}
                <Count n={e.count} tone={e.tone} title={e.countTitle} />
              </button>
            )
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-1 lg:flex">
          <button onClick={() => setView('facturation')} title="Facturation" className={cn('grid h-9 w-9 cursor-pointer place-items-center rounded-lg hover:bg-slate-100', state.view === 'facturation' ? 'text-slate-900' : 'text-slate-400')}>
            <CreditCard size={17} strokeWidth={1.75} />
          </button>
          <button onClick={() => setView('support')} title="Support" className={cn('grid h-9 w-9 cursor-pointer place-items-center rounded-lg hover:bg-slate-100', state.view === 'support' ? 'text-slate-900' : 'text-slate-400')}>
            <LifeBuoy size={17} strokeWidth={1.75} />
          </button>
          <div className="ml-2 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600" title={CURRENT_USER.nom}>
            {CURRENT_USER.initiales}
          </div>
        </div>
      </div>
    </header>
  )
}
