import { useMemo, useState } from 'react'
import { CalendarCheck, Euro, FlaskConical, Layers, Stethoscope, type LucideIcon } from 'lucide-react'
import { useStore } from '../store'
import { PANIER_MOYEN } from '../data/constants'
import type { Prospect, StatutSuivi } from '../data/types'
import { DAY, cn, formatDate, formatEur, formatRelativeDay, fullName } from '../lib/utils'
import { Badge, Card, CentreBadge, EmptyState, EssaiGauge, PageHeader, PanierInput, StatutSelect, Switch } from '../components/ui'

type Stage = 'all' | StatutSuivi
const STAGES: { id: Stage; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'all', label: 'Tous', icon: Layers, color: 'text-slate-600 bg-slate-100' },
  { id: 'RDV Pris', label: 'RDV Pris', icon: CalendarCheck, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'RDV Réalisé', label: 'RDV Réalisé', icon: Stethoscope, color: 'text-violet-600 bg-violet-50' },
  { id: 'Essai', label: 'Essai', icon: FlaskConical, color: 'text-amber-600 bg-amber-50' },
  { id: 'Facturé', label: 'Facturé', icon: Euro, color: 'text-emerald-600 bg-emerald-50' },
]
const PAGE = 20
const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
const lastActivity = (p: Prospect) => Math.max(ts(p.rdvLe), ts(p.essaiLe), ts(p.factureLe))

export function Parcours({ onMenu }: { onMenu: () => void }) {
  const { visible } = useStore()
  const [stage, setStage] = useState<Stage>('RDV Pris')
  const [hideClosed, setHideClosed] = useState(true)
  const [limit, setLimit] = useState(PAGE)

  const patients = useMemo(
    () => visible.filter((p) => p.statut !== null && (!hideClosed || p.etat !== 'Clôture')),
    [visible, hideClosed],
  )
  const count = (s: Stage) => (s === 'all' ? patients.length : patients.filter((p) => p.statut === s).length)

  const list = useMemo(() => {
    const l = stage === 'all' ? [...patients] : patients.filter((p) => p.statut === stage)
    if (stage === 'RDV Pris') return l.sort((a, b) => ts(a.rdvLe) - ts(b.rdvLe))
    if (stage === 'Essai') return l.sort((a, b) => ts(a.essaiLe) - ts(b.essaiLe))
    if (stage === 'Facturé') return l.sort((a, b) => ts(b.factureLe) - ts(a.factureLe))
    return l.sort((a, b) => lastActivity(b) - lastActivity(a))
  }, [patients, stage])

  const open = visible.filter((p) => p.etat !== 'Clôture')
  const rdvAVenir = open.filter((p) => p.statut === 'RDV Pris')
  const pipeline = open.filter((p) => p.statut === 'RDV Réalisé' || p.statut === 'Essai')
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const facturesMois = visible.filter((p) => p.statut === 'Facturé' && ts(p.factureLe) >= monthStart)
  const sum = (l: Prospect[]) => l.reduce((s, p) => s + p.panier, 0)

  return (
    <>
      <PageHeader onMenu={onMenu} title="Parcours Patient" subtitle="Du rendez-vous à la facturation · statut, panier et avis modifiables directement dans le tableau" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Summary label="RDV à venir" value={String(rdvAVenir.length)} sub={`${rdvAVenir.filter((p) => ts(p.rdvLe) < Date.now() + 2 * DAY).length} dans les 48 h`} />
        <Summary label="CA potentiel (bilans + essais)" value={formatEur(sum(pipeline))} sub={`${pipeline.length} patients en cours`} />
        <Summary label="CA facturé ce mois" value={formatEur(sum(facturesMois))} sub={`${facturesMois.length} appareillage${facturesMois.length > 1 ? 's' : ''}`} accent />
      </div>

      <Card className="mb-4 p-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="scrollbar-thin flex flex-1 gap-1 overflow-x-auto">
            {STAGES.map((s) => {
              const active = s.id === stage
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setStage(s.id)
                    setLimit(PAGE)
                  }}
                  className={cn('flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left whitespace-nowrap transition-colors', active ? 'bg-slate-900 text-white' : 'hover:bg-slate-50')}
                >
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', active ? 'bg-white/10 text-white' : s.color)}>
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className={cn('block text-[11px] font-medium', active ? 'text-slate-400' : 'text-slate-500')}>{s.label}</span>
                    <span className="block text-lg leading-tight font-semibold tabular-nums">{count(s.id)}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600">
            <Switch checked={hideClosed} onChange={setHideClosed} label="Masquer les dossiers clôturés" />
            Masquer les dossiers clôturés
          </label>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={18} />} title="Aucun patient à cette étape" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Centre</th>
                  <th className="px-5 py-3">Statut Suivi Patient</th>
                  <th className="px-5 py-3">Étape</th>
                  <th className="w-36 px-5 py-3 text-right">Panier Moyen (€)</th>
                  <th className="w-56 px-5 py-3">Demander Avis Google</th>
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
      <p className="mt-3 text-xs text-slate-400">Panier pré-rempli à {formatEur(PANIER_MOYEN)} par défaut. Le CA facturé additionne les paniers des patients au statut « Facturé ».</p>
    </>
  )
}

function PatientRow({ p }: { p: Prospect }) {
  const { select, setStatut, patch, openRdv, toast } = useStore()

  const changeStatut = (to: StatutSuivi | null) => {
    if (to === null) {
      setStatut(p.id, null, {}, 'Statut suivi → (Vide)')
      toast({ title: `${fullName(p)} a quitté le parcours patient`, description: 'Statut Suivi Patient : (Vide)' })
      return
    }
    if (to === 'RDV Pris' && !p.rdvLe) {
      openRdv(p.id)
      return
    }
    setStatut(p.id, to, {}, `Statut suivi → ${to}`)
    toast({
      title: to === 'Facturé' ? `+ ${formatEur(p.panier)} facturés` : `${fullName(p)} → ${to}`,
      description: to === 'Facturé' ? fullName(p) : to === 'RDV Pris' ? 'SMS Confirmation RDV envoyé via Onoff' : undefined,
      tone: to === 'Facturé' ? 'success' : 'info',
    })
  }

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-3">
        <button onClick={() => select(p.id)} className="cursor-pointer text-left">
          <div className="flex items-center gap-2 font-semibold text-slate-900 hover:text-indigo-600">
            {fullName(p)}
            {p.etat === 'Clôture' && <Badge className="bg-slate-800 text-white ring-slate-800">Clôturé</Badge>}
          </div>
          <div className="text-xs text-slate-500 tabular-nums">{p.telephone} · {p.age} ans</div>
        </button>
      </td>
      <td className="px-5 py-3"><CentreBadge centre={p.centre} /></td>
      <td className="px-5 py-3">
        <StatutSelect value={p.statut} onChange={changeStatut} />
      </td>
      <td className="px-5 py-3 whitespace-nowrap">
        {p.statut === 'RDV Pris' && p.rdvLe ? (
          <button onClick={() => openRdv(p.id)} className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium hover:bg-indigo-100', ts(p.rdvLe) < Date.now() + 1.5 * DAY ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700')} title="Déplacer le RDV">
            <CalendarCheck size={13} /> {formatRelativeDay(p.rdvLe)}
          </button>
        ) : p.statut === 'Essai' ? (
          <EssaiGauge since={p.essaiLe ?? p.rdvLe} />
        ) : p.statut === 'Facturé' && p.factureLe ? (
          <span className="text-[13px] text-slate-600">Facturé le {formatDate(p.factureLe)}</span>
        ) : p.rdvLe ? (
          <span className="text-[13px] text-slate-600">Bilan le {formatDate(p.rdvLe)}</span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-5 py-3">
        <PanierInput
          value={p.panier}
          onCommit={(v) => {
            patch(p.id, { panier: v }, `Panier moyen → ${formatEur(v)}`)
            toast({ title: 'Panier mis à jour', description: `${fullName(p)} · ${formatEur(v)}`, tone: 'success' })
          }}
        />
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={p.avisGoogle}
            label="Demander Avis Google"
            onChange={(v) => {
              patch(p.id, { avisGoogle: v }, v ? 'Demande d’avis Google envoyée par SMS.' : undefined)
              if (v) toast({ title: 'SMS Avis Google envoyé', description: `${fullName(p)} · via Onoff`, tone: 'success' })
            }}
          />
          {p.avisGoogle && <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">✓ SMS Avis envoyé</Badge>}
        </div>
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
