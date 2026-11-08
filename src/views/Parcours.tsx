import { useMemo, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { useStore } from '../store'
import type { Prospect, StatutSuivi } from '../data/types'
import { cn, formatDate, formatEur, formatTime, fullName } from '../lib/utils'
import { Card, EmptyState, PageHeader, PanierInput, StatutSelect, Switch, TextTabs, essaiJours } from '../components/ui'

type Tab = 'all' | StatutSuivi
const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'RDV Pris', label: 'RDV Pris' },
  { value: 'RDV Réalisé', label: 'RDV Réalisé' },
  { value: 'Essai', label: 'Essai' },
  { value: 'Facturé', label: 'Facturé' },
]
const PAGE = 25
const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)

export function Parcours({ onMenu }: { onMenu: () => void }) {
  const { visible } = useStore()
  const [tab, setTab] = useState<Tab>('all')
  const [limit, setLimit] = useState(PAGE)

  // Les dossiers clôturés (patient non appareillé) sortent du parcours actif.
  const patients = useMemo(() => visible.filter((p) => p.statut !== null && p.etat !== 'Clôture'), [visible])
  const count = (t: Tab) => (t === 'all' ? patients.length : patients.filter((p) => p.statut === t).length)
  const caFacture = patients.filter((p) => p.statut === 'Facturé').reduce((s, p) => s + p.panier, 0)

  const list = useMemo(() => {
    const l = tab === 'all' ? [...patients] : patients.filter((p) => p.statut === tab)
    // RDV à venir en premier, puis le reste du plus récent au plus ancien.
    return l.sort((a, b) => {
      const ua = a.statut === 'RDV Pris' ? 0 : 1
      const ub = b.statut === 'RDV Pris' ? 0 : 1
      if (ua !== ub) return ua - ub
      return ua === 0 ? ts(a.rdvLe) - ts(b.rdvLe) : ts(b.rdvLe) - ts(a.rdvLe)
    })
  }, [patients, tab])

  return (
    <>
      <PageHeader onMenu={onMenu} title="Parcours Patient" subtitle="Du rendez-vous à la facturation" />

      <TextTabs
        value={tab}
        onChange={(t) => {
          setTab(t)
          setLimit(PAGE)
        }}
        options={TABS.map((t) => ({ ...t, count: count(t.value) }))}
        right={
          <>
            CA facturé : <span className="font-semibold text-[var(--accent-text)] tabular-nums">{formatEur(caFacture)}</span>
          </>
        }
      />

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={22} />} title="Aucun patient à cette étape" />
        ) : (
          <>
            {/* Écran large : une ligne nette par patient, sans défilement horizontal */}
            <table className="hidden w-full table-fixed text-sm md:table">
              <colgroup>
                <col />
                <col className="w-[130px]" />
                <col className="w-[170px]" />
                <col className="w-[175px]" />
                <col className="w-[110px]" />
                <col className="w-[175px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                  <th className="px-5 py-3 font-medium">Nom & Prénom</th>
                  <th className="px-3 py-3 font-medium">Téléphone</th>
                  <th className="px-3 py-3 font-medium">Date RDV</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 text-right font-medium">Panier (€)</th>
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
  const { setStatut, patch, openRdv, toast } = useStore()
  return {
    changeStatut: (to: StatutSuivi | null) => {
      if (to === 'RDV Pris' && !p.rdvLe) return openRdv(p.id)
      setStatut(p.id, to, {}, `Statut suivi → ${to ?? '(Vide)'}`)
      toast({
        title: to === 'Facturé' ? `${formatEur(p.panier)} facturés` : `${fullName(p)} → ${to ?? '(Vide)'}`,
        description: to === 'Facturé' ? fullName(p) : undefined,
        tone: to === 'Facturé' ? 'success' : 'info',
      })
    },
    setPanier: (v: number) => {
      patch(p.id, { panier: v }, `Panier moyen → ${formatEur(v)}`)
      toast({ title: 'Panier mis à jour', description: `${fullName(p)} · ${formatEur(v)}`, tone: 'success' })
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
    <span className="truncate text-[13px] text-slate-700 tabular-nums">
      {formatDate(p.rdvLe, { day: 'numeric', month: 'short' })}
      {upcoming && <span className="text-slate-400"> · {formatTime(p.rdvLe)}</span>}
      {p.statut === 'Essai' && <span className="text-slate-400"> · J+{essaiJours(p.essaiLe ?? p.rdvLe)}</span>}
    </span>
  )
}

function Avis({ p, onChange }: { p: Prospect; onChange: (v: boolean) => void }) {
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
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
      <td className="truncate px-5 py-2.5">
        <button onClick={() => select(p.id)} className="cursor-pointer truncate font-medium text-slate-900 hover:underline">
          {fullName(p)}
        </button>
      </td>
      <td className="truncate px-3 py-2.5 text-[13px] text-slate-600 tabular-nums">{p.telephone}</td>
      <td className="px-3 py-2.5"><RdvDate p={p} /></td>
      <td className="px-3 py-2.5"><StatutSelect value={p.statut} onChange={a.changeStatut} className="w-full" /></td>
      <td className="px-3 py-2.5"><PanierInput value={p.panier} onCommit={a.setPanier} /></td>
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
      <div className="text-[13px] text-slate-500 tabular-nums">{p.telephone}</div>
      <div className={cn('grid grid-cols-[1fr_110px] gap-2')}>
        <StatutSelect value={p.statut} onChange={a.changeStatut} className="w-full" />
        <PanierInput value={p.panier} onCommit={a.setPanier} />
      </div>
      <Avis p={p} onChange={a.setAvis} />
    </li>
  )
}
