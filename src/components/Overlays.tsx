import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Info,
  Mail,
  MessageSquarePlus,
  Phone,
  Send,
  StickyNote,
  TriangleAlert,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, ETATS } from '../data/constants'
import type { EtatProspect, StatutSuivi } from '../data/types'
import { DAY, cn, formatAge, formatDate, formatEur, formatRelativeDay, fullName, initials, startOfDay, toLocalInput } from '../lib/utils'
import { Button, EtatBadge, Field, Modal, PanierInput, StatutBadge, StatutSelect, Switch, inputCls } from './ui'
import { SourceDot } from './MetaTags'

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
    toast({ title: 'RDV confirmé · SMS Confirmation RDV envoyé', description: `${fullName(p)} · ${formatRelativeDay(d.toISOString())}`, tone: 'success' })
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
          <Button variant="accent" onClick={confirm}>
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
                  day === i ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300',
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
                    slot === s && !busy ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300',
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
        <p className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <Send size={14} className="shrink-0 text-slate-400" />
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
  const { state, byId, select, setEtat, setStatut, patch, addNote, openRdv, openRelance, toast } = useStore()
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
    const sms = (etat === 'NRP 1' && !p.sms.nrp1) || (etat === 'NRP 2' && !p.sms.nrp2)
    toast({ title: 'État mis à jour', description: `${fullName(p)} · ${etat}${sms ? ` · SMS ${etat} envoyé` : ''}` })
  }
  const changeStatut = (statut: StatutSuivi | null) => {
    if (statut === 'RDV Pris' && !p.rdvLe) return openRdv(p.id)
    setStatut(p.id, statut, {}, `Statut suivi → ${statut ?? '(Vide)'}`)
    toast({ title: 'Statut patient mis à jour', description: `${fullName(p)} · ${statut ?? '(Vide)'}`, tone: statut === 'Facturé' ? 'success' : 'info' })
  }
  const setDate = (field: 'rappelLe' | 'rdvLe', value: string) => {
    const iso = value ? new Date(value).toISOString() : undefined
    if (field === 'rdvLe') {
      const extra = iso && !p.statut ? { statut: 'RDV Pris' as const } : {}
      patch(p.id, { rdvLe: iso, ...extra }, iso ? `Date de RDV → ${formatRelativeDay(iso)}` : 'Date de RDV effacée')
    } else {
      patch(p.id, { rappelLe: iso }, iso ? `Date de rappel → ${formatRelativeDay(iso)}` : 'Date de rappel effacée')
    }
  }
  const saveNote = () => {
    if (!draft.trim()) return
    addNote(p.id, draft.trim())
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-slate-900/20" onClick={() => select(null)} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flat-overlay flex w-full max-w-[480px] flex-col bg-app shadow-xl">
        <div className="flex items-start gap-4 border-b border-[var(--card-border)] bg-white p-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {initials(p)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-900">{fullName(p)}</h2>
              <SourceDot source={p.source} />
            </div>
            <p className="text-sm text-slate-500">
              {p.age} ans · {CENTRES[p.centre].nom} · <span className="text-slate-400">{p.id}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <EtatBadge etat={p.etat} />
              {p.statut && <StatutBadge statut={p.statut} />}
              <span className="text-[11px] text-slate-400">reçu il y a {formatAge(p.createdAt)}</span>
            </div>
          </div>
          <button onClick={() => select(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
          {/* Coordonnées */}
          <Section title="Coordonnées" icon={<User size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Prénom" value={p.prenom} onCommit={(v) => patch(p.id, { prenom: v })} />
              <EditField label="Nom" value={p.nom} onCommit={(v) => patch(p.id, { nom: v })} />
              <EditField label="Téléphone" value={p.telephone} type="tel" onCommit={(v) => patch(p.id, { telephone: v })}
                action={<a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="text-slate-400 hover:text-[var(--accent-text)]" aria-label="Appeler"><Phone size={14} /></a>} />
              <EditField label="Ville" value={p.ville} onCommit={(v) => patch(p.id, { ville: v })} />
              <div className="col-span-2">
                <EditField label="Email" value={p.email} type="email" onCommit={(v) => patch(p.id, { email: v })}
                  action={<a href={`mailto:${p.email}`} className="text-slate-400 hover:text-slate-700" aria-label="Écrire"><Mail size={14} /></a>} />
              </div>
            </div>
          </Section>

          {/* Réponses Meta */}
          <Section title="Réponses Meta Ads" icon={<SourceDot source={p.source} />}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-100">
              <MetaCell label="Pour qui ?" value={p.pourQui} />
              <MetaCell label="Situation gênante" value={p.situation} />
              <MetaCell label="100% Santé" value={p.centPourcent}  />
              <MetaCell label="Date consentement" value={formatDate(p.consentementLe, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            </dl>
          </Section>

          {/* Suivi */}
          <Section title="Suivi" icon={<ClipboardList size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="État Prospect">
                <select className={inputCls} value={p.etat} onChange={(e) => changeEtat(e.target.value as EtatProspect)}>
                  {ETATS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </Field>
              <Field label="Statut Suivi Patient">
                <StatutSelect value={p.statut} onChange={changeStatut} className="w-full [&_select]:h-[38px] [&_select]:rounded-lg [&_select]:text-sm" />
              </Field>
              <Field label="Date de rappel">
                <input type="datetime-local" className={inputCls} value={p.rappelLe ? toLocalInput(new Date(p.rappelLe)) : ''} onChange={(e) => setDate('rappelLe', e.target.value)} />
              </Field>
              <Field label="Date de RDV">
                <input type="datetime-local" className={inputCls} value={p.rdvLe ? toLocalInput(new Date(p.rdvLe)) : ''} onChange={(e) => setDate('rdvLe', e.target.value)} />
              </Field>
              <Field label="Panier Moyen (€)">
                <PanierInput value={p.panier} className="[&_input]:h-[38px] [&_input]:rounded-lg [&_input]:border-slate-200 [&_input]:bg-white [&_input]:text-sm" onCommit={(v) => patch(p.id, { panier: v }, `Panier moyen → ${formatEur(v)}`)} />
              </Field>
              <Field label="Demander Avis">
                <div className="flex h-[38px] items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3">
                  <Switch
                    checked={p.avisGoogle}
                    label="Demander Avis Google"
                    onChange={(v) => {
                      patch(p.id, { avisGoogle: v }, v ? 'Demande d’avis Google envoyée par SMS.' : undefined)
                      if (v) toast({ title: 'SMS Avis Google envoyé', description: fullName(p), tone: 'success' })
                    }}
                  />
                  <span className={cn('text-xs font-medium', p.avisGoogle ? 'text-[var(--accent-text)]' : 'text-slate-500')}>{p.avisGoogle ? '✓ SMS Avis envoyé' : 'Non demandé'}</span>
                </div>
              </Field>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="accent" className="flex-1" onClick={() => openRdv(p.id)}>
                <CalendarCheck size={16} /> {p.rdvLe ? 'Déplacer le RDV' : 'Fixer un RDV'}
              </Button>
              <Button className="flex-1" onClick={() => openRelance(p.id)}>
                <CalendarClock size={16} /> Relance phoning
              </Button>
            </div>
          </Section>

          {/* Onoff */}
          <Section title="Traçabilité Automatisations Onoff" icon={<Zap size={14} />}>
            <ul className="divide-y divide-slate-100">
              <SmsRow label="SMS NRP 1" at={p.sms.nrp1} />
              <SmsRow label="SMS NRP 2" at={p.sms.nrp2} />
              <SmsRow label="SMS Confirmation RDV" at={p.sms.rdv} />
              <SmsRow label="SMS Avis Google" at={p.sms.avis} />
            </ul>
          </Section>

          {/* Notes */}
          <Section title="Notes" icon={<StickyNote size={14} />}>
            <div className="mb-4 flex gap-2">
              <textarea
                rows={2}
                className={inputCls}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    saveNote()
                  }
                }}
                placeholder="Ajouter une note… (Entrée pour enregistrer)"
              />
              <Button variant="primary" className="h-auto" disabled={!draft.trim()} onClick={saveNote} aria-label="Ajouter la note">
                <MessageSquarePlus size={16} />
              </Button>
            </div>
            <ol className="relative ml-1 space-y-4 border-l border-slate-200 pl-5">
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
                <span className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400" />
                <p className="text-sm text-slate-700">Lead reçu via formulaire {p.source}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Automatique · {formatDate(p.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </li>
            </ol>
          </Section>
        </div>
      </aside>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card-surface bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

function EditField({ label, value, onCommit, type = 'text', action }: { label: string; value: string; onCommit: (v: string) => void; type?: string; action?: React.ReactNode }) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={type}
          className={cn(inputCls, !!action && 'pr-9')}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => (v.trim() && v.trim() !== value ? onCommit(v.trim()) : setV(value))}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        {action && <span className="absolute top-1/2 right-3 -translate-y-1/2">{action}</span>}
      </div>
    </Field>
  )
}

function MetaCell({ label, value, tone = 'text-slate-800' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-slate-50/70 p-3">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className={cn('mt-0.5 text-[13px] font-semibold', tone)}>{value}</dd>
    </div>
  )
}

function SmsRow({ label, at }: { label: string; at?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-[13px]">
      <span className={cn('flex items-center gap-2', at ? 'text-slate-800' : 'text-slate-400')}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: at ? '#10B981' : '#D4D4D8' }} />
        {at ? `✓ ${label} envoyé` : `${label} — non envoyé`}
      </span>
      {at && <span className="text-[11px] text-slate-400 tabular-nums">{formatDate(at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
    </li>
  )
}

/* ------------------------------ Toasts ------------------------------- */
export function Toasts() {
  const { state } = useStore()
  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
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
