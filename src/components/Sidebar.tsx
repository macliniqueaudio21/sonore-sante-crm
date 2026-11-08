import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Check,
  ChevronsUpDown,
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

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 8v4M7.5 5.5v9M11 7v6M14.5 8.5v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-white">Sonore Santé</div>
        <span className="mt-0.5 inline-block rounded-md bg-indigo-500/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-indigo-300 uppercase ring-1 ring-indigo-400/20">
          Espace Partenaire
        </span>
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
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-2.5 text-left transition-colors hover:bg-white/[0.07]"
      >
        <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', current.id === 'all' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/15 text-emerald-300')}>
          {current.id === 'all' ? <Globe size={16} /> : <MapPin size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-white">{current.label}</div>
          <div className="truncate text-[11px] text-slate-400">{current.sub}</div>
        </div>
        <ChevronsUpDown size={15} className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="animate-pop-in absolute top-full right-0 left-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-slate-800 p-1 shadow-2xl shadow-black/40">
          <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Changer de centre</div>
          {BRANCHES.map((b, i) => {
            const active = b.id === state.branch
            return (
              <div key={b.id}>
                {i === 1 && <div className="mx-2 my-1 h-px bg-white/5" />}
                <button
                  onClick={() => {
                    setBranch(b.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                    active ? 'bg-white/[0.06] text-white' : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  {b.id === 'all' ? <Globe size={15} className="text-indigo-300" /> : <MapPin size={15} className="text-emerald-400" />}
                  <span className="flex-1 truncate">{b.label}</span>
                  {active && <Check size={14} className="text-emerald-400" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  badge?: { text: string; tone: 'rose' | 'amber' }
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
        active ? 'bg-emerald-500/10 text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
      )}
    >
      {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-emerald-400" />}
      <Icon size={18} className={cn('shrink-0', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
      <span className="flex-1 truncate text-left">{label}</span>
      {badge && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
            badge.tone === 'rose' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30',
          )}
        >
          {badge.text}
        </span>
      )}
    </button>
  )
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { state, setView, counts } = useStore()
  const go = (v: ViewId) => {
    setView(v)
    onClose()
  }

  const main: { id: ViewId; label: string; icon: LucideIcon; badge?: { text: string; tone: 'rose' | 'amber' } }[] = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'kanban', label: 'Suivi des Prospects', icon: KanbanSquare, badge: counts.aTraiter > 0 ? { text: `${counts.aTraiter} à traiter`, tone: 'rose' } : undefined },
    { id: 'relance', label: 'Relance Phoning', icon: PhoneCall, badge: counts.relanceToday > 0 ? { text: `${counts.relanceToday} aujourd'hui`, tone: 'amber' } : undefined },
    { id: 'parcours', label: 'Parcours Patient', icon: Route },
    { id: 'prospects', label: 'Tous les Prospects', icon: Users },
  ]

  return (
    <>
      {mobileOpen && <div className="animate-fade-in fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col bg-[#0F172A] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <Logo />
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white lg:hidden" aria-label="Fermer le menu">
            <X size={18} />
          </button>
        </div>

        <div className="px-4">
          <BranchSwitcher />
        </div>

        <nav className="scrollbar-dark mt-6 flex-1 space-y-0.5 overflow-y-auto px-3">
          <div className="px-3 pb-2 text-[10.5px] font-semibold tracking-wider text-slate-500 uppercase">Pilotage</div>
          {main.map((item) => (
            <NavItem key={item.id} {...item} active={state.view === item.id} onClick={() => go(item.id)} />
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-white/5 px-3 pt-3">
          <NavItem icon={CreditCard} label="Facturation" active={state.view === 'facturation'} onClick={() => go('facturation')} />
          <NavItem icon={LifeBuoy} label="Support" active={state.view === 'support'} onClick={() => go('support')} />
        </div>

        <div className="m-3 flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-xs font-semibold text-white">
            {CURRENT_USER.initiales}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-medium text-white">{CURRENT_USER.nom}</div>
            <div className="truncate text-[11px] text-slate-500">{CURRENT_USER.role}</div>
          </div>
          <Building2 size={15} className="text-slate-600" />
        </div>
      </aside>
    </>
  )
}
