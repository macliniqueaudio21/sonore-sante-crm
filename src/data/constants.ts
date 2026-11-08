import type { BranchId, CentreId, EtatProspect, StatutSuivi } from './types'

export const GROUP_NAME = 'Audition59'
export const PANIER_MOYEN = 2500 // € par patient facturé
export const KANBAN_ETATS: EtatProspect[] = ['Nouveau lead', 'NRP 1', 'NRP 2']
export const ETATS: EtatProspect[] = [
  'Nouveau lead',
  'NRP 1',
  'NRP 2',
  'Relance phoning',
  'Pas intéressé',
  'Injoignable',
]
export const STATUTS: StatutSuivi[] = [
  'RDV Pris',
  'RDV Réalisé',
  'Essai en cours',
  'Facturé',
  'Non appareillé',
]

export const CENTRES: Record<CentreId, { nom: string; court: string; ville: string; adresse: string }> = {
  cysoing: { nom: 'Centre de Cysoing', court: 'Cysoing', ville: 'Cysoing', adresse: '12 place de la République, 59830 Cysoing' },
  phalempin: { nom: 'Centre de Phalempin', court: 'Phalempin', ville: 'Phalempin', adresse: '45 rue du Général de Gaulle, 59133 Phalempin' },
  templeuve: { nom: 'Centre de Templeuve-en-Pévèle', court: 'Templeuve', ville: 'Templeuve-en-Pévèle', adresse: '3 rue Jean Jaurès, 59242 Templeuve-en-Pévèle' },
  tourlaville: { nom: 'Centre de Tourlaville', court: 'Tourlaville', ville: 'Tourlaville', adresse: '28 avenue des Prairies, 50110 Cherbourg-en-Cotentin' },
}

export const BRANCHES: { id: BranchId; label: string; sub: string }[] = [
  { id: 'all', label: 'Vue Globale Groupe', sub: `${GROUP_NAME} · Tous les centres` },
  { id: 'cysoing', label: 'Centre de Cysoing', sub: 'Nord (59)' },
  { id: 'phalempin', label: 'Centre de Phalempin', sub: 'Nord (59)' },
  { id: 'templeuve', label: 'Centre de Templeuve-en-Pévèle', sub: 'Nord (59)' },
  { id: 'tourlaville', label: 'Centre de Tourlaville', sub: 'Manche (50)' },
]

export const ETAT_STYLE: Record<EtatProspect, string> = {
  'Nouveau lead': 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  'NRP 1': 'bg-amber-50 text-amber-700 ring-amber-600/15',
  'NRP 2': 'bg-orange-50 text-orange-700 ring-orange-600/15',
  'Relance phoning': 'bg-sky-50 text-sky-700 ring-sky-600/15',
  'Pas intéressé': 'bg-slate-100 text-slate-600 ring-slate-500/15',
  Injoignable: 'bg-rose-50 text-rose-700 ring-rose-600/15',
}

export const STATUT_STYLE: Record<StatutSuivi, string> = {
  'RDV Pris': 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  'RDV Réalisé': 'bg-violet-50 text-violet-700 ring-violet-600/15',
  'Essai en cours': 'bg-amber-50 text-amber-700 ring-amber-600/15',
  Facturé: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  'Non appareillé': 'bg-slate-100 text-slate-600 ring-slate-500/15',
}

export const CONSEILLERS = ['Camille D.', 'Julien M.', 'Sarah L.']
export const CURRENT_USER = { nom: 'Camille Dufresne', initiales: 'CD', role: 'Audioprothésiste D.E.' }
