export type CentreId = 'cysoing' | 'phalempin' | 'templeuve' | 'tourlaville'
export type BranchId = 'all' | CentreId

/** État Prospect : où en est la prise de contact téléphonique. */
export type EtatProspect =
  | 'Nouveau lead'
  | 'NRP 1'
  | 'NRP 2'
  | 'Relance phoning'
  | 'Pas intéressé'
  | 'Hors zone'
  | 'Faux numéro'
  | 'Doublon'
  | 'Clôture'

/** Statut Suivi Patient : le parcours une fois qu'un RDV a été fixé. */
export type StatutSuivi = 'RDV Pris' | 'RDV Réalisé' | 'Essai' | 'Facturé'

export type PourQui = 'Pour moi' | 'Pour un proche'
export type Situation =
  | 'Conversations en groupe'
  | 'Télévision'
  | 'Téléphone'
  | 'Restaurant'
  | 'Acouphènes'
export type CentPourcent = 'Oui' | 'Non' | 'Je ne sais pas'
export type Source = 'Facebook' | 'Instagram'

export interface Note {
  id: string
  date: string // ISO
  auteur: string
  texte: string
}

/** Traçabilité des automatisations Onoff : date d'envoi de chaque SMS. */
export interface SmsLog {
  nrp1?: string
  nrp2?: string
  rdv?: string
  avis?: string
}

export interface Prospect {
  id: string
  prenom: string
  nom: string
  ville: string
  telephone: string
  email: string
  age: number
  centre: CentreId
  source: Source
  createdAt: string // ISO
  etat: EtatProspect
  statut: StatutSuivi | null
  pourQui: PourQui
  situation: Situation
  centPourcent: CentPourcent
  rappelLe?: string // ISO — date de relance phoning
  rdvLe?: string // ISO — date du RDV
  essaiLe?: string // ISO — début de l'essai
  factureLe?: string // ISO — date de facturation
  panier: number // Panier Moyen (€)
  avisGoogle: boolean // Demander Avis Google
  consentementLe: string // ISO — date de consentement (formulaire Meta)
  sms: SmsLog
  notes: Note[]
}

export type ViewId =
  | 'dashboard'
  | 'kanban'
  | 'relance'
  | 'parcours'
  | 'prospects'
  | 'facturation'
  | 'support'
