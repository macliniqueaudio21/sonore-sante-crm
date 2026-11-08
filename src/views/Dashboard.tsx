import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarCheck, Euro, FlaskConical, Inbox } from 'lucide-react'
import { useStore } from '../store'
import { BRANCHES, CENTRES } from '../data/constants'
import type { CentreId, Prospect } from '../data/types'
import { DAY, cn, formatEur, formatEurCompact, formatInt, formatPct, startOfDay } from '../lib/utils'
import { Card, PageHeader, Segmented } from '../components/ui'
import { useDesign } from '../design'

type Period = '1m' | '3m' | '6m' | '12m'
const PERIODS: { value: Period; label: string; months: number }[] = [
  { value: '1m', label: 'Ce mois', months: 1 },
  { value: '3m', label: '3 mois', months: 3 },
  { value: '6m', label: '6 mois', months: 6 },
  { value: '12m', label: '1 an', months: 12 },
]

function periodStart(p: Period, offset = 0) {
  const now = new Date()
  const months = PERIODS.find((x) => x.value === p)!.months
  if (p === '1m') return new Date(now.getFullYear(), now.getMonth() - offset, 1)
  return new Date(now.getFullYear(), now.getMonth() - (months - 1) - offset * months, 1)
}

const t = (iso?: string) => (iso ? new Date(iso).getTime() : NaN)
const reachedRdv = (p: Prospect) => p.statut !== null
const reachedRealise = (p: Prospect) => p.statut !== null && p.statut !== 'RDV Pris'
const reachedEssai = (p: Prospect) => p.statut === 'Essai' || p.statut === 'Facturé' || !!p.essaiLe
const sumPanier = (list: Prospect[]) => list.reduce((s, p) => s + p.panier, 0)

function computeKpis(list: Prospect[], from: number, to: number) {
  const recus = list.filter((p) => t(p.createdAt) >= from && t(p.createdAt) < to)
  const rdv = recus.filter(reachedRdv)
  const factures = list.filter((p) => p.statut === 'Facturé' && t(p.factureLe) >= from && t(p.factureLe) < to)
  return {
    recus: recus.length,
    rdv: rdv.length,
    conv: recus.length ? (rdv.length / recus.length) * 100 : 0,
    factures: factures.length,
    ca: sumPanier(factures),
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

export function Dashboard({ onMenu }: { onMenu: () => void }) {
  const { visible, state } = useStore()
  const { chart } = useDesign().design
  const [period, setPeriod] = useState<Period>('3m')

  const data = useMemo(() => {
    const from = periodStart(period).getTime()
    const prevFrom = periodStart(period, 1).getTime()
    const now = Date.now()
    const cur = computeKpis(visible, from, now)
    const prev = computeKpis(visible, prevFrom, prevFrom + (now - from))
    const enEssai = visible.filter((p) => p.statut === 'Essai' && p.etat !== 'Clôture')

    const buckets: { label: string; from: number; to: number }[] = []
    if (period === '1m') {
      let s = startOfDay(from)
      while (s.getTime() < now) {
        const e = new Date(s.getTime() + 7 * DAY)
        buckets.push({ label: `${s.getDate()} ${s.toLocaleDateString('fr-FR', { month: 'short' })}`, from: s.getTime(), to: Math.min(e.getTime(), now + 1) })
        s = e
      }
    } else {
      const months = PERIODS.find((x) => x.value === period)!.months
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date()
        const s = new Date(d.getFullYear(), d.getMonth() - i, 1)
        const e = new Date(d.getFullYear(), d.getMonth() - i + 1, 1)
        buckets.push({ label: s.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') + (i === 0 ? ' (en cours)' : ''), from: s.getTime(), to: e.getTime() })
      }
    }
    const series = buckets.map((b) => ({
      label: b.label,
      leads: visible.filter((p) => t(p.createdAt) >= b.from && t(p.createdAt) < b.to).length,
      ca: sumPanier(visible.filter((p) => p.statut === 'Facturé' && t(p.factureLe) >= b.from && t(p.factureLe) < b.to)),
    }))

    const c = cur.cohort
    const funnel = [
      { label: 'Leads reçus', value: c.length },
      { label: 'Contactés', value: c.filter((p) => p.etat !== 'Nouveau lead' || p.statut !== null).length },
      { label: 'RDV pris', value: c.filter(reachedRdv).length },
      { label: 'RDV réalisés', value: c.filter(reachedRealise).length },
      { label: 'Mis en essai', value: c.filter(reachedEssai).length },
      { label: 'Facturés', value: c.filter((p) => p.statut === 'Facturé').length },
    ]
    const byCentre = (Object.keys(CENTRES) as CentreId[]).map((id) => ({ id, ...computeKpis(visible.filter((p) => p.centre === id), from, now) }))
    return { cur, prev, essais: enEssai.length, essaisNew: enEssai.filter((p) => t(p.essaiLe) > now - 14 * DAY).length, series, funnel, byCentre }
  }, [visible, period])

  const { cur, prev } = data
  const branchLabel = BRANCHES.find((b) => b.id === state.branch)!.label
  const maxFunnel = data.funnel[0].value || 1

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Tableau de Bord"
        subtitle={branchLabel}
        actions={<Segmented value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi tint={1} icon={<Inbox size={17} />} label="Prospects reçus" value={formatInt(cur.recus)} foot={<><Delta cur={cur.recus} prev={prev.recus} /> vs période préc.</>} />
        <Kpi tint={2} icon={<CalendarCheck size={17} />} label="RDV pris" value={formatInt(cur.rdv)} foot={<><span className="text-slate-700">{formatPct(cur.conv)}</span> de conversion</>} />
        <Kpi tint={3} icon={<FlaskConical size={17} />} label="Essais en cours" value={formatInt(data.essais)} foot={<>{data.essaisNew} démarrés sur 14 jours</>} />
        <Kpi
          tint={4}
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
              <p className="mt-0.5 text-xs text-slate-400">{period === '1m' ? 'Par semaine' : 'Par mois'}</p>
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

function Kpi({ label, value, foot, valueCls, icon, tint }: { label: string; value: string; foot: React.ReactNode; valueCls?: string; icon: React.ReactNode; tint: number }) {
  return (
    <Card className={cn('p-5', `kpi-tint-${tint}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] text-slate-500">{label}</div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">{icon}</span>
      </div>
      <div className={cn('-mt-1 text-[26px] font-semibold tracking-tight tabular-nums', valueCls ?? 'text-slate-900')}>{value}</div>
      <div className="mt-2 text-xs text-slate-400">{foot}</div>
    </Card>
  )
}
