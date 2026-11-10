import type { BranchId, CentreId, EtatProspect, StatutSuivi } from './types'

export const GROUP_NAME = 'Audition59'
export const KANBAN_ETATS: EtatProspect[] = ['Nouveau lead', 'NRP 1', 'NRP 2']
export const ETATS: EtatProspect[] = [
  'Nouveau lead',
  'NRP 1',
  'NRP 2',
  'Relance phoning',
  'RDV fixé',
  'Pas intéressé',
  'Hors zone',
  'Faux numéro',
  'Doublon',
  'Clôture',
]
export const STATUTS: StatutSuivi[] = ['En attente', 'Pas venu', 'En essai', 'Facturé', 'Non appareillable', "Échec d'appareillage"]
/** Statuts à partir desquels le montant facturé et la demande d'avis Google ont un sens. */
export const STATUTS_APPAREILLAGE: StatutSuivi[] = ['En essai', 'Facturé']
export const isAppareillage = (s: StatutSuivi | null) => s !== null && STATUTS_APPAREILLAGE.includes(s)
/** États qui sortent définitivement un prospect du circuit d'appel. */
export const ETATS_SORTIE: EtatProspect[] = ['Pas intéressé', 'Hors zone', 'Faux numéro', 'Doublon', 'Clôture']

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

/** Couleur du point (8 px) associé à chaque valeur : identique dans les menus, cartes et tableaux. */
export const ETAT_DOT: Record<EtatProspect, string> = {
  'Nouveau lead': '#10B981', // vert émeraude
  'NRP 1': '#F59E0B', // ambre
  'NRP 2': '#F97316', // orange
  'Relance phoning': '#3B82F6', // bleu
  'RDV fixé': '#0D9488', // teal
  'Pas intéressé': '#94A3B8', // ardoise
  'Hors zone': '#94A3B8',
  'Faux numéro': '#B87171', // rouge désaturé
  Doublon: '#94A3B8',
  Clôture: '#64748B',
}
export const STATUT_DOT: Record<StatutSuivi, string> = {
  'En attente': '#64748B', // ardoise
  'Pas venu': '#F87171', // rouge doux
  'En essai': '#38BDF8', // bleu ciel
  Facturé: '#10B981', // émeraude
  'Non appareillable': '#B4533F', // rouge brique
  "Échec d'appareillage": '#991B1B', // rouge foncé
}
export const VIDE_DOT = '#CBD5E1'

export const CONSEILLERS = ['Camille D.', 'Julien M.', 'Sarah L.']
export const CURRENT_USER = { nom: 'Camille Dufresne', initiales: 'CD', role: 'Audioprothésiste D.E.' }
