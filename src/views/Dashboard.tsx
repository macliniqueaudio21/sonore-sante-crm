import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarCheck, Euro, FlaskConical, Inbox } from 'lucide-react'
import { useStore } from '../store'
import { BRANCHES, CENTRES, PANIER_MOYEN } from '../data/constants'
import type { CentreId, Prospect } from '../data/types'
import { DAY, cn, formatEur, formatEurCompact, formatInt, formatPct, startOfDay } from '../lib/utils'
import { Card, PageHeader, Segmented } from '../components/ui'

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
const reachedEssai = (p: Prospect) =>
  p.statut === 'Essai en cours' || p.statut === 'Facturé' || (p.statut === 'Non appareillé' && p.notes.every((n) => !n.texte.startsWith('Bilan réalisé')))

function computeKpis(list: Prospect[], from: number, to: number) {
  const recus = list.filter((p) => t(p.createdAt) >= from && t(p.createdAt) < to)
  const rdv = recus.filter(reachedRdv)
  const factures = list.filter((p) => p.statut === 'Facturé' && t(p.factureLe) >= from && t(p.factureLe) < to)
  return {
    recus: recus.length,
    rdv: rdv.length,
    conv: recus.length ? (rdv.length / recus.length) * 100 : 0,
    factures: factures.length,
    ca: factures.length * PANIER_MOYEN,
    cohort: recus,
  }
}

function Delta({ cur, prev, suffix = '' }: { cur: number; prev: number; suffix?: string }) {
  if (!prev) return <span className="text-xs text-slate-400">—</span>
  const d = ((cur - prev) / prev) * 100
  const up = d >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(d).toFixed(0)} %{suffix}
    </span>
  )
}

export function Dashboard({ onMenu }: { onMenu: () => void }) {
  const { visible, state, setView } = useStore()
  const [period, setPeriod] = useState<Period>('3m')

  const data = useMemo(() => {
    const from = periodStart(period).getTime()
    const prevFrom = periodStart(period, 1).getTime()
    const now = Date.now()
    const cur = computeKpis(visible, from, now)
    // Période précédente de même durée écoulée, pour une comparaison juste.
    const prev = computeKpis(visible, prevFrom, prevFrom + (now - from))
    const essais = visible.filter((p) => p.statut === 'Essai en cours').length
    const essaisNew = visible.filter((p) => p.statut === 'Essai en cours' && t(p.rdvLe) > now - 14 * DAY).length

    // Séries du graphique : par semaine sur « Ce mois », par mois sinon.
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
      ca: visible.filter((p) => p.statut === 'Facturé' && t(p.factureLe) >= b.from && t(p.factureLe) < b.to).length * PANIER_MOYEN,
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

    const byCentre = (Object.keys(CENTRES) as CentreId[]).map((id) => {
      const k = computeKpis(visible.filter((p) => p.centre === id), from, now)
      return { id, ...k }
    })

    return { cur, prev, essais, essaisNew, series, funnel, byCentre }
  }, [visible, period])

  const { cur, prev } = data
  const branchLabel = BRANCHES.find((b) => b.id === state.branch)!.label
  const maxFunnel = data.funnel[0].value || 1

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Tableau de Bord"
        subtitle={`${branchLabel} · Performance de vos campagnes d'acquisition`}
        actions={<Segmented value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<Inbox size={18} />} iconCls="bg-indigo-50 text-indigo-600" label="Prospects reçus" value={formatInt(cur.recus)} foot={<><Delta cur={cur.recus} prev={prev.recus} /><span>vs période préc.</span></>} />
        <Kpi
          icon={<CalendarCheck size={18} />}
          iconCls="bg-violet-50 text-violet-600"
          label="RDV pris"
          value={formatInt(cur.rdv)}
          extra={<span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{formatPct(cur.conv)} conv.</span>}
          foot={<><Delta cur={cur.rdv} prev={prev.rdv} /><span>vs période préc.</span></>}
        />
        <Kpi
          icon={<FlaskConical size={18} />}
          iconCls="bg-amber-50 text-amber-600"
          label="Essais en cours"
          value={formatInt(data.essais)}
          foot={<span>dont <b className="text-slate-700">{data.essaisNew}</b> démarrés ces 14 derniers jours</span>}
        />
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-14 h-28 w-28 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-50">CA facturé généré</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><Euro size={18} /></span>
            </div>
            <div className="mt-3 text-[28px] font-semibold tracking-tight tabular-nums">{formatEur(cur.ca)}</div>
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-50">
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-semibold">
                {prev.ca ? `${cur.ca >= prev.ca ? '+' : ''}${(((cur.ca - prev.ca) / prev.ca) * 100).toFixed(0)} %` : '—'}
              </span>
              {cur.factures} patients × {formatEur(PANIER_MOYEN)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Évolution du CA et des leads</h2>
              <p className="text-sm text-slate-500">{period === '1m' ? 'Par semaine' : 'Par mois'} · CA calculé sur {formatEur(PANIER_MOYEN)} par patient facturé</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> CA facturé</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Leads</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={8} />
                <YAxis yAxisId="ca" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(v: number) => formatEurCompact(v)} width={64} />
                <YAxis yAxisId="leads" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={32} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-xl">
                        <div className="mb-1.5 font-semibold text-slate-900 capitalize">{label}</div>
                        <div className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> CA : <b className="text-slate-900">{formatEur(Number(payload.find((x) => x.dataKey === 'ca')?.value ?? 0))}</b></div>
                        <div className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Leads : <b className="text-slate-900">{String(payload.find((x) => x.dataKey === 'leads')?.value ?? 0)}</b></div>
                      </div>
                    ) : null
                  }
                />
                <Area yAxisId="ca" type="monotone" dataKey="ca" stroke="#10B981" strokeWidth={2.5} fill="url(#gCa)" />
                <Area yAxisId="leads" type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={2} fill="url(#gLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Entonnoir de conversion</h2>
          <p className="mb-5 text-sm text-slate-500">Cohorte des leads reçus sur la période</p>
          <div className="space-y-4">
            {data.funnel.map((f, i) => {
              const pct = (f.value / maxFunnel) * 100
              const step = i > 0 && data.funnel[i - 1].value ? (f.value / data.funnel[i - 1].value) * 100 : null
              const last = i === data.funnel.length - 1
              return (
                <div key={f.label}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-medium text-slate-700">{f.label}</span>
                    <span className="tabular-nums">
                      <b className="text-slate-900">{formatInt(f.value)}</b>
                      {step !== null && <span className="ml-2 text-xs text-slate-400">{step.toFixed(0)} %</span>}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', last ? 'bg-emerald-500' : 'bg-indigo-500')}
                      style={{ width: `${Math.max(pct, 2)}%`, opacity: last ? 1 : 1 - i * 0.12 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
            Taux de transformation lead → patient facturé :{' '}
            <b>{formatPct(data.funnel[0].value ? (data.funnel[5].value / data.funnel[0].value) * 100 : 0)}</b>
          </div>
        </Card>
      </div>

      {state.branch === 'all' && (
        <Card className="mt-4 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Performance par centre</h2>
              <p className="text-sm text-slate-500">Sur la période sélectionnée</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                  <th className="px-5 py-2.5">Centre</th>
                  <th className="px-5 py-2.5 text-right">Leads</th>
                  <th className="px-5 py-2.5 text-right">RDV pris</th>
                  <th className="px-5 py-2.5 text-right">Conversion</th>
                  <th className="px-5 py-2.5 text-right">Facturés</th>
                  <th className="px-5 py-2.5 text-right">CA</th>
                </tr>
              </thead>
              <tbody>
                {data.byCentre.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{CENTRES[c.id].nom}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.recus}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.rdv}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-2">
                        <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:inline-block">
                          <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(c.conv * 1.6, 100)}%` }} />
                        </span>
                        {formatPct(c.conv)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.factures}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600 tabular-nums">{formatEur(c.ca)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setView('prospects')} className="w-full cursor-pointer border-t border-slate-100 py-3 text-sm font-medium text-indigo-600 hover:bg-slate-50">
            Voir tous les prospects →
          </button>
        </Card>
      )}
    </>
  )
}

function Kpi({ icon, iconCls, label, value, extra, foot }: { icon: React.ReactNode; iconCls: string; label: string; value: string; extra?: React.ReactNode; foot: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl', iconCls)}>{icon}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[28px] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</span>
        {extra}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">{foot}</div>
    </Card>
  )
}
