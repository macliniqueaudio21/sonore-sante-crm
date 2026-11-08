import { useMemo, useState } from 'react'
import { CalendarCheck, CheckCircle2, ChevronRight, CircleSlash, Euro, FlaskConical, Stethoscope, Undo2, type LucideIcon } from 'lucide-react'
import { useStore } from '../store'
import { PANIER_MOYEN } from '../data/constants'
import type { Prospect, StatutSuivi } from '../data/types'
import { DAY, cn, formatDate, formatEur, formatRelativeDay, fullName } from '../lib/utils'
import { Button, Card, CentreBadge, EmptyState, PageHeader } from '../components/ui'

const STAGES: { statut: StatutSuivi; label: string; icon: LucideIcon; color: string; ring: string }[] = [
  { statut: 'RDV Pris', label: 'RDV Pris', icon: CalendarCheck, color: 'text-indigo-600 bg-indigo-50', ring: 'ring-indigo-500' },
  { statut: 'RDV Réalisé', label: 'RDV Réalisé', icon: Stethoscope, color: 'text-violet-600 bg-violet-50', ring: 'ring-violet-500' },
  { statut: 'Essai en cours', label: 'Essai en cours', icon: FlaskConical, color: 'text-amber-600 bg-amber-50', ring: 'ring-amber-500' },
  { statut: 'Facturé', label: 'Facturé', icon: Euro, color: 'text-emerald-600 bg-emerald-50', ring: 'ring-emerald-500' },
  { statut: 'Non appareillé', label: 'Non appareillé', icon: CircleSlash, color: 'text-slate-500 bg-slate-100', ring: 'ring-slate-400' },
]
const NEXT: Partial<Record<StatutSuivi, { to: StatutSuivi; label: string }>> = {
  'RDV Pris': { to: 'RDV Réalisé', label: 'Marquer réalisé' },
  'RDV Réalisé': { to: 'Essai en cours', label: "Démarrer l'essai" },
  'Essai en cours': { to: 'Facturé', label: `Facturer ${formatEur(PANIER_MOYEN)}` },
}
const PAGE = 20

export function Parcours({ onMenu }: { onMenu: () => void }) {
  const { visible } = useStore()
  const [stage, setStage] = useState<StatutSuivi>('RDV Pris')
  const [limit, setLimit] = useState(PAGE)

  const patients = visible.filter((p) => p.statut !== null)
  const by = useMemo(() => {
    const m = new Map<StatutSuivi, Prospect[]>()
    for (const s of STAGES) m.set(s.statut, [])
    for (const p of patients) m.get(p.statut!)!.push(p)
    m.get('RDV Pris')!.sort((a, b) => +new Date(a.rdvLe ?? 0) - +new Date(b.rdvLe ?? 0))
    m.get('RDV Réalisé')!.sort((a, b) => +new Date(b.rdvLe ?? 0) - +new Date(a.rdvLe ?? 0))
    m.get('Essai en cours')!.sort((a, b) => +new Date(a.rdvLe ?? 0) - +new Date(b.rdvLe ?? 0))
    m.get('Facturé')!.sort((a, b) => +new Date(b.factureLe ?? 0) - +new Date(a.factureLe ?? 0))
    m.get('Non appareillé')!.sort((a, b) => +new Date(b.rdvLe ?? 0) - +new Date(a.rdvLe ?? 0))
    return m
  }, [patients])

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const caMois = by.get('Facturé')!.filter((p) => +new Date(p.factureLe!) >= monthStart).length * PANIER_MOYEN
  const caPotentiel = (by.get('Essai en cours')!.length + by.get('RDV Réalisé')!.length) * PANIER_MOYEN
  const list = by.get(stage)!

  return (
    <>
      <PageHeader onMenu={onMenu} title="Parcours Patient" subtitle="Du rendez-vous à la facturation · suivi des RDV et du chiffre d'affaires" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Summary label="RDV à venir" value={String(by.get('RDV Pris')!.length)} sub={`${by.get('RDV Pris')!.filter((p) => +new Date(p.rdvLe!) < Date.now() + 2 * DAY).length} dans les 48 h`} />
        <Summary label="CA potentiel (bilans + essais)" value={formatEur(caPotentiel)} sub={`${by.get('Essai en cours')!.length + by.get('RDV Réalisé')!.length} patients × ${formatEur(PANIER_MOYEN)}`} />
        <Summary label="CA facturé ce mois" value={formatEur(caMois)} sub={`${caMois / PANIER_MOYEN} appareillages`} accent />
      </div>

      <Card className="mb-4 p-2">
        <div className="scrollbar-thin flex gap-1 overflow-x-auto">
          {STAGES.map((s, i) => {
            const active = s.statut === stage
            const Icon = s.icon
            return (
              <div key={s.statut} className="flex flex-1 items-center">
                <button
                  onClick={() => {
                    setStage(s.statut)
                    setLimit(PAGE)
                  }}
                  className={cn('flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left whitespace-nowrap transition-colors', active ? 'bg-slate-900 text-white' : 'hover:bg-slate-50')}
                >
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', active ? 'bg-white/10 text-white' : s.color)}>
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className={cn('block text-[11px] font-medium', active ? 'text-slate-400' : 'text-slate-500')}>{s.label}</span>
                    <span className="block text-lg leading-tight font-semibold tabular-nums">{by.get(s.statut)!.length}</span>
                  </span>
                </button>
                {i < 3 && <ChevronRight size={16} className="mx-0.5 hidden shrink-0 text-slate-300 md:block" />}
                {i === 3 && <span className="mx-2 hidden h-8 w-px bg-slate-200 md:block" />}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={18} />} title="Aucun patient à cette étape" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Centre</th>
                  <th className="px-5 py-3">{stage === 'RDV Pris' ? 'Rendez-vous' : stage === 'Facturé' ? 'Facturé le' : 'Bilan le'}</th>
                  <th className="px-5 py-3">{stage === 'Essai en cours' ? 'Avancement essai' : 'Dernière note'}</th>
                  <th className="px-5 py-3 text-right">{stage === 'Facturé' ? 'CA' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, limit).map((p) => (
                  <PatientRow key={p.id} p={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.length > limit && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="w-full cursor-pointer border-t border-slate-100 py-3 text-sm font-medium text-indigo-600 hover:bg-slate-50">
            Afficher plus ({list.length - limit} restants)
          </button>
        )}
      </Card>
    </>
  )
}

function PatientRow({ p }: { p: Prospect }) {
  const { select, setStatut, openRdv, toast } = useStore()
  const st = p.statut!
  const next = NEXT[st]
  const advance = (to: StatutSuivi) => {
    const extra = to === 'Facturé' ? { factureLe: new Date().toISOString() } : {}
    setStatut(p.id, to, extra, `Statut suivi → ${to}`)
    toast({ title: to === 'Facturé' ? `+ ${formatEur(PANIER_MOYEN)} facturés` : `${fullName(p)} → ${to}`, description: to === 'Facturé' ? fullName(p) : undefined, tone: to === 'Facturé' ? 'success' : 'info' })
  }
  const last = p.notes[p.notes.length - 1]
  const essaiJours = p.rdvLe ? Math.max(0, Math.floor((Date.now() - +new Date(p.rdvLe)) / DAY)) : 0
  const upcoming = st === 'RDV Pris' && p.rdvLe && +new Date(p.rdvLe) < Date.now() + DAY * 1.5

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-3.5">
        <button onClick={() => select(p.id)} className="cursor-pointer text-left">
          <div className="font-semibold text-slate-900 hover:text-indigo-600">{fullName(p)}</div>
          <div className="text-xs text-slate-500 tabular-nums">{p.telephone} · {p.age} ans</div>
        </button>
      </td>
      <td className="px-5 py-3.5"><CentreBadge centre={p.centre} /></td>
      <td className="px-5 py-3.5 whitespace-nowrap">
        {st === 'RDV Pris' && p.rdvLe ? (
          <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium', upcoming ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700')}>
            <CalendarCheck size={13} /> {formatRelativeDay(p.rdvLe)}
          </span>
        ) : st === 'Facturé' && p.factureLe ? (
          <span className="text-slate-700">{formatDate(p.factureLe)}</span>
        ) : p.rdvLe ? (
          <span className="text-slate-700">{formatDate(p.rdvLe)}</span>
        ) : (
          '—'
        )}
      </td>
      <td className="max-w-[280px] px-5 py-3.5">
        {st === 'Essai en cours' ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full', essaiJours >= 25 ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${Math.min((essaiJours / 30) * 100, 100)}%` }} />
            </div>
            <span className="text-xs text-slate-600 tabular-nums">J+{essaiJours} / 30</span>
            {essaiJours >= 25 && <span className="text-[11px] font-medium text-emerald-600">Prêt à facturer</span>}
          </div>
        ) : (
          <span className="line-clamp-1 text-[13px] text-slate-500">{last?.texte ?? '—'}</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        {st === 'Facturé' ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 tabular-nums">
            <CheckCircle2 size={14} /> {formatEur(PANIER_MOYEN)}
          </span>
        ) : st === 'Non appareillé' ? (
          <Button size="sm" variant="ghost" onClick={() => advance('Essai en cours')}>
            <Undo2 size={13} /> Relancer un essai
          </Button>
        ) : (
          <div className="flex justify-end gap-1.5">
            {st === 'RDV Pris' && (
              <Button size="sm" variant="ghost" onClick={() => openRdv(p.id)}>Déplacer</Button>
            )}
            {st !== 'RDV Pris' && (
              <Button size="sm" variant="ghost" onClick={() => advance('Non appareillé')} title="Non appareillé">
                <CircleSlash size={13} />
              </Button>
            )}
            {next && (
              <Button size="sm" variant={next.to === 'Facturé' ? 'emerald' : 'primary'} onClick={() => advance(next.to)}>
                {next.label}
              </Button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

function Summary({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Card className={cn('p-5', accent && 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white')}>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={cn('mt-2 text-2xl font-semibold tracking-tight tabular-nums', accent ? 'text-emerald-600' : 'text-slate-900')}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </Card>
  )
}
