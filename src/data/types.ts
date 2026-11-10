export type CentreId = 'cysoing' | 'phalempin' | 'templeuve' | 'tourlaville'
export type BranchId = 'all' | CentreId

/** État Prospect : où en est la prise de contact téléphonique. */
export type EtatProspect =
  | 'Nouveau lead'
  | 'NRP 1'
  | 'NRP 2'
  | 'Relance phoning'
  | 'RDV fixé'
  | 'Pas intéressé'
  | 'Hors zone'
  | 'Faux numéro'
  | 'Doublon'
  | 'Clôture'

/** Statut Suivi Patient : le parcours une fois qu'un RDV a été fixé. */
export type StatutSuivi =
  | 'En attente'
  | 'Pas venu'
  | 'En essai'
  | 'Facturé'
  | 'Non appareillable'
  | "Échec d'appareillage"

export type PourQui = 'Pour moi' | 'Pour un proche'
export type Situation =
  | 'Conversations en groupe'
  | 'Télévision'
  | 'Téléphone'
  | 'Restaurant'
  | 'Acouphènes'
export type CentPourcent = 'Oui' | 'Non' | 'Je ne sais pas'

export interface Note {
  id: string
  date: string // ISO
  auteur: string
  texte: string
}

/** Suivi des SMS automatiques : date d'envoi de chaque SMS. */
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
  /** Conservé pour les automatisations : jamais affiché dans l'interface partenaire. */
  email?: string
  age: number
  centre: CentreId
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
  montant?: number // Montant facturé (€), saisi à partir de l'essai
  avisGoogle: boolean // Demander Avis Google (essai / facturé uniquement)
  consentementLe: string // ISO — date de consentement (questionnaire)
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
