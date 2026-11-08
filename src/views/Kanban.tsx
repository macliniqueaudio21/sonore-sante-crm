import { useState } from 'react'
import { ArrowLeft, ArrowRight, Ban, CalendarCheck, CalendarClock, Clock, Copy, MapPin, MapPinOff, MoreHorizontal, Phone, PhoneOff, Sparkles, ThumbsDown } from 'lucide-react'
import { useStore } from '../store'
import { KANBAN_ETATS } from '../data/constants'
import type { EtatProspect, Prospect } from '../data/types'
import { ageHours, cn, formatAge, fullName } from '../lib/utils'
import { Button, CentreBadge, EmptyState, PageHeader } from '../components/ui'
import { MetaTags, SourceDot } from '../components/MetaTags'

const COLS: { etat: EtatProspect; hint: string; dot: string }[] = [
  { etat: 'Nouveau lead', hint: 'À appeler en priorité (< 2 h)', dot: 'bg-indigo-500' },
  { etat: 'NRP 1', hint: '1re tentative sans réponse', dot: 'bg-amber-500' },
  { etat: 'NRP 2', hint: '2e tentative sans réponse', dot: 'bg-orange-500' },
]

export function Kanban({ onMenu }: { onMenu: () => void }) {
  const { visible, state, setEtat, toast } = useStore()
  const [dragOver, setDragOver] = useState<EtatProspect | null>(null)
  const items = visible.filter((p) => p.statut === null && KANBAN_ETATS.includes(p.etat))
  const late = items.filter((p) => p.etat === 'Nouveau lead' && ageHours(p.createdAt) > 2).length

  const move = (p: Prospect, etat: EtatProspect) => {
    if (p.etat === etat) return
    setEtat(p.id, etat, `État prospect → ${etat}`)
    toast({ title: `${fullName(p)} → ${etat}`, description: KANBAN_ETATS.includes(etat) ? undefined : 'Le prospect a quitté le Kanban.' })
  }

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Suivi des Prospects"
        subtitle={
          <>
            {items.length} prospect{items.length > 1 ? 's' : ''} en cours de qualification
            {late > 0 && <span className="ml-2 font-medium text-rose-600">· {late} nouveau{late > 1 ? 'x' : ''} lead{late > 1 ? 's' : ''} hors délai de 2 h</span>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLS.map((col) => {
          const cards = items
            .filter((p) => p.etat === col.etat)
            .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
          return (
            <div
              key={col.etat}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(col.etat)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                const p = state.prospects.find((x) => x.id === e.dataTransfer.getData('text/plain'))
                if (p) move(p, col.etat)
              }}
              className={cn('flex min-h-[200px] flex-col rounded-2xl border bg-slate-100/60 p-3 transition-colors', dragOver === col.etat ? 'border-indigo-300 bg-indigo-50/60' : 'border-transparent')}
            >
              <div className="mb-3 flex items-center justify-between px-1.5 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                    <h2 className="text-sm font-semibold text-slate-800">{col.etat}</h2>
                    <span className="rounded-full bg-white px-2 text-xs font-semibold text-slate-600 tabular-nums shadow-sm">{cards.length}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{col.hint}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {cards.map((p) => (
                  <LeadCard key={p.id} p={p} onMove={(e) => move(p, e)} />
                ))}
                {cards.length === 0 && <EmptyState icon={<Sparkles size={18} />} title="Colonne vide" text="Tout est traité ici, bravo !" />}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function LeadCard({ p, onMove }: { p: Prospect; onMove: (e: EtatProspect) => void }) {
  const { select, openRdv, openRelance } = useStore()
  const [menu, setMenu] = useState(false)
  const h = ageHours(p.createdAt)
  const urgent = h > 2
  const idx = KANBAN_ETATS.indexOf(p.etat)
  const prev = KANBAN_ETATS[idx - 1]
  const next = KANBAN_ETATS[idx + 1]

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
      className="group relative cursor-grab rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => select(p.id)} className="min-w-0 cursor-pointer text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600">
              {p.nom.toUpperCase()} {p.prenom}
            </span>
            <SourceDot source={p.source} />
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={11} /> {p.ville}
          </div>
        </button>
        <span
          title={`Reçu il y a ${formatAge(p.createdAt)}`}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
            urgent ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15',
          )}
        >
          <Clock size={11} />
          {formatAge(p.createdAt)}
        </span>
      </div>

      <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[13px] font-medium text-slate-800 tabular-nums hover:bg-emerald-50 hover:text-emerald-700">
        <Phone size={13} className="text-emerald-600" />
        {p.telephone}
      </a>

      <MetaTags p={p} className="mt-2.5" />

      <div className="mt-3 flex items-center justify-between gap-1 border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-1">
          <CentreBadge centre={p.centre} />
        </div>
        <div className="flex items-center gap-1">
          {prev && (
            <IconBtn title={`Revenir en ${prev}`} onClick={() => onMove(prev)}>
              <ArrowLeft size={14} />
            </IconBtn>
          )}
          {next && (
            <button onClick={() => onMove(next)} className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11.5px] font-medium text-amber-700 ring-1 ring-amber-200 ring-inset hover:bg-amber-50" title={`Passer en ${next}`}>
              {next} <ArrowRight size={12} />
            </button>
          )}
          <div className="relative">
            <IconBtn title="Plus d'actions" onClick={() => setMenu((m) => !m)}>
              <MoreHorizontal size={14} />
            </IconBtn>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="animate-pop-in absolute right-0 bottom-full z-20 mb-1 w-48 rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
                  <MenuItem icon={<CalendarClock size={14} />} onClick={() => { setMenu(false); openRelance(p.id) }}>Relance phoning…</MenuItem>
                  <div className="mx-2 my-1 h-px bg-slate-100" />
                  <MenuItem icon={<ThumbsDown size={14} />} onClick={() => { setMenu(false); onMove('Pas intéressé') }}>Pas intéressé</MenuItem>
                  <MenuItem icon={<MapPinOff size={14} />} onClick={() => { setMenu(false); onMove('Hors zone') }}>Hors zone</MenuItem>
                  <MenuItem icon={<PhoneOff size={14} />} onClick={() => { setMenu(false); onMove('Faux numéro') }}>Faux numéro</MenuItem>
                  <MenuItem icon={<Copy size={14} />} onClick={() => { setMenu(false); onMove('Doublon') }}>Doublon</MenuItem>
                  <MenuItem icon={<Ban size={14} />} onClick={() => { setMenu(false); onMove('Clôture') }}>Clôture</MenuItem>
                </div>
              </>
            )}
          </div>
          <Button size="sm" variant="emerald" className="h-7 px-2 text-[11.5px]" onClick={() => openRdv(p.id)}>
            <CalendarCheck size={13} /> RDV
          </Button>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-slate-500 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 hover:text-slate-800">
      {children}
    </button>
  )
}
function MenuItem({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">
      <span className="text-slate-400">{icon}</span>
      {children}
    </button>
  )
}
