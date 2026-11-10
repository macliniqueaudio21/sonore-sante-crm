import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarCheck, CalendarRange, Euro, FlaskConical, Inbox } from 'lucide-react'
import { useStore } from '../store'
import { BRANCHES, CENTRES } from '../data/constants'
import type { BranchId, CentreId, Prospect } from '../data/types'
import { DAY, cn, formatDate, formatEur, formatEurCompact, formatInt, formatPct, startOfDay, toDateInput } from '../lib/utils'
import { Button, Card, DotSelect, PageHeader, Segmented } from '../components/ui'

const CHART = { ca: '#10B981', leads: '#CBD5E1', grid: '#F1F5F9', axis: '#94A3B8', cursor: '#D1FAE5', fill: 0.35 }

type Preset = '1m' | '3m' | '6m' | '12m'
const PRESETS: { value: Preset; label: string; months: number }[] = [
  { value: '1m', label: 'Ce mois', months: 1 },
  { value: '3m', label: '3 mois', months: 3 },
  { value: '6m', label: '6 mois', months: 6 },
  { value: '12m', label: '1 an', months: 12 },
]
/** Période analysée : un raccourci, ou une plage « du … au … » (bornes incluses). */
type Period = { kind: 'preset'; preset: Preset } | { kind: 'custom'; from: string; to: string }

function rangeOf(p: Period): { from: number; to: number } {
  const now = new Date()
  if (p.kind === 'custom') {
    const from = startOfDay(new Date(`${p.from}T00:00`)).getTime()
    const to = startOfDay(new Date(`${p.to}T00:00`)).getTime() + DAY
    return { from, to: Math.min(to, now.getTime() + 1) }
  }
  const months = PRESETS.find((x) => x.value === p.preset)!.months
  return { from: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime(), to: now.getTime() + 1 }
}

const t = (iso?: string) => (iso ? new Date(iso).getTime() : NaN)
const reachedRdv = (p: Prospect) => p.statut !== null
const reachedHonore = (p: Prospect) => p.statut !== null && p.statut !== 'Pas venu' && !(p.statut === 'En attente' && t(p.rdvLe) > Date.now())
const reachedEssai = (p: Prospect) => p.statut === 'En essai' || p.statut === 'Facturé' || p.statut === "Échec d'appareillage" || !!p.essaiLe
const sumMontant = (list: Prospect[]) => list.reduce((s, p) => s + (p.montant ?? 0), 0)

function computeKpis(list: Prospect[], from: number, to: number) {
  const recus = list.filter((p) => t(p.createdAt) >= from && t(p.createdAt) < to)
  const rdv = recus.filter(reachedRdv)
  const factures = list.filter((p) => p.statut === 'Facturé' && t(p.factureLe) >= from && t(p.factureLe) < to)
  const essais = list.filter((p) => t(p.essaiLe) >= from && t(p.essaiLe) < to)
  return {
    recus: recus.length,
    rdv: rdv.length,
    conv: recus.length ? (rdv.length / recus.length) * 100 : 0,
    essais: essais.length,
    essaisEnCours: essais.filter((p) => p.statut === 'En essai').length,
    factures: factures.length,
    ca: sumMontant(factures),
    cohort: recus,
  }
}

/** Variation discrète : texte seul, vert ou rouge. */
function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return <span className="text-slate-400">—</span>
  const d = ((cur - prev) / prev) * 100
  return (
    <span className={cn('font-medium tabular-nums', d >= 0 ? 'text-[var(--accent-text)]' : 'text-red-600')}>
      {d >= 0 ? '+' : '−'}
      {Math.abs(d).toFixed(0)} %
    </span>
  )
}

/** Sélecteur « Du [date] au [date] » dans un petit panneau. */
function CustomRange({ period, onApply }: { period: Period; onApply: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = toDateInput(new Date())
  const r = rangeOf(period)
  const [from, setFrom] = useState(toDateInput(new Date(r.from)))
  const [to, setTo] = useState(toDateInput(new Date(r.to - 1)))
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  const active = period.kind === 'custom'
  const valid = from && to && from <= to
  const dateCls = 'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none'
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex h-[34px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors',
          active ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900',
        )}
      >
        <CalendarRange size={15} strokeWidth={1.75} />
        {active && period.kind === 'custom'
          ? `Du ${formatDate(period.from, { day: 'numeric', month: 'short' })} au ${formatDate(period.to, { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Période personnalisée'}
      </button>
      {open && (
        <div className="animate-pop-in absolute top-full right-0 z-30 mt-1 w-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Du</span>
              <input type="date" className={cn(dateCls, 'w-full')} value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Au</span>
              <input type="date" className={cn(dateCls, 'w-full')} value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              size="sm"
              variant="accent"
              disabled={!valid}
              onClick={() => {
                onApply(from, to)
                setOpen(false)
              }}
            >
              Appliquer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Dashboard({ onMenu }: { onMenu: () => void }) {
  const { visible, state, setBranch } = useStore()
  const chart = CHART
  const [period, setPeriod] = useState<Period>({ kind: 'preset', preset: '3m' })

  const data = useMemo(() => {
    const { from, to } = rangeOf(period)
    const len = to - from
    const cur = computeKpis(visible, from, to)
    // Période précédente de même durée, juste avant.
    const prev = computeKpis(visible, from - len, from)

    // Granularité du graphique : semaine jusqu'à ~2 mois, sinon mois.
    const weekly = len <= 62 * DAY
    const buckets: { label: string; from: number; to: number }[] = []
    if (weekly) {
      let s = startOfDay(from)
      while (s.getTime() < to) {
        const e = new Date(s.getTime() + 7 * DAY)
        buckets.push({ label: `${s.getDate()} ${s.toLocaleDateString('fr-FR', { month: 'short' })}`, from: s.getTime(), to: Math.min(e.getTime(), to) })
        s = e
      }
    } else {
      const f = new Date(from)
      let s = new Date(f.getFullYear(), f.getMonth(), 1)
      while (s.getTime() < to) {
        const e = new Date(s.getFullYear(), s.getMonth() + 1, 1)
        const partial = e.getTime() > to
        buckets.push({
          label: s.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') + (partial && to > Date.now() ? ' (en cours)' : ''),
          from: Math.max(s.getTime(), from),
          to: Math.min(e.getTime(), to),
        })
        s = e
      }
    }
    const series = buckets.map((b) => ({
      label: b.label,
      leads: visible.filter((p) => t(p.createdAt) >= b.from && t(p.createdAt) < b.to).length,
      ca: sumMontant(visible.filter((p) => p.statut === 'Facturé' && t(p.factureLe) >= b.from && t(p.factureLe) < b.to)),
    }))

    const c = cur.cohort
    const funnel = [
      { label: 'Leads reçus', value: c.length },
      { label: 'Contactés', value: c.filter((p) => p.etat !== 'Nouveau lead' || p.statut !== null).length },
      { label: 'RDV fixés', value: c.filter(reachedRdv).length },
      { label: 'RDV honorés', value: c.filter(reachedHonore).length },
      { label: 'Mis en essai', value: c.filter(reachedEssai).length },
      { label: 'Facturés', value: c.filter((p) => p.statut === 'Facturé').length },
    ]
    const byCentre = (Object.keys(CENTRES) as CentreId[]).map((id) => ({ id, ...computeKpis(visible.filter((p) => p.centre === id), from, to) }))
    return { cur, prev, series, funnel, byCentre, weekly }
  }, [visible, period])

  const { cur, prev } = data
  const maxFunnel = data.funnel[0].value || 1
  const centreOptions = BRANCHES.map((b) => ({ value: b.id, label: b.id === 'all' ? 'Vue Globale Groupe (Tous les centres)' : b.label }))

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Tableau de Bord"
        subtitle={state.branch === 'all' ? 'Vue Globale Groupe · tous les centres' : CENTRES[state.branch].nom}
        actions={
          <>
            <DotSelect<BranchId> label="Centre affiché" size="sm" className="w-[300px]" value={state.branch} options={centreOptions} onChange={setBranch} />
            <Segmented
              value={period.kind === 'preset' ? period.preset : ('' as Preset)}
              onChange={(v) => setPeriod({ kind: 'preset', preset: v })}
              options={PRESETS.map((p) => ({ value: p.value, label: p.label }))}
            />
            <CustomRange period={period} onApply={(from, to) => setPeriod({ kind: 'custom', from, to })} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi icon={<Inbox size={17} />} label="Prospects reçus" value={formatInt(cur.recus)} foot={<><Delta cur={cur.recus} prev={prev.recus} /> vs période préc.</>} />
        <Kpi icon={<CalendarCheck size={17} />} label="RDV fixés" value={formatInt(cur.rdv)} foot={<><span className="text-slate-700">{formatPct(cur.conv)}</span> de conversion</>} />
        <Kpi icon={<FlaskConical size={17} />} label="Mises en essai" value={formatInt(cur.essais)} foot={<>dont {cur.essaisEnCours} encore en essai</>} />
        <Kpi
          icon={<Euro size={17} />}
          label="CA facturé"
          value={formatEur(cur.ca)}
          valueCls="text-[var(--accent-text)]"
          foot={<><Delta cur={cur.ca} prev={prev.ca} /> · {cur.factures} patients</>}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">CA facturé et leads</h2>
              <p className="mt-0.5 text-xs text-slate-400">{data.weekly ? 'Par semaine' : 'Par mois'}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full" style={{ background: chart.ca }} /> CA facturé</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full" style={{ background: chart.leads }} /> Leads</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.ca} stopOpacity={chart.fill} />
                    <stop offset="100%" stopColor={chart.ca} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chart.axis, fontSize: 12 }} dy={8} />
                <YAxis yAxisId="ca" tickLine={false} axisLine={false} tick={{ fill: chart.axis, fontSize: 12 }} tickFormatter={(v: number) => formatEurCompact(v)} width={64} />
                <YAxis yAxisId="leads" orientation="right" tickLine={false} axisLine={false} tick={{ fill: chart.axis, fontSize: 12 }} width={32} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: chart.cursor }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                        <div className="mb-1 font-medium text-slate-900">{label}</div>
                        <div className="text-slate-500">CA : <span className="font-medium text-slate-900">{formatEur(Number(payload.find((x) => x.dataKey === 'ca')?.value ?? 0))}</span></div>
                        <div className="text-slate-500">Leads : <span className="font-medium text-slate-900">{String(payload.find((x) => x.dataKey === 'leads')?.value ?? 0)}</span></div>
                      </div>
                    ) : null
                  }
                />
                <Area yAxisId="leads" type="monotone" dataKey="leads" stroke={chart.leads} strokeWidth={1.5} fill="transparent" />
                <Area yAxisId="ca" type="monotone" dataKey="ca" stroke={chart.ca} strokeWidth={2.5} fill="url(#gCa)" activeDot={{ r: 4, fill: chart.ca, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Entonnoir de conversion</h2>
          <p className="mt-0.5 mb-6 text-xs text-slate-400">Leads reçus sur la période</p>
          <div className="space-y-4">
            {data.funnel.map((f, i) => {
              const last = i === data.funnel.length - 1
              const step = i > 0 && data.funnel[i - 1].value ? (f.value / data.funnel[i - 1].value) * 100 : null
              return (
                <div key={f.label}>
                  <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                    <span className="text-slate-600">{f.label}</span>
                    <span className="tabular-nums">
                      {step !== null && <span className="mr-2 text-xs text-slate-400">{step.toFixed(0)} %</span>}
                      <span className="font-medium text-slate-900">{formatInt(f.value)}</span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', last ? 'bg-emerald-500' : 'bg-emerald-200')} style={{ width: `${Math.max((f.value / maxFunnel) * 100, 1.5)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
            Lead → patient facturé :{' '}
            <span className="font-semibold text-slate-900">{formatPct(data.funnel[0].value ? (data.funnel[5].value / data.funnel[0].value) * 100 : 0)}</span>
          </p>
        </Card>
      </div>

      {state.branch === 'all' && (
        <Card className="mt-4 overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Par centre</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-left text-xs text-slate-400">
                <th className="px-6 py-2.5 font-medium">Centre</th>
                <th className="px-3 py-2.5 text-right font-medium">Leads</th>
                <th className="px-3 py-2.5 text-right font-medium">RDV</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Conversion</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Facturés</th>
                <th className="px-6 py-2.5 text-right font-medium">CA</th>
              </tr>
            </thead>
            <tbody>
              {data.byCentre.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 text-slate-800">{CENTRES[c.id].court}</td>
                  <td className="px-3 py-3 text-right text-slate-600 tabular-nums">{c.recus}</td>
                  <td className="px-3 py-3 text-right text-slate-600 tabular-nums">{c.rdv}</td>
                  <td className="hidden px-3 py-3 text-right text-slate-600 tabular-nums sm:table-cell">{formatPct(c.conv)}</td>
                  <td className="hidden px-3 py-3 text-right text-slate-600 tabular-nums sm:table-cell">{c.factures}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900 tabular-nums">{formatEur(c.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

function Kpi({ label, value, foot, valueCls, icon }: { label: string; value: string; foot: React.ReactNode; valueCls?: string; icon: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] text-slate-500">{label}</div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">{icon}</span>
      </div>
      <div className={cn('-mt-1 text-[26px] font-semibold tracking-tight tabular-nums', valueCls ?? 'text-slate-900')}>{value}</div>
      <div className="mt-2 text-xs text-slate-400">{foot}</div>
    </Card>
  )
}
