import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Send,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, ETATS, STATUTS } from '../data/constants'
import type { EtatProspect, StatutSuivi } from '../data/types'
import { DAY, cn, formatAge, formatDate, formatRelativeDay, fullName, initials, startOfDay, toLocalInput } from '../lib/utils'
import { Button, EtatBadge, Field, Modal, StatutBadge, inputCls } from './ui'
import { MetaTags, SourceDot } from './MetaTags'

/* -------------------------------- RDV -------------------------------- */
const SLOTS = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00']

export function RdvModal() {
  const { state, byId, openRdv, setStatut, toast } = useStore()
  const p = byId(state.rdvForId)
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = startOfDay(Date.now() + (i + 1) * DAY)
    return d
  }).filter((d) => d.getDay() !== 0)
  const [day, setDay] = useState(0)
  const [slot, setSlot] = useState('10:30')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (p) {
      setDay(0)
      setSlot('10:30')
      setNote('')
    }
  }, [p?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null
  const close = () => openRdv(null)
  const confirm = () => {
    const d = new Date(days[day])
    const [h, m] = slot.split(':').map(Number)
    d.setHours(h, m)
    setStatut(p.id, 'RDV Pris', { rdvLe: d.toISOString() }, `RDV fixé le ${formatRelativeDay(d.toISOString())} au ${CENTRES[p.centre].nom}.${note ? ' ' + note : ''}`)
    toast({ title: 'RDV confirmé', description: `${fullName(p)} · ${formatRelativeDay(d.toISOString())}`, tone: 'success' })
    close()
  }

  return (
    <Modal
      open
      onClose={close}
      title="Fixer un rendez-vous"
      subtitle={`${fullName(p)} · ${CENTRES[p.centre].nom}`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button variant="emerald" onClick={confirm}>
            <CalendarCheck size={16} /> Confirmer le RDV
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Jour">
          <div className="grid grid-cols-5 gap-1.5">
            {days.slice(0, 5).map((d, i) => (
              <button
                key={i}
                onClick={() => setDay(i)}
                className={cn(
                  'cursor-pointer rounded-xl border px-1 py-2 text-center transition-colors',
                  day === i ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300',
                )}
              >
                <div className="text-[10px] font-medium uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                <div className="text-base font-semibold">{d.getDate()}</div>
                <div className="text-[10px]">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Créneau (bilan auditif · 45 min)">
          <div className="grid grid-cols-3 gap-1.5">
            {SLOTS.map((s, i) => {
              const busy = (i + day) % 4 === 1
              return (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => setSlot(s)}
                  className={cn(
                    'cursor-pointer rounded-lg border py-1.5 text-sm font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:border-dashed disabled:text-slate-300 disabled:line-through',
                    slot === s && !busy ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-700 hover:border-slate-300',
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Note (optionnel)">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : venir avec l'ordonnance ORL" />
        </Field>
        <p className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <Send size={14} className="shrink-0 text-indigo-500" />
          Un SMS de confirmation et un rappel J-1 seront envoyés au {p.telephone}.
        </p>
      </div>
    </Modal>
  )
}

/* ------------------------------ Relance ------------------------------ */
export function RelanceModal() {
  const { state, byId, openRelance, patch, toast } = useStore()
  const p = byId(state.relanceForId)
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (p) {
      const d = p.rappelLe && new Date(p.rappelLe) > new Date() ? new Date(p.rappelLe) : new Date(startOfDay(Date.now() + DAY).getTime() + 10 * 3_600_000)
      setWhen(toLocalInput(d))
      setNote('')
    }
  }, [p?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null
  const close = () => openRelance(null)
  const quick = [
    { label: 'Dans 2 h', d: () => new Date(Date.now() + 2 * 3_600_000) },
    { label: 'Demain 10h', d: () => new Date(startOfDay(Date.now() + DAY).getTime() + 10 * 3_600_000) },
    { label: 'Dans 3 jours', d: () => new Date(startOfDay(Date.now() + 3 * DAY).getTime() + 10 * 3_600_000) },
    { label: 'Dans 1 semaine', d: () => new Date(startOfDay(Date.now() + 7 * DAY).getTime() + 10 * 3_600_000) },
  ]
  const confirm = () => {
    const d = new Date(when)
    patch(p.id, { etat: 'Relance phoning', rappelLe: d.toISOString() }, note ? note : `Relance planifiée : ${formatRelativeDay(d.toISOString())}.`)
    toast({ title: 'Relance planifiée', description: `${fullName(p)} · ${formatRelativeDay(d.toISOString())}`, tone: 'info' })
    close()
  }
  return (
    <Modal
      open
      onClose={close}
      title={p.etat === 'Relance phoning' ? 'Reprogrammer la relance' : 'Planifier une relance phoning'}
      subtitle={`${fullName(p)} · ${p.telephone}`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button variant="primary" onClick={confirm} disabled={!when}>
            <CalendarClock size={16} /> Planifier
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button key={q.label} onClick={() => setWhen(toLocalInput(q.d()))} className="cursor-pointer rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
              {q.label}
            </button>
          ))}
        </div>
        <Field label="Date et heure du rappel">
          <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label="Note pour l'équipe">
          <textarea rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : rappeler après 16h, demande pour son mari" />
        </Field>
      </div>
    </Modal>
  )
}

/* ------------------------------ Drawer ------------------------------- */
export function ProspectDrawer() {
  const { state, byId, select, setEtat, setStatut, addNote, openRdv, openRelance, toast } = useStore()
  const p = byId(state.selectedId)
  const [draft, setDraft] = useState('')
  useEffect(() => setDraft(''), [p?.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && select(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select])

  if (!p) return null
  const changeEtat = (etat: EtatProspect) => {
    setEtat(p.id, etat, `État prospect → ${etat}`)
    toast({ title: 'État mis à jour', description: `${fullName(p)} · ${etat}` })
  }
  const changeStatut = (v: string) => {
    const statut = (v || null) as StatutSuivi | null
    const extra = statut === 'Facturé' ? { factureLe: new Date().toISOString() } : {}
    setStatut(p.id, statut, extra, `Statut suivi → ${statut ?? 'aucun'}`)
    toast({ title: 'Statut patient mis à jour', description: `${fullName(p)} · ${statut ?? 'Aucun'}`, tone: statut === 'Facturé' ? 'success' : 'info' })
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-slate-900/30" onClick={() => select(null)} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-white shadow-2xl">
        <div className="flex items-start gap-4 border-b border-slate-100 p-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-sm font-semibold text-indigo-700">
            {initials(p)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-900">{fullName(p)}</h2>
              <SourceDot source={p.source} />
            </div>
            <p className="text-sm text-slate-500">
              {p.age} ans · {p.ville} · <span className="text-slate-400">{p.id}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <EtatBadge etat={p.etat} />
              {p.statut && <StatutBadge statut={p.statut} />}
            </div>
          </div>
          <button onClick={() => select(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-2">
            <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50">
              <Phone size={16} className="text-emerald-600" /> {p.telephone}
            </a>
            <a href={`mailto:${p.email}`} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50">
              <Mail size={16} className="shrink-0 text-indigo-500" /> <span className="truncate">{p.email}</span>
            </a>
          </div>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Réponses formulaire Meta</h3>
            <MetaTags p={p} />
          </section>

          <section className="grid grid-cols-2 gap-3 text-sm">
            <Info2 icon={<MapPin size={14} />} label="Centre" value={CENTRES[p.centre].court} />
            <Info2 icon={<Clock size={14} />} label="Reçu" value={`${formatDate(p.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · il y a ${formatAge(p.createdAt)}`} />
            {p.rdvLe && <Info2 icon={<CalendarCheck size={14} />} label="RDV" value={formatRelativeDay(p.rdvLe)} />}
            {p.rappelLe && p.etat === 'Relance phoning' && <Info2 icon={<CalendarClock size={14} />} label="Rappel" value={formatRelativeDay(p.rappelLe)} />}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Field label="État prospect">
              <select className={inputCls} value={p.etat} onChange={(e) => changeEtat(e.target.value as EtatProspect)}>
                {ETATS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Statut suivi patient">
              <select className={inputCls} value={p.statut ?? ''} onChange={(e) => changeStatut(e.target.value)}>
                <option value="">— Aucun —</option>
                {STATUTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </section>

          <div className="flex gap-2">
            <Button variant="emerald" className="flex-1" onClick={() => openRdv(p.id)}>
              <CalendarCheck size={16} /> {p.rdvLe ? 'Déplacer le RDV' : 'Fixer un RDV'}
            </Button>
            <Button className="flex-1" onClick={() => openRelance(p.id)}>
              <CalendarClock size={16} /> Relance
            </Button>
          </div>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Historique & notes</h3>
            <div className="mb-4 flex gap-2">
              <input
                className={inputCls}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) {
                    addNote(p.id, draft.trim())
                    setDraft('')
                  }
                }}
                placeholder="Ajouter une note…"
              />
              <Button
                variant="primary"
                disabled={!draft.trim()}
                onClick={() => {
                  addNote(p.id, draft.trim())
                  setDraft('')
                }}
                aria-label="Ajouter la note"
              >
                <MessageSquarePlus size={16} />
              </Button>
            </div>
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {[...p.notes].reverse().map((n) => (
                <li key={n.id} className="relative">
                  <span className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300" />
                  <p className="text-sm text-slate-700">{n.texte}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {n.auteur} · {formatDate(n.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
              <li className="relative">
                <span className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-400" />
                <p className="text-sm text-slate-700">Lead reçu via formulaire {p.source}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Automatique · {formatDate(p.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </li>
            </ol>
          </section>
        </div>
      </aside>
    </div>
  )
}

function Info2({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        {icon} {label}
      </div>
      <div className="text-[13px] font-medium text-slate-800">{value}</div>
    </div>
  )
}

/* ------------------------------ Toasts ------------------------------- */
export function Toasts() {
  const { state } = useStore()
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {state.toasts.map((t) => (
        <div key={t.id} className="animate-pop-in pointer-events-auto flex items-start gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
          {t.tone === 'success' ? (
            <CheckCircle2 size={18} className="mt-px shrink-0 text-emerald-400" />
          ) : t.tone === 'warning' ? (
            <TriangleAlert size={18} className="mt-px shrink-0 text-amber-400" />
          ) : (
            <Info size={18} className="mt-px shrink-0 text-indigo-300" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 truncate text-xs text-slate-400">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
