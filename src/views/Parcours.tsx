import { useMemo, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, isAppareillage } from '../data/constants'
import type { Prospect, StatutSuivi } from '../data/types'
import { formatDate, formatEur, formatTime, fullName } from '../lib/utils'
import { Card, EmptyState, Initials, MontantInput, PageHeader, StatutSelect, Switch, TextTabs, essaiJours } from '../components/ui'

type Tab = 'all' | 'En attente' | 'Pas venu' | 'En essai' | 'Facturé' | 'non-appareilles'
const TABS: { value: Tab; label: string; match: (s: StatutSuivi) => boolean }[] = [
  { value: 'all', label: 'Tous', match: () => true },
  { value: 'En attente', label: 'En attente', match: (s) => s === 'En attente' },
  { value: 'Pas venu', label: 'Pas venu', match: (s) => s === 'Pas venu' },
  { value: 'En essai', label: 'En essai', match: (s) => s === 'En essai' },
  { value: 'Facturé', label: 'Facturé', match: (s) => s === 'Facturé' },
  // Non appareillable + Échec d'appareillage, regroupés pour garder une seule ligne d'onglets.
  { value: 'non-appareilles', label: 'Non appareillés', match: (s) => s === 'Non appareillable' || s === "Échec d'appareillage" },
]
const PAGE = 25
const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)

export function Parcours({ onMenu }: { onMenu: () => void }) {
  const { visible, state } = useStore()
  const [tab, setTab] = useState<Tab>('all')
  const [limit, setLimit] = useState(PAGE)

  const patients = useMemo(() => visible.filter((p) => p.statut !== null), [visible])
  const matchOf = (t: Tab) => TABS.find((x) => x.value === t)!.match
  const count = (t: Tab) => patients.filter((p) => matchOf(t)(p.statut!)).length
  const caFacture = patients.filter((p) => p.statut === 'Facturé').reduce((s, p) => s + (p.montant ?? 0), 0)

  const list = useMemo(() => {
    const l = patients.filter((p) => matchOf(tab)(p.statut!))
    // RDV à venir en premier (le plus proche d'abord), puis le reste du plus récent au plus ancien.
    const upcoming = (p: Prospect) => p.statut === 'En attente' && ts(p.rdvLe) > Date.now()
    return l.sort((a, b) => {
      const ua = upcoming(a) ? 0 : 1
      const ub = upcoming(b) ? 0 : 1
      if (ua !== ub) return ua - ub
      return ua === 0 ? ts(a.rdvLe) - ts(b.rdvLe) : ts(b.rdvLe) - ts(a.rdvLe)
    })
  }, [patients, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Parcours Patient"
        subtitle={`${state.branch === 'all' ? 'Tous les centres' : CENTRES[state.branch].nom} · du rendez-vous à la facturation`}
      />

      <TextTabs
        value={tab}
        onChange={(t) => {
          setTab(t)
          setLimit(PAGE)
        }}
        options={TABS.map((t) => ({ value: t.value, label: t.label, count: count(t.value) }))}
        right={
          <>
            CA facturé : <span className="font-semibold text-[var(--accent-text)] tabular-nums">{formatEur(caFacture)}</span>
          </>
        }
      />

      <Card className="overflow-visible">
        {list.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={22} />} title="Aucun patient à cette étape" />
        ) : (
          <>
            {/* Écran large : une ligne nette par patient, sans défilement horizontal */}
            <table className="hidden w-full table-fixed text-sm md:table">
              <colgroup>
                <col />
                <col className="w-[135px]" />
                <col className="w-[160px]" />
                <col className="w-[200px]" />
                <col className="w-[120px]" />
                <col className="w-[175px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                  <th className="px-5 py-3 font-medium">Nom & Prénom</th>
                  <th className="px-3 py-3 font-medium">Téléphone</th>
                  <th className="px-3 py-3 font-medium">Date RDV</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 text-right font-medium">Montant facturé</th>
                  <th className="px-5 py-3 font-medium">Avis Google</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, limit).map((p) => (
                  <Row key={p.id} p={p} />
                ))}
              </tbody>
            </table>
            {/* Mobile : liste empilée */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {list.slice(0, limit).map((p) => (
                <MobileRow key={p.id} p={p} />
              ))}
            </ul>
          </>
        )}
        {list.length > limit && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="w-full cursor-pointer border-t border-slate-100 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            Afficher plus · {list.length - limit} restants
          </button>
        )}
      </Card>
    </>
  )
}

function useRowActions(p: Prospect) {
  const { setStatut, patch, toast } = useStore()
  return {
    changeStatut: (to: StatutSuivi | null) => {
      setStatut(p.id, to, {}, `Statut suivi → ${to ?? '(Vide)'}`)
      const missing = to === 'Facturé' && p.montant === undefined
      toast({
        title: `${fullName(p)} → ${to ?? '(Vide)'}`,
        description: missing ? 'Pensez à saisir le montant facturé.' : undefined,
        tone: to === 'Facturé' ? 'success' : 'info',
      })
    },
    setMontant: (v: number | undefined) => {
      patch(p.id, { montant: v }, v === undefined ? 'Montant facturé effacé' : `Montant facturé → ${formatEur(v)}`)
      if (v !== undefined) toast({ title: 'Montant enregistré', description: `${fullName(p)} · ${formatEur(v)}`, tone: 'success' })
    },
    setAvis: (v: boolean) => {
      patch(p.id, { avisGoogle: v }, v ? 'Demande d’avis Google envoyée par SMS.' : undefined)
      if (v) toast({ title: 'SMS Avis Google envoyé', description: fullName(p), tone: 'success' })
    },
  }
}

function RdvDate({ p }: { p: Prospect }) {
  if (!p.rdvLe) return <span className="text-slate-300">—</span>
  const upcoming = ts(p.rdvLe) > Date.now()
  return (
    <span className="truncate text-[13px] whitespace-nowrap text-slate-700 tabular-nums">
      {formatDate(p.rdvLe, { day: 'numeric', month: 'short' })}
      {upcoming && <span className="text-slate-400"> · {formatTime(p.rdvLe)}</span>}
      {p.statut === 'En essai' && <span className="text-slate-400"> · J+{essaiJours(p.essaiLe ?? p.rdvLe)}</span>}
    </span>
  )
}

/** Le montant et la demande d'avis n'existent qu'à partir de l'essai. */
const Dash = () => <span className="text-slate-300">—</span>

function Avis({ p, onChange }: { p: Prospect; onChange: (v: boolean) => void }) {
  if (!isAppareillage(p.statut)) return <Dash />
  return (
    <div className="flex items-center gap-2.5">
      <Switch checked={p.avisGoogle} label="Demander Avis Google" onChange={onChange} />
      {p.avisGoogle && <span className="truncate text-xs text-[var(--accent-text)]">✓ SMS Avis envoyé</span>}
    </div>
  )
}

function Row({ p }: { p: Prospect }) {
  const { select } = useStore()
  const a = useRowActions(p)
  return (
    <tr className="border-b border-slate-50 transition-colors last:border-0 hover:bg-emerald-50/40">
      <td className="truncate px-5 py-2.5">
        <button onClick={() => select(p.id)} className="flex max-w-full cursor-pointer items-center gap-2.5 font-medium text-slate-900 hover:text-emerald-700">
          <Initials prenom={p.prenom} nom={p.nom} green={isAppareillage(p.statut)} />
          <span className="truncate">{fullName(p)}</span>
        </button>
      </td>
      <td className="truncate px-3 py-2.5 text-[13px] whitespace-nowrap text-slate-600 tabular-nums">{p.telephone}</td>
      <td className="px-3 py-2.5"><RdvDate p={p} /></td>
      <td className="px-3 py-2.5"><StatutSelect value={p.statut} onChange={a.changeStatut} /></td>
      <td className="px-3 py-2.5 text-right">{isAppareillage(p.statut) ? <MontantInput value={p.montant} onCommit={a.setMontant} /> : <Dash />}</td>
      <td className="px-5 py-2.5"><Avis p={p} onChange={a.setAvis} /></td>
    </tr>
  )
}

function MobileRow({ p }: { p: Prospect }) {
  const { select } = useStore()
  const a = useRowActions(p)
  return (
    <li className="space-y-2.5 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <button onClick={() => select(p.id)} className="cursor-pointer truncate text-left font-medium text-slate-900">{fullName(p)}</button>
        <RdvDate p={p} />
      </div>
      <div className="text-[13px] whitespace-nowrap text-slate-500 tabular-nums">{p.telephone}</div>
      <div className="grid grid-cols-[1fr_110px] gap-2">
        <StatutSelect value={p.statut} onChange={a.changeStatut} />
        {isAppareillage(p.statut) ? <MontantInput value={p.montant} onCommit={a.setMontant} /> : <span />}
      </div>
      <Avis p={p} onChange={a.setAvis} />
    </li>
  )
}
