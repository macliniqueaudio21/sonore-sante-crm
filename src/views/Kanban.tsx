import { useEffect, useRef, useState } from 'react'
import { Phone } from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, ETATS_SORTIE, KANBAN_ETATS } from '../data/constants'
import type { EtatProspect, Prospect } from '../data/types'
import { ageHours, cn, formatAge, fullName, initials } from '../lib/utils'
import { EmptyState, PageHeader } from '../components/ui'

/** border : liseré gauche des cartes, aux couleurs des pastilles d'état */
const COLS: { etat: EtatProspect; hint: string; border: string; dot: string }[] = [
  { etat: 'Nouveau lead', hint: 'À appeler sous 2 h', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  { etat: 'NRP 1', hint: '1re tentative sans réponse', border: 'border-l-amber-400', dot: 'bg-amber-400' },
  { etat: 'NRP 2', hint: '2e tentative sans réponse', border: 'border-l-orange-500', dot: 'bg-orange-500' },
]

export function Kanban({ onMenu }: { onMenu: () => void }) {
  const { visible, state, setEtat, toast } = useStore()
  const [dragOver, setDragOver] = useState<EtatProspect | null>(null)
  const items = visible.filter((p) => p.statut === null && KANBAN_ETATS.includes(p.etat))
  const late = items.filter((p) => p.etat === 'Nouveau lead' && ageHours(p.createdAt) > 2).length

  const move = (p: Prospect, etat: EtatProspect) => {
    if (p.etat === etat) return
    setEtat(p.id, etat, `État prospect → ${etat}`)
    toast({ title: `${fullName(p)} → ${etat}` })
  }

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Suivi des Prospects"
        subtitle={
          <>
            {state.branch === 'all' ? 'Tous les centres' : CENTRES[state.branch].nom} · {items.length} prospects à qualifier
            {late > 0 && <span className="text-red-600"> · {late} hors délai de 2 h</span>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COLS.map((col) => {
          const cards = items.filter((p) => p.etat === col.etat).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
          return (
            <section
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
              className={cn('min-h-[240px] rounded-2xl p-2 transition-colors', dragOver === col.etat && 'bg-emerald-50/60')}
            >
              <header className="mb-3 flex items-center justify-between px-1.5 pt-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  {col.etat} <span className="ml-1 font-normal text-slate-400 tabular-nums">{cards.length}</span>
                </h2>
                <span className="text-xs text-slate-400">{col.hint}</span>
              </header>
              <div className="flex flex-col gap-2">
                {cards.map((p) => (
                  <LeadCard key={p.id} p={p} border={col.border} />
                ))}
                {cards.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200">
                    <EmptyState icon={null} title="Aucun prospect" />
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}

/** Carte épurée : nom, ville, ancienneté, téléphone et une seule action. */
function LeadCard({ p, border }: { p: Prospect; border: string }) {
  const { select } = useStore()
  // Le délai de 2 h ne concerne que les nouveaux leads.
  const late = p.etat === 'Nouveau lead' && ageHours(p.createdAt) > 2
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
      onClick={() => select(p.id)}
      className={cn('card-surface group cursor-pointer border-l-[3px] p-3.5 transition-shadow hover:shadow-md', border)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-800">{initials(p)}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">{fullName(p)}</div>
            <div className="truncate text-xs text-slate-400">{p.ville}</div>
          </div>
        </div>
        <span title={`Reçu il y a ${formatAge(p.createdAt)}`} className={cn('shrink-0 text-xs tabular-nums', late ? 'font-medium text-red-600' : 'text-slate-400')}>
          {formatAge(p.createdAt)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <a
          href={`tel:${p.telephone.replace(/\s/g, '')}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-w-0 items-center gap-1.5 text-[13px] whitespace-nowrap text-slate-700 tabular-nums hover:text-emerald-700"
        >
          <Phone size={13} strokeWidth={1.75} className="text-slate-400" />
          {p.telephone}
        </a>
        <QualifyMenu p={p} />
      </div>
    </article>
  )
}

/** Un seul bouton sobre « Qualifier / RDV » qui regroupe toutes les actions. */
function QualifyMenu({ p }: { p: Prospect }) {
  const { openRdv, openRelance, setEtat, toast } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const next = KANBAN_ETATS[KANBAN_ETATS.indexOf(p.etat) + 1]
  const set = (etat: EtatProspect) => {
    setOpen(false)
    setEtat(p.id, etat, `État prospect → ${etat}`)
    toast({ title: `${fullName(p)} → ${etat}` })
  }
  const Item = ({ onClick, children, strong }: { onClick: () => void; children: React.ReactNode; strong?: boolean }) => (
    <button onClick={onClick} className={cn('block w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-slate-50', strong ? 'font-medium text-slate-900' : 'text-slate-600')}>
      {children}
    </button>
  )

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-7 shrink-0 cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium whitespace-nowrap text-emerald-700 transition-colors hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
        aria-expanded={open}
      >
        Qualifier / RDV
      </button>
      {open && (
        <div className="animate-pop-in absolute top-full right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <Item strong onClick={() => { setOpen(false); openRdv(p.id) }}>Fixer un RDV</Item>
          {next && <Item onClick={() => set(next)}>Passer en {next}</Item>}
          <Item onClick={() => { setOpen(false); openRelance(p.id) }}>Relance phoning…</Item>
          <div className="mx-2 my-1 h-px bg-slate-100" />
          {ETATS_SORTIE.map((e) => (
            <Item key={e} onClick={() => set(e)}>{e}</Item>
          ))}
        </div>
      )}
    </div>
  )
}
