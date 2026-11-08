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
  'Hors zone',
  'Faux numéro',
  'Doublon',
  'Clôture',
]
export const STATUTS: StatutSuivi[] = ['RDV Pris', 'RDV Réalisé', 'Essai', 'Facturé']
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

/** Couleur du petit point de statut (les badges restent gris). */
const GREEN = '#10B981', AMBER = '#F59E0B', RED = '#EF4444', BLUE = '#3B82F6', GRAY = '#A1A1AA'
export const ETAT_DOT: Record<EtatProspect, string> = {
  'Nouveau lead': GREEN,
  'NRP 1': AMBER,
  'NRP 2': RED,
  'Relance phoning': BLUE,
  'Pas intéressé': GRAY,
  'Hors zone': GRAY,
  'Faux numéro': GRAY,
  Doublon: GRAY,
  Clôture: GRAY,
}
export const STATUT_DOT: Record<StatutSuivi, string> = {
  'RDV Pris': BLUE,
  'RDV Réalisé': AMBER,
  Essai: AMBER,
  Facturé: GREEN,
}
export const DOT = { GREEN, AMBER, RED, BLUE, GRAY }

export const CONSEILLERS = ['Camille D.', 'Julien M.', 'Sarah L.']
export const CURRENT_USER = { nom: 'Camille Dufresne', initiales: 'CD', role: 'Audioprothésiste D.E.' }
