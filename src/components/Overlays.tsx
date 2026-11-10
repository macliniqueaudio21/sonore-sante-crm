import { useEffect, useState } from 'react'
import {
  Activity,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Info,
  ListChecks,
  MailCheck,
  MailX,
  MessageSquarePlus,
  MessageSquareText,
  Phone,
  PhoneMissed,
  Send,
  StickyNote,
  TriangleAlert,
  User,
  X,
} from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, KANBAN_ETATS, isAppareillage } from '../data/constants'
import type { EtatProspect, StatutSuivi } from '../data/types'
import { DAY, cn, formatAge, formatDate, formatEur, formatRdvLong, formatRelativeDay, fullName, initials, startOfDay, toDateInput, toLocalInput } from '../lib/utils'
import { Button, DotSelect, ETAT_OPTIONS, EtatBadge, Field, Modal, MontantInput, StatutBadge, StatutSelect, Switch, inputCls } from './ui'

/* -------------------------------- RDV -------------------------------- */
// Le CRM n'est pas relié à l'agenda du centre : on choisit librement le jour et l'heure.
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 8).padStart(2, '0')) // 08 → 19
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')) // 00 → 55

/** Les 5 prochains jours ouvrés (lundi → vendredi), à partir de demain. */
function nextBusinessDays(n = 5) {
  const out: Date[] = []
  let d = startOfDay(Date.now() + DAY)
  while (out.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(d)
    d = startOfDay(d.getTime() + DAY + 3_600_000) // +1 h évite les pièges du changement d'heure
  }
  return out
}

export function RdvModal() {
  const { state, byId, openRdv, patch, toast } = useStore()
  const p = byId(state.rdvForId)
  const days = nextBusinessDays()
  const [day, setDay] = useState<string>(toDateInput(days[0]))
  const [other, setOther] = useState(false)
  const [hour, setHour] = useState('10')
  const [minute, setMinute] = useState('00')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!p) return
    const existing = p.rdvLe && new Date(p.rdvLe) > new Date() ? new Date(p.rdvLe) : null
    const d = existing ? toDateInput(existing) : toDateInput(days[0])
    setDay(d)
    setOther(!days.some((x) => toDateInput(x) === d))
    setHour(existing ? String(existing.getHours()).padStart(2, '0') : '10')
    setMinute(existing ? String(existing.getMinutes() - (existing.getMinutes() % 5)).padStart(2, '0') : '00')
    setNote('')
  }, [p?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null
  const close = () => openRdv(null)
  const confirm = () => {
    const d = new Date(`${day}T${hour}:${minute}`)
    const iso = d.toISOString()
    // Un RDV (re)fixé remet le patient « En attente », sauf s'il est déjà plus loin dans son parcours.
    const statut: StatutSuivi = p.statut === null || p.statut === 'Pas venu' || p.statut === 'En attente' ? 'En attente' : p.statut
    patch(p.id, { etat: 'RDV fixé', statut, rdvLe: iso }, `RDV fixé : ${formatRdvLong(iso)} au ${CENTRES[p.centre].nom}.${note ? ' ' + note : ''}`)
    toast({ title: 'RDV confirmé · SMS de confirmation envoyé', description: `${fullName(p)} · ${formatRdvLong(iso)}`, tone: 'success' })
    close()
  }
  const chip = (active: boolean) =>
    cn(
      'cursor-pointer rounded-lg border px-1 py-2 text-center transition-colors',
      active ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300',
    )

  return (
    <Modal
      open
      onClose={close}
      title={p.rdvLe ? 'Modifier le rendez-vous' : 'Fixer un rendez-vous'}
      subtitle={`${fullName(p)} · ${CENTRES[p.centre].nom}`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button variant="accent" onClick={confirm} disabled={!day}>
            <CalendarCheck size={16} /> Confirmer le RDV
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Jour" group>
          <div className="grid grid-cols-6 gap-1.5">
            {days.map((d) => {
              const v = toDateInput(d)
              return (
                <button key={v} onClick={() => { setDay(v); setOther(false) }} className={chip(!other && day === v)}>
                  <div className="text-[10px] font-medium uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  <div className="text-base leading-tight font-semibold">{d.getDate()}</div>
                  <div className="text-[10px]">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                </button>
              )
            })}
            <button onClick={() => setOther(true)} className={cn(chip(other), 'flex flex-col items-center justify-center gap-0.5')}>
              <CalendarClock size={16} strokeWidth={1.75} />
              <span className="text-[10px] leading-tight font-medium">Autre date</span>
            </button>
          </div>
          {other && (
            <input
              type="date"
              aria-label="Autre date"
              className={cn(inputCls, 'mt-2')}
              min={toDateInput(new Date())}
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          )}
        </Field>
        <Field label="Horaire" group>
          <div className="flex items-center gap-2">
            <DotSelect label="Heure" className="w-28" value={hour} onChange={setHour} options={HOURS.map((h) => ({ value: h, label: `${h} h` }))} />
            <span className="text-slate-400">:</span>
            <DotSelect label="Minutes" className="w-28" value={minute} onChange={setMinute} options={MINUTES.map((m) => ({ value: m, label: m }))} />
          </div>
        </Field>
        <Field label="Note (optionnel)">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : venir avec l'ordonnance ORL" />
        </Field>
        <p className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <Send size={14} className="shrink-0 text-slate-400" />
          Un SMS de confirmation et un rappel la veille seront envoyés au {p.telephone}.
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
    setStatut(p.id, statut, {}, `Statut suivi → ${statut ?? '(Vide)'}`)
    const missing = statut === 'Facturé' && p.montant === undefined
    toast({
      title: 'Statut patient mis à jour',
      description: missing ? 'Pensez à saisir le montant facturé.' : `${fullName(p)} · ${statut ?? '(Vide)'}`,
      tone: statut === 'Facturé' ? 'success' : 'info',
    })
  }
  // « Pas de réponse » en 1 clic : Nouveau lead → NRP 1 → NRP 2.
  const nrpNext: EtatProspect | null = p.etat === 'Nouveau lead' ? 'NRP 1' : p.etat === 'NRP 1' ? 'NRP 2' : null
  const saveNote = () => {
    if (!draft.trim()) return
    addNote(p.id, draft.trim())
    setDraft('')
  }
  const appareillage = isAppareillage(p.statut)
  const rdvAVenir = p.rdvLe && new Date(p.rdvLe) > new Date() ? p.rdvLe : null
  const rappel = p.etat === 'Relance phoning' && p.rappelLe ? p.rappelLe : null

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-slate-900/20" onClick={() => select(null)} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-slate-50 shadow-xl">
        <div className="flex items-start gap-4 border-b border-slate-200/80 bg-white p-6">
          <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold', appareillage ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
            {initials(p)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-slate-900">{fullName(p)}</h2>
            <p className="text-sm text-slate-500">
              {p.age} ans · {CENTRES[p.centre].nom} · <span className="text-slate-400">{p.id}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <EtatBadge etat={p.etat} />
              {p.statut && <StatutBadge statut={p.statut} />}
              <span className="text-[11px] text-slate-400">reçu il y a {formatAge(p.createdAt)}</span>
            </div>
          </div>
          <button onClick={() => select(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
          <Section title="Coordonnées" icon={<User size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Prénom" value={p.prenom} onCommit={(v) => patch(p.id, { prenom: v })} />
              <EditField label="Nom" value={p.nom} onCommit={(v) => patch(p.id, { nom: v })} />
              <EditField label="Téléphone" value={p.telephone} type="tel" onCommit={(v) => patch(p.id, { telephone: v })}
                action={<a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="text-slate-400 hover:text-emerald-600" aria-label="Appeler"><Phone size={14} /></a>} />
              <EditField label="Ville" value={p.ville} onCommit={(v) => patch(p.id, { ville: v })} />
            </div>
            {/* L'adresse email reste dans nos données (automatisations) mais n'est jamais affichée. */}
            <p className={cn('mt-3 flex items-center gap-2 text-[13px]', p.email ? 'text-slate-600' : 'text-slate-400')}>
              {p.email ? <MailCheck size={15} className="shrink-0 text-emerald-600" /> : <MailX size={15} className="shrink-0 text-slate-300" />}
              {p.email ? 'Email renseigné · Rappels automatiques activés' : 'Aucun email renseigné'}
            </p>
          </Section>

          <Section title="Réponses questionnaire" icon={<ListChecks size={14} />}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-100">
              <Answer label="Pour qui ?" value={p.pourQui} />
              <Answer label="Situation gênante" value={p.situation} />
              <Answer label="100% Santé" value={p.centPourcent} />
              <Answer label="Date consentement" value={formatDate(p.consentementLe, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            </dl>
          </Section>

          <Section title="Suivi" icon={<Activity size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="État Prospect" group>
                <DotSelect label="État Prospect" value={p.etat} options={ETAT_OPTIONS} onChange={changeEtat} />
              </Field>
              <Field label="Statut Suivi Patient" group>
                <StatutSelect size="md" value={p.statut} onChange={changeStatut} />
              </Field>
            </div>

            {(rdvAVenir || rappel) && (
              <div className="mt-3 space-y-1.5">
                {rdvAVenir && (
                  <Planned icon={<CalendarCheck size={15} />} label="RDV prévu" when={formatRdvLong(rdvAVenir)} onEdit={() => openRdv(p.id)} />
                )}
                {rappel && <Planned icon={<CalendarClock size={15} />} label="Rappel prévu" when={formatRdvLong(rappel)} onEdit={() => openRelance(p.id)} />}
              </div>
            )}

            {appareillage && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Montant facturé (€)">
                  <MontantInput bordered value={p.montant} onCommit={(v) => patch(p.id, { montant: v }, v === undefined ? 'Montant facturé effacé' : `Montant facturé → ${formatEur(v)}`)} />
                </Field>
                <Field label="Demander Avis Google" group>
                  <div className="flex h-[38px] items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3">
                    <Switch
                      checked={p.avisGoogle}
                      label="Demander Avis Google"
                      onChange={(v) => {
                        patch(p.id, { avisGoogle: v }, v ? 'Demande d’avis Google envoyée par SMS.' : undefined)
                        if (v) toast({ title: 'SMS Avis Google envoyé', description: fullName(p), tone: 'success' })
                      }}
                    />
                    <span className={cn('truncate text-xs font-medium', p.avisGoogle ? 'text-emerald-700' : 'text-slate-500')}>{p.avisGoogle ? '✓ SMS Avis envoyé' : 'Non demandé'}</span>
                  </div>
                </Field>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="accent" className="min-w-[140px] flex-1" onClick={() => openRdv(p.id)}>
                <CalendarCheck size={15} /> {p.rdvLe ? 'Modifier le RDV' : 'Fixer un RDV'}
              </Button>
              <Button className="min-w-[140px] flex-1" onClick={() => openRelance(p.id)}>
                <CalendarClock size={15} /> Relance phoning
              </Button>
              <Button
                className="min-w-[140px] flex-1"
                disabled={!nrpNext}
                title={nrpNext ? `Passer en ${nrpNext}` : KANBAN_ETATS.includes(p.etat) ? 'Déjà en NRP 2' : 'Réservé aux prospects en cours d’appel'}
                onClick={() => nrpNext && changeEtat(nrpNext)}
              >
                <PhoneMissed size={15} /> Pas de réponse (NRP)
              </Button>
            </div>
          </Section>

          <Section title="Suivi des SMS automatiques" icon={<MessageSquareText size={14} />}>
            <ul className="divide-y divide-slate-100">
              <SmsRow label="SMS NRP 1" at={p.sms.nrp1} />
              <SmsRow label="SMS NRP 2" at={p.sms.nrp2} />
              <SmsRow label="SMS Confirmation RDV" at={p.sms.rdv} />
              <SmsRow label="SMS Avis Google" at={p.sms.avis} />
            </ul>
          </Section>

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
                <p className="text-sm text-slate-700">Questionnaire reçu</p>
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
    <section className="rounded-xl border border-slate-200/80 bg-white p-4">
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

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50/70 p-3">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

/** Encart récapitulatif d'un RDV ou rappel programmé. */
function Planned({ icon, label, when, onEdit }: { icon: React.ReactNode; label: string; when: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[13px]">
      <span className="text-emerald-600">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-slate-700">
        {label} : <span className="font-medium text-slate-900">{when}</span>
      </span>
      <button onClick={onEdit} className="shrink-0 cursor-pointer text-xs font-medium text-emerald-700 hover:underline">
        Modifier
      </button>
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
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {state.toasts.map((t) => (
        <div key={t.id} className="animate-pop-in pointer-events-auto flex items-start gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
          {t.tone === 'success' ? (
            <CheckCircle2 size={18} className="mt-px shrink-0 text-emerald-400" />
          ) : t.tone === 'warning' ? (
            <TriangleAlert size={18} className="mt-px shrink-0 text-amber-400" />
          ) : (
            <Info size={18} className="mt-px shrink-0 text-sky-300" />
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
