import { useState } from 'react'
import { AlarmClock, Ban, CalendarCheck, CalendarClock, MapPin, PhoneCall, StickyNote, ThumbsDown } from 'lucide-react'
import { useStore } from '../store'
import type { Prospect } from '../data/types'
import { cn, formatRelativeDay, fullName, rappelBucket } from '../lib/utils'
import { Button, Card, CentreBadge, EmptyState, PageHeader, Segmented } from '../components/ui'
import { MetaTags } from '../components/MetaTags'

type Tab = 'retard' | 'today' | 'week'

export function Relance({ onMenu }: { onMenu: () => void }) {
  const { visible } = useStore()
  const relances = visible.filter((p) => p.statut === null && p.etat === 'Relance phoning')
  const groups: Record<Tab, Prospect[]> = { retard: [], today: [], week: [] }
  for (const p of relances) {
    const b = rappelBucket(p.rappelLe)
    if (b === 'retard' || b === 'today') groups[b].push(p)
    else if (b === 'week' || b === 'later') groups.week.push(p)
  }
  for (const k of Object.keys(groups) as Tab[]) groups[k].sort((a, b) => +new Date(a.rappelLe!) - +new Date(b.rappelLe!))

  const [tab, setTab] = useState<Tab>(groups.retard.length ? 'retard' : 'today')
  const list = groups[tab]

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Relance Phoning"
        subtitle={`${relances.length} prospect${relances.length > 1 ? 's' : ''} à rappeler`}
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'retard', label: 'En retard', count: groups.retard.length, tone: 'rose' },
              { value: 'today', label: "Aujourd'hui", count: groups.today.length, tone: 'amber' },
              { value: 'week', label: 'Cette semaine', count: groups.week.length, tone: 'slate' },
            ]}
          />
        }
      />

      {tab === 'retard' && list.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-800">
          <AlarmClock size={18} className="shrink-0" />
          {list.length} rappel{list.length > 1 ? 's' : ''} n'{list.length > 1 ? 'ont' : 'a'} pas été effectué{list.length > 1 ? 's' : ''} à la date prévue. Traitez-les en priorité.
        </div>
      )}

      <Card className="divide-y divide-slate-100">
        {list.length === 0 && <EmptyState icon={<PhoneCall size={18} />} title="Aucune relance dans cet onglet" text="Les prospects passés en « Relance phoning » apparaîtront ici à leur date de rappel." />}
        {list.map((p) => (
          <Row key={p.id} p={p} tab={tab} />
        ))}
      </Card>
    </>
  )
}

function Row({ p, tab }: { p: Prospect; tab: Tab }) {
  const { select, openRdv, openRelance, setEtat, toast } = useStore()
  const last = p.notes[p.notes.length - 1]
  const out = (etat: 'Pas intéressé' | 'Clôture') => {
    setEtat(p.id, etat, `État prospect → ${etat}`)
    toast({ title: `${fullName(p)} → ${etat}` })
  }
  return (
    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
      <div
        className={cn(
          'flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 lg:w-44 lg:flex-col lg:items-start lg:gap-0.5',
          tab === 'retard' ? 'bg-rose-50 text-rose-700' : tab === 'today' ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700',
        )}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase">
          <CalendarClock size={12} /> Rappel
        </span>
        <span className="text-sm font-semibold">{formatRelativeDay(p.rappelLe!)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => select(p.id)} className="cursor-pointer text-[15px] font-semibold text-slate-900 hover:text-indigo-600">
            {fullName(p)}
          </button>
          <CentreBadge centre={p.centre} />
          <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} /> {p.ville}</span>
        </div>
        <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="mt-1 inline-block text-sm font-medium text-slate-700 tabular-nums hover:text-emerald-600">{p.telephone}</a>
        {last && (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
            <StickyNote size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <span>
              {last.texte} <span className="text-slate-400">— {last.auteur}</span>
            </span>
          </p>
        )}
        <MetaTags p={p} className="mt-2" />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
        <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800">
          <PhoneCall size={15} /> Appeler
        </a>
        <Button variant="emerald" size="sm" className="h-9" onClick={() => openRdv(p.id)}>
          <CalendarCheck size={15} /> Fixer RDV
        </Button>
        <div className="flex gap-2">
          <Button size="sm" className="h-9 flex-1" onClick={() => openRelance(p.id)} title="Reprogrammer">
            <CalendarClock size={15} /> Reporter
          </Button>
          <Button size="sm" variant="ghost" className="h-9 w-9 px-0" title="Clôture" onClick={() => out('Clôture')}>
            <Ban size={15} />
          </Button>
          <Button size="sm" variant="ghost" className="h-9 w-9 px-0" title="Pas intéressé" onClick={() => out('Pas intéressé')}>
            <ThumbsDown size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
