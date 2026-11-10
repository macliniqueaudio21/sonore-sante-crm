import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { INITIAL_PROSPECTS } from './data/mock'
import { CENTRES, CURRENT_USER, KANBAN_ETATS, isAppareillage } from './data/constants'
import type { BranchId, CentreId, EtatProspect, Prospect, StatutSuivi, ViewId } from './data/types'
import { inBranch, rappelBucket } from './lib/utils'

export interface Toast {
  id: number
  title: string
  description?: string
  tone?: 'success' | 'info' | 'warning'
}

interface State {
  prospects: Prospect[]
  branch: BranchId
  view: ViewId
  selectedId: string | null
  rdvForId: string | null
  relanceForId: string | null
  toasts: Toast[]
}

type Action =
  | { type: 'branch'; branch: BranchId }
  | { type: 'view'; view: ViewId }
  | { type: 'select'; id: string | null }
  | { type: 'openRdv'; id: string | null }
  | { type: 'openRelance'; id: string | null }
  | { type: 'patch'; id: string; patch: Partial<Prospect>; note?: string }
  | { type: 'toast'; toast: Toast }
  | { type: 'dismiss'; id: number }

/**
 * Simule les automatisations déclenchées par un changement : SMS NRP 1 / NRP 2,
 * SMS de confirmation RDV, SMS d'avis Google (essai / facturé uniquement) et dates d'étape.
 */
function applyAutomations(before: Prospect, next: Prospect): Prospect {
  const now = new Date().toISOString()
  const sms = { ...next.sms }
  if (next.etat === 'NRP 1' && before.etat !== 'NRP 1' && !sms.nrp1) sms.nrp1 = now
  if (next.etat === 'NRP 2' && before.etat !== 'NRP 2' && !sms.nrp2) sms.nrp2 = now
  if (next.rdvLe && next.rdvLe !== before.rdvLe) sms.rdv = now
  // La demande d'avis n'existe que pour un patient en essai ou facturé.
  const avisGoogle = next.avisGoogle && isAppareillage(next.statut)
  if (avisGoogle && !before.avisGoogle) sms.avis = now
  const out: Prospect = { ...next, avisGoogle, sms }
  if (next.statut === 'En essai' && before.statut !== 'En essai' && !next.essaiLe) out.essaiLe = now
  if (next.statut === 'Facturé' && before.statut !== 'Facturé') out.factureLe = now
  return out
}

let noteSeq = 1
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'branch':
      return { ...state, branch: action.branch }
    case 'view':
      return { ...state, view: action.view }
    case 'select':
      return { ...state, selectedId: action.id }
    case 'openRdv':
      return { ...state, rdvForId: action.id }
    case 'openRelance':
      return { ...state, relanceForId: action.id }
    case 'patch':
      return {
        ...state,
        prospects: state.prospects.map((p) => {
          if (p.id !== action.id) return p
          const notes = action.note
            ? [
                ...p.notes,
                {
                  id: `u${noteSeq++}`,
                  date: new Date().toISOString(),
                  auteur: CURRENT_USER.nom.split(' ')[0] + ' ' + CURRENT_USER.nom.split(' ')[1][0] + '.',
                  texte: action.note,
                },
              ]
            : p.notes
          return applyAutomations(p, { ...p, ...action.patch, notes })
        }),
      }
    case 'toast':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'dismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
  }
}

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, {
    prospects: INITIAL_PROSPECTS,
    branch: 'all',
    view: 'dashboard',
    selectedId: null,
    rdvForId: null,
    relanceForId: null,
    toasts: [],
  })

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    dispatch({ type: 'toast', toast: { ...t, id } })
    setTimeout(() => dispatch({ type: 'dismiss', id }), 3800)
  }, [])

  const visible = useMemo(
    () => state.prospects.filter((p) => inBranch(p, state.branch)),
    [state.prospects, state.branch],
  )

  /** Alertes d'un ensemble de prospects : nouveaux leads à traiter, relances dues (en retard ou aujourd'hui). */
  const alertsOf = (list: Prospect[]) => {
    const kanban = list.filter((p) => p.statut === null && KANBAN_ETATS.includes(p.etat))
    const relance = list.filter((p) => p.statut === null && p.etat === 'Relance phoning')
    const today = relance.filter((p) => rappelBucket(p.rappelLe) === 'today').length
    const retard = relance.filter((p) => rappelBucket(p.rappelLe) === 'retard').length
    return { aTraiter: kanban.filter((p) => p.etat === 'Nouveau lead').length, kanban: kanban.length, relanceToday: today, relanceRetard: retard, relanceDues: today + retard }
  }
  const counts = useMemo(() => alertsOf(visible), [visible]) // eslint-disable-line react-hooks/exhaustive-deps
  const countsByCentre = useMemo(
    () =>
      Object.fromEntries((Object.keys(CENTRES) as CentreId[]).map((c) => [c, alertsOf(state.prospects.filter((p) => p.centre === c))])) as Record<
        CentreId,
        ReturnType<typeof alertsOf>
      >,
    [state.prospects], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const actions = useMemo(
    () => ({
      setBranch: (branch: BranchId) => dispatch({ type: 'branch', branch }),
      setView: (view: ViewId) => dispatch({ type: 'view', view }),
      /** Ouvre une vue sur un centre précis (ou la vue groupe avec 'all'). */
      go: (view: ViewId, branch: BranchId) => {
        dispatch({ type: 'branch', branch })
        dispatch({ type: 'view', view })
      },
      select: (id: string | null) => dispatch({ type: 'select', id }),
      openRdv: (id: string | null) => dispatch({ type: 'openRdv', id }),
      openRelance: (id: string | null) => dispatch({ type: 'openRelance', id }),
      patch: (id: string, patch: Partial<Prospect>, note?: string) => dispatch({ type: 'patch', id, patch, note }),
      setEtat: (id: string, etat: EtatProspect, note?: string) => dispatch({ type: 'patch', id, patch: { etat }, note }),
      setStatut: (id: string, statut: StatutSuivi | null, extra: Partial<Prospect> = {}, note?: string) =>
        dispatch({ type: 'patch', id, patch: { statut, ...extra }, note }),
      addNote: (id: string, texte: string) => dispatch({ type: 'patch', id, patch: {}, note: texte }),
      toast,
    }),
    [toast],
  )

  const byId = useCallback((id: string | null) => state.prospects.find((p) => p.id === id) ?? null, [state.prospects])

  return { state, visible, counts, countsByCentre, byId, ...actions }
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}
