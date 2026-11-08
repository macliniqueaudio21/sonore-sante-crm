import { useMemo, useState } from 'react'
import { ArrowDownUp, Download, Search, Users } from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, ETATS, STATUTS } from '../data/constants'
import type { EtatProspect, StatutSuivi } from '../data/types'
import { formatAge, formatDate, fullName } from '../lib/utils'
import { Button, Card, EmptyState, EtatBadge, Initials, PageHeader, StatutBadge, inputCls } from '../components/ui'

const PAGE = 25

export function AllProspects({ onMenu }: { onMenu: () => void }) {
  const { visible, select, toast } = useStore()
  const [q, setQ] = useState('')
  const [etat, setEtat] = useState<EtatProspect | ''>('')
  const [statut, setStatut] = useState<StatutSuivi | '' | 'none'>('')
  const [asc, setAsc] = useState(false)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return visible
      .filter((p) => {
        if (etat && p.etat !== etat) return false
        if (statut === 'none' && p.statut !== null) return false
        if (statut && statut !== 'none' && p.statut !== statut) return false
        if (!needle) return true
        const hay = `${p.prenom} ${p.nom} ${p.ville} ${p.telephone.replace(/\s/g, '')} ${p.email}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        return hay.includes(needle.replace(/\s/g, '')) || hay.includes(needle)
      })
      .sort((a, b) => (asc ? 1 : -1) * (+new Date(a.createdAt) - +new Date(b.createdAt)))
  }, [visible, q, etat, statut, asc])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const rows = filtered.slice(cur * PAGE, cur * PAGE + PAGE)
  const reset = () => setPage(0)

  return (
    <>
      <PageHeader
        onMenu={onMenu}
        title="Tous les Prospects"
        subtitle={`${filtered.length.toLocaleString('fr-FR')} prospect${filtered.length > 1 ? 's' : ''} · base complète des leads Meta`}
        actions={
          <Button onClick={() => toast({ title: 'Export CSV', description: 'Disponible dans la version connectée.', tone: 'info' })}>
            <Download size={16} /> Exporter
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Rechercher un nom, une ville, un téléphone…" value={q} onChange={(e) => { setQ(e.target.value); reset() }} />
          </div>
          <select className={`${inputCls} md:w-48`} value={etat} onChange={(e) => { setEtat(e.target.value as EtatProspect | ''); reset() }}>
            <option value="">Tous les états</option>
            {ETATS.map((e) => <option key={e}>{e}</option>)}
          </select>
          <select className={`${inputCls} md:w-52`} value={statut} onChange={(e) => { setStatut(e.target.value as StatutSuivi | '' | 'none'); reset() }}>
            <option value="">Tous les statuts patient</option>
            <option value="none">(Vide)</option>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Users size={18} />} title="Aucun prospect ne correspond" text="Essayez d'élargir vos filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                  <th className="px-5 py-3">Prospect</th>
                  <th className="hidden px-5 py-3 md:table-cell">Téléphone</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Ville</th>
                  <th className="hidden px-5 py-3 xl:table-cell">Centre</th>
                  <th className="px-5 py-3">État</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Statut</th>
                  <th className="px-5 py-3">
                    <button onClick={() => setAsc((a) => !a)} className="inline-flex cursor-pointer items-center gap-1 hover:text-slate-800">
                      Reçu le <ArrowDownUp size={12} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} onClick={() => select(p.id)} className="cursor-pointer border-b border-slate-50 last:border-0 transition-colors hover:bg-emerald-50/40">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5"><Initials prenom={p.prenom} nom={p.nom} green={p.statut !== null} /><span className="font-medium text-slate-900">{fullName(p)}</span></span>
                    </td>
                    <td className="hidden px-5 py-3 whitespace-nowrap text-slate-600 tabular-nums md:table-cell">{p.telephone}</td>
                    <td className="hidden px-5 py-3 text-slate-500 lg:table-cell">{p.ville}</td>
                    <td className="hidden px-5 py-3 text-slate-500 xl:table-cell">{CENTRES[p.centre].court}</td>
                    <td className="px-5 py-3"><EtatBadge etat={p.etat} /></td>
                    <td className="hidden px-5 py-3 sm:table-cell">{p.statut ? <StatutBadge statut={p.statut} /> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(p.createdAt, { day: 'numeric', month: 'short', year: '2-digit' })}
                      <span className="ml-1.5 text-xs text-slate-400">({formatAge(p.createdAt)})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          <span>
            {filtered.length ? cur * PAGE + 1 : 0}–{Math.min((cur + 1) * PAGE, filtered.length)} sur {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Précédent</Button>
            <Button size="sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Suivant</Button>
          </div>
        </div>
      </Card>
    </>
  )
}
