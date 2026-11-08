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

interface NavEntry {
  id: ViewId
  label: string
  icon: LucideIcon
  count?: number
  countTitle?: string
  tone?: 'red' | 'amber'
}

function useNavEntries(): NavEntry[] {
  const { counts } = useStore()
  return [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'kanban', label: 'Suivi des Prospects', icon: KanbanSquare, count: counts.aTraiter, countTitle: `${counts.aTraiter} à traiter`, tone: 'red' },
    { id: 'relance', label: 'Relance Phoning', icon: PhoneCall, count: counts.relanceToday, countTitle: `${counts.relanceToday} aujourd'hui`, tone: 'amber' },
    { id: 'parcours', label: 'Parcours Patient', icon: Route },
    { id: 'prospects', label: 'Tous les Prospects', icon: Users },
  ]
}

/** Compteur discret : chiffre + petit point rouge (à traiter) ou ambre (aujourd'hui). */
function Count({ n, tone, title }: { n?: number; tone?: 'red' | 'amber'; title?: string }) {
  if (!n) return null
  return (
    <span title={title} className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums opacity-80">
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'red' ? 'bg-red-500' : 'bg-amber-400')} />
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

function BranchSwitcher() {
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
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-[var(--nav-input-border)] bg-[var(--nav-input-bg)] px-2.5 py-2 text-left transition-opacity hover:opacity-90"
      >
        {current.id === 'all' ? <Globe size={14} className="shrink-0 text-[var(--nav-muted)]" /> : <MapPin size={14} className="shrink-0 text-[var(--nav-muted)]" />}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--nav-title)]">{label}</span>
        <ChevronDown size={14} className="shrink-0 text-[var(--nav-muted)]" />
      </button>
      {open && (
        <div className="animate-pop-in absolute top-full right-0 left-0 z-30 mt-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {BRANCHES.map((b, i) => (
            <div key={b.id}>
              {i === 1 && <div className="mx-2 my-1 h-px bg-slate-100" />}
              <button
                onClick={() => {
                  setBranch(b.id)
                  setOpen(false)
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-slate-700 hover:bg-emerald-50/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{b.id === 'all' ? 'Vue Globale Groupe' : b.label}</span>
                  {b.id === 'all' && <span className="block text-[11px] text-slate-400">{b.sub}</span>}
                </span>
                {b.id === state.branch && <Check size={14} className="text-emerald-600" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { state, setView } = useStore()
  const entries = useNavEntries()
  const go = (v: ViewId) => {
    setView(v)
    onClose()
  }

  const Item = ({ id, label, icon: Icon, count, tone, countTitle }: NavEntry) => {
    const active = state.view === id
    return (
      <button
        onClick={() => go(id)}
        className={cn(
          'relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors',
          active
            ? 'bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]'
            : 'text-[var(--nav-text)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--nav-title)]',
        )}
      >
        {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-[var(--nav-active-bar)]" />}
        <Icon size={16} strokeWidth={1.75} className={cn('shrink-0', !active && 'text-[var(--nav-muted)]')} />
        <span className="flex-1 truncate">{label}</span>
        <Count n={count} tone={tone} title={countTitle} />
      </button>
    )
  }

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
          <button onClick={onClose} className="rounded-md p-1 text-[var(--nav-muted)] lg:hidden" aria-label="Fermer le menu">
            <X size={16} />
          </button>
        </div>
        <div className="px-3">
          <BranchSwitcher />
        </div>
        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3">
          {entries.map((e) => (
            <Item key={e.id} {...e} />
          ))}
        </nav>
        <div className="space-y-0.5 px-3 pb-2">
          <Item id="facturation" label="Facturation" icon={CreditCard} />
          <Item id="support" label="Support" icon={LifeBuoy} />
        </div>
        <div className="flex items-center gap-2.5 border-t border-[var(--nav-input-border)] p-3">
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
