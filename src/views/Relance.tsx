import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, PhoneCall } from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, ETATS_SORTIE } from '../data/constants'
import type { EtatProspect, Prospect } from '../data/types'
import { cn, formatRelativeDay, fullName, rappelBucket } from '../lib/utils'
import { Button, Card, EmptyState, PageHeader, TextTabs } from '../components/ui'

type Tab = 'retard' | 'today' | 'week'

export function Relance({ onMenu }: { onMenu: () => void }) {
  const { visible, state } = useStore()
  const relances = visible.filter((p) => p.statut === null && p.etat === 'Relance phoning')
  const groups: Record<Tab, Prospect[]> = { retard: [], today: [], week: [] }
  for (const p of relances) {
    const b = rappelBucket(p.rappelLe)
    if (b === 'retard' || b === 'today') groups[b].push(p)
    else if (b) groups.week.push(p)
  }
  for (const k of Object.keys(groups) as Tab[]) groups[k].sort((a, b) => +new Date(a.rappelLe!) - +new Date(b.rappelLe!))

  const [tab, setTab] = useState<Tab>(groups.retard.length ? 'retard' : 'today')
  const list = groups[tab]

  return (
    <>
      <PageHeader onMenu={onMenu} title="Relance Phoning" subtitle={`${state.branch === 'all' ? 'Tous les centres' : CENTRES[state.branch].nom} · ${relances.length} prospects à rappeler`} />
      <TextTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'retard', label: 'En retard', count: groups.retard.length, alert: true },
          { value: 'today', label: "Aujourd'hui", count: groups.today.length },
          { value: 'week', label: 'Cette semaine', count: groups.week.length },
        ]}
      />
      <Card className="divide-y divide-slate-100">
        {list.length === 0 && <EmptyState icon={<PhoneCall size={22} />} title="Aucune relance dans cet onglet" />}
        {list.map((p) => (
          <Row key={p.id} p={p} late={tab === 'retard'} />
        ))}
      </Card>
    </>
  )
}

function Row({ p, late }: { p: Prospect; late: boolean }) {
  const { select, openRdv, openRelance } = useStore()
  const last = p.notes[p.notes.length - 1]
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-6">
      <div className={cn('w-40 shrink-0 text-[13px] tabular-nums', late ? 'font-medium text-red-600' : 'text-slate-700')}>{formatRelativeDay(p.rappelLe!)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <button onClick={() => select(p.id)} className="cursor-pointer font-medium text-slate-900 hover:underline">{fullName(p)}</button>
          <span className="text-[13px] text-slate-400">{p.ville}</span>
          <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="text-[13px] whitespace-nowrap text-slate-600 tabular-nums hover:text-emerald-700">{p.telephone}</a>
        </div>
        {last && <p className="mt-1 truncate text-[13px] text-slate-500">{last.texte}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => openRelance(p.id)}>Reporter</Button>
        <Button size="sm" variant="accent" onClick={() => openRdv(p.id)}>Fixer RDV</Button>
        <MoreMenu p={p} />
      </div>
    </div>
  )
}

function MoreMenu({ p }: { p: Prospect }) {
  const { setEtat, toast } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const set = (etat: EtatProspect) => {
    setOpen(false)
    setEtat(p.id, etat, `État prospect → ${etat}`)
    toast({ title: `${fullName(p)} → ${etat}` })
  }
  return (
    <div ref={ref} className="relative">
      <Button size="sm" variant="ghost" className="w-8 px-0" onClick={() => setOpen((o) => !o)} aria-label="Plus d'actions">
        <MoreHorizontal size={16} />
      </Button>
      {open && (
        <div className="animate-pop-in absolute top-full right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {ETATS_SORTIE.map((e) => (
            <button key={e} onClick={() => set(e)} className="block w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[13px] text-slate-600 hover:bg-slate-50">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
