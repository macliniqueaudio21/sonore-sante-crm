import type {
  CentPourcent,
  CentreId,
  EtatProspect,
  Note,
  PourQui,
  Prospect,
  Situation,
  Source,
  StatutSuivi,
} from './types'

/* ------------------------------------------------------------------ */
/* Générateur pseudo-aléatoire déterministe : les mêmes données à     */
/* chaque rechargement, dates calculées par rapport à « maintenant ».  */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(59830)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => min + rand() * (max - min)

const HOUR = 3_600_000
const NOW = Date.now()

const PRENOMS_F = ['Monique', 'Françoise', 'Martine', 'Nicole', 'Brigitte', 'Christiane', 'Danielle', 'Josiane', 'Annie', 'Chantal', 'Sylvie', 'Catherine', 'Marie-Claude', 'Jacqueline', 'Colette', 'Évelyne', 'Odile', 'Bernadette', 'Ginette', 'Michèle', 'Patricia', 'Dominique', 'Isabelle', 'Nathalie']
const PRENOMS_H = ['Jean-Pierre', 'Michel', 'Bernard', 'Alain', 'Gérard', 'Daniel', 'Jacques', 'Patrick', 'Christian', 'Philippe', 'René', 'Claude', 'Roger', 'André', 'Serge', 'Jean-Claude', 'Guy', 'Francis', 'Didier', 'Pierre', 'Joël', 'Gilbert', 'Thierry', 'Hervé']
const NOMS = ['Lefebvre', 'Dupont', 'Leroy', 'Delattre', 'Lemaire', 'Vandenberghe', 'Dubois', 'Duhamel', 'Carpentier', 'Delcourt', 'Lambert', 'Desmet', 'Hennebert', 'Wattel', 'Delannoy', 'Bulteau', 'Lecomte', 'Maes', 'Deschamps', 'Fontaine', 'Caron', 'Moreau', 'Leclercq', 'Vasseur', 'Dhont', 'Coppin', 'Lebrun', 'Marchand', 'Brunet', 'Lemoine', 'Hamon', 'Lecoq', 'Lepetit', 'Lebas', 'Hébert', 'Lemonnier', 'Le Goff', 'Fauvel', 'Jeanne', 'Mauger']

const VILLES: Record<CentreId, string[]> = {
  cysoing: ['Cysoing', 'Bouvines', 'Louvil', 'Genech', 'Bourghelles', 'Wannehain', 'Baisieux', 'Camphin-en-Pévèle'],
  phalempin: ['Phalempin', 'Thumeries', 'Wahagnies', 'Avelin', 'Pont-à-Marcq', 'Camphin-en-Carembault', 'Libercourt', 'Seclin'],
  templeuve: ['Templeuve-en-Pévèle', 'Mons-en-Pévèle', 'Ennevelin', 'Cappelle-en-Pévèle', 'Mérignies', 'Nomain', 'Orchies', 'Bersée'],
  tourlaville: ['Tourlaville', 'Cherbourg-en-Cotentin', 'La Glacerie', 'Équeurdreville', 'Digosville', 'Bretteville', 'Valognes', 'Martinvast'],
}
const CENTRE_WEIGHTS: [CentreId, number][] = [
  ['cysoing', 0.3],
  ['phalempin', 0.26],
  ['templeuve', 0.24],
  ['tourlaville', 0.2],
]
const SITUATIONS: Situation[] = ['Conversations en groupe', 'Conversations en groupe', 'Télévision', 'Télévision', 'Téléphone', 'Restaurant', 'Acouphènes']
const CENT: CentPourcent[] = ['Oui', 'Oui', 'Oui', 'Non', 'Je ne sais pas', 'Je ne sais pas']
const POUR_QUI: PourQui[] = ['Pour moi', 'Pour moi', 'Pour moi', 'Pour un proche']

function pickCentre(): CentreId {
  const r = rand()
  let acc = 0
  for (const [c, w] of CENTRE_WEIGHTS) {
    acc += w
    if (r <= acc) return c
  }
  return 'cysoing'
}

function phone() {
  const pre = rand() < 0.75 ? pick(['06', '07']) : pick(['03', '02'])
  const parts = Array.from({ length: 4 }, () => String(Math.floor(rand() * 100)).padStart(2, '0'))
  return [pre, ...parts].join(' ')
}

function slug(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

let idSeq = 1000
let noteSeq = 1
const note = (date: number, texte: string, auteur = pick(['Camille D.', 'Julien M.', 'Sarah L.'])): Note => ({
  id: `n${noteSeq++}`,
  date: new Date(date).toISOString(),
  auteur,
  texte,
})

interface Overrides {
  centre?: CentreId
  createdAgoH: number
  etat: EtatProspect
  statut?: StatutSuivi | null
  rappelInH?: number
  rdvInH?: number
  factureAgoH?: number
  essaiAgoH?: number
  panier?: number
  avis?: boolean
  notes?: { agoH: number; texte: string }[]
  pourQui?: PourQui
  situation?: Situation
  centPourcent?: CentPourcent
}

function make(o: Overrides): Prospect {
  const femme = rand() < 0.55
  const prenom = pick(femme ? PRENOMS_F : PRENOMS_H)
  const nom = pick(NOMS)
  const centre = o.centre ?? pickCentre()
  const domain = pick(['orange.fr', 'gmail.com', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net'])
  const createdAt = NOW - o.createdAgoH * HOUR
  const iso = (t: number | undefined) => (t === undefined ? undefined : new Date(Math.min(t, NOW - 60_000)).toISOString())
  const factureAt = o.factureAgoH !== undefined ? NOW - o.factureAgoH * HOUR : undefined
  // Traçabilité Onoff : SMS envoyés automatiquement à chaque étape franchie.
  const closedAfterCalls = o.etat === 'Clôture' && o.statut == null
  const passedNrp1 = o.etat === 'NRP 1' || o.etat === 'NRP 2' || closedAfterCalls || (o.etat === 'Relance phoning' && rand() < 0.5)
  const passedNrp2 = o.etat === 'NRP 2' || closedAfterCalls
  const avis = o.avis ?? (o.statut === 'Facturé' && rand() < 0.65)
  const sms = {
    nrp1: passedNrp1 ? iso(createdAt + between(1, 5) * HOUR) : undefined,
    nrp2: passedNrp2 ? iso(createdAt + between(24, 30) * HOUR) : undefined,
    rdv: o.statut != null ? iso(createdAt + between(30, 60) * HOUR) : undefined,
    avis: avis && factureAt !== undefined ? iso(factureAt + between(20, 30) * HOUR) : undefined,
  }
  return {
    id: `P-${idSeq++}`,
    prenom,
    nom,
    ville: pick(VILLES[centre]),
    telephone: phone(),
    email: `${slug(prenom)}.${slug(nom)}${rand() < 0.4 ? Math.floor(between(40, 75)) : ''}@${domain}`,
    age: Math.floor(between(58, 86)),
    centre,
    source: (rand() < 0.68 ? 'Facebook' : 'Instagram') as Source,
    createdAt: new Date(createdAt).toISOString(),
    etat: o.etat,
    statut: o.statut ?? null,
    pourQui: o.pourQui ?? pick(POUR_QUI),
    situation: o.situation ?? pick(SITUATIONS),
    centPourcent: o.centPourcent ?? pick(CENT),
    rappelLe: o.rappelInH !== undefined ? new Date(NOW + o.rappelInH * HOUR).toISOString() : undefined,
    rdvLe: o.rdvInH !== undefined ? new Date(NOW + o.rdvInH * HOUR).toISOString() : undefined,
    factureLe: iso(factureAt),
    essaiLe: o.essaiAgoH !== undefined ? new Date(NOW - o.essaiAgoH * HOUR).toISOString() : undefined,
    panier: o.panier ?? 2500,
    avisGoogle: avis,
    consentementLe: new Date(createdAt).toISOString(),
    sms,
    notes: (o.notes ?? []).map((n) => note(NOW - n.agoH * HOUR, n.texte)),
  }
}

/** Heure ronde dans N jours (ex : demain 10h30), exprimée en heures depuis maintenant. */
function atDay(dayOffset: number, hour: number, minute = 0) {
  const d = new Date(NOW)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return (d.getTime() - NOW) / HOUR
}
/** Rappel « aujourd'hui » : toujours dans la journée en cours, quelle que soit l'heure. */
function laterToday(fraction: number) {
  const end = new Date(NOW)
  end.setHours(23, 59, 0, 0)
  const start = new Date(NOW)
  start.setHours(0, 1, 0, 0)
  const t = start.getTime() + (end.getTime() - start.getTime()) * fraction
  return (t - NOW) / HOUR
}

/* ------------------------------------------------------------------ */
/* 1. Prospects actifs, rédigés à la main                              */
/* ------------------------------------------------------------------ */
const actifs: Prospect[] = [
  // — Nouveaux leads (6) —
  make({ centre: 'cysoing', createdAgoH: 0.3, etat: 'Nouveau lead', pourQui: 'Pour moi', situation: 'Conversations en groupe', centPourcent: 'Oui' }),
  make({ centre: 'phalempin', createdAgoH: 0.9, etat: 'Nouveau lead', pourQui: 'Pour un proche', situation: 'Télévision', centPourcent: 'Je ne sais pas' }),
  make({ centre: 'templeuve', createdAgoH: 1.6, etat: 'Nouveau lead', pourQui: 'Pour moi', situation: 'Téléphone', centPourcent: 'Oui' }),
  make({ centre: 'tourlaville', createdAgoH: 2.7, etat: 'Nouveau lead', pourQui: 'Pour moi', situation: 'Restaurant', centPourcent: 'Non' }),
  make({ centre: 'cysoing', createdAgoH: 4.2, etat: 'Nouveau lead', pourQui: 'Pour un proche', situation: 'Conversations en groupe', centPourcent: 'Oui' }),
  make({ centre: 'phalempin', createdAgoH: 7.5, etat: 'Nouveau lead', pourQui: 'Pour moi', situation: 'Acouphènes', centPourcent: 'Je ne sais pas' }),

  // — NRP 1 (4) —
  make({ centre: 'templeuve', createdAgoH: 19, etat: 'NRP 1', notes: [{ agoH: 16, texte: 'Pas de réponse, message vocal laissé.' }] }),
  make({ centre: 'cysoing', createdAgoH: 26, etat: 'NRP 1', notes: [{ agoH: 22, texte: 'Messagerie pleine. SMS envoyé avec le lien de prise de RDV.' }] }),
  make({ centre: 'tourlaville', createdAgoH: 31, etat: 'NRP 1', notes: [{ agoH: 27, texte: 'Sonne dans le vide.' }] }),
  make({ centre: 'phalempin', createdAgoH: 49, etat: 'NRP 1', notes: [{ agoH: 44, texte: 'Pas de réponse à 10h. Retenter en fin de journée.' }] }),

  // — NRP 2 (3) —
  make({ centre: 'cysoing', createdAgoH: 53, etat: 'NRP 2', notes: [{ agoH: 50, texte: '1er appel sans réponse.' }, { agoH: 26, texte: '2e appel sans réponse, vocal laissé.' }] }),
  make({ centre: 'templeuve', createdAgoH: 76, etat: 'NRP 2', notes: [{ agoH: 72, texte: 'NRP.' }, { agoH: 48, texte: 'NRP — SMS de relance envoyé.' }] }),
  make({ centre: 'tourlaville', createdAgoH: 98, etat: 'NRP 2', notes: [{ agoH: 95, texte: 'NRP.' }, { agoH: 70, texte: 'Toujours aucune réponse. Dernière tentative demain.' }] }),

  // — Relance phoning : en retard (3) —
  make({ centre: 'phalempin', createdAgoH: 6 * 24, etat: 'Relance phoning', rappelInH: atDay(-2, 10), notes: [{ agoH: 5 * 24, texte: 'Intéressée mais part en vacances. Rappeler à son retour, plutôt le matin.' }] }),
  make({ centre: 'cysoing', createdAgoH: 8 * 24, etat: 'Relance phoning', rappelInH: atDay(-1, 14, 30), notes: [{ agoH: 7 * 24, texte: 'Doit en parler à sa fille avant de prendre RDV.' }] }),
  make({ centre: 'tourlaville', createdAgoH: 4 * 24, etat: 'Relance phoning', rappelInH: atDay(-1, 17), notes: [{ agoH: 3 * 24, texte: 'Attend le retour de sa mutuelle (MGEN) pour le 100% Santé.' }] }),

  // — Relance phoning : aujourd'hui (3) —
  make({ centre: 'templeuve', createdAgoH: 3 * 24, etat: 'Relance phoning', rappelInH: laterToday(0.42), notes: [{ agoH: 2 * 24, texte: 'Rappeler vers 10h, disponible avant son kiné.' }] }),
  make({ centre: 'cysoing', createdAgoH: 5 * 24, etat: 'Relance phoning', rappelInH: laterToday(0.6), notes: [{ agoH: 4 * 24, texte: "Hésite entre nous et l'enseigne concurrente. Mettre en avant l'essai gratuit 30 jours." }] }),
  make({ centre: 'phalempin', createdAgoH: 2 * 24, etat: 'Relance phoning', rappelInH: laterToday(0.72), notes: [{ agoH: 30, texte: "Demande pour son mari (78 ans). Rappeler quand il sera présent, après 16h." }] }),

  // — Relance phoning : cette semaine (4) —
  make({ centre: 'tourlaville', createdAgoH: 2 * 24, etat: 'Relance phoning', rappelInH: atDay(1, 9, 30), notes: [{ agoH: 40, texte: 'Souhaite un RDV à Cherbourg plutôt qu’à Tourlaville. Vérifier dispo.' }] }),
  make({ centre: 'templeuve', createdAgoH: 4 * 24, etat: 'Relance phoning', rappelInH: atDay(2, 11), notes: [{ agoH: 3 * 24, texte: 'Ordonnance ORL prévue la semaine prochaine.' }] }),
  make({ centre: 'cysoing', createdAgoH: 3 * 24, etat: 'Relance phoning', rappelInH: atDay(3, 15), notes: [{ agoH: 2 * 24, texte: 'Questions sur le reste à charge classe 2. Préparer un devis indicatif.' }] }),
  make({ centre: 'phalempin', createdAgoH: 5 * 24, etat: 'Relance phoning', rappelInH: atDay(5, 10, 30), notes: [{ agoH: 4 * 24, texte: 'Rappeler après son opération de la cataracte.' }] }),

  // — Parcours : RDV pris à venir (5) —
  make({ centre: 'cysoing', createdAgoH: 3 * 24, etat: 'Nouveau lead', statut: 'RDV Pris', rdvInH: atDay(1, 10), notes: [{ agoH: 70, texte: 'RDV bilan auditif fixé. Venir avec ordonnance et carte vitale.' }] }),
  make({ centre: 'templeuve', createdAgoH: 4 * 24, etat: 'NRP 1', statut: 'RDV Pris', rdvInH: atDay(1, 14, 30) }),
  make({ centre: 'phalempin', createdAgoH: 2 * 24, etat: 'Nouveau lead', statut: 'RDV Pris', rdvInH: atDay(2, 9, 30), notes: [{ agoH: 44, texte: 'Viendra accompagnée de son fils.' }] }),
  make({ centre: 'tourlaville', createdAgoH: 6 * 24, etat: 'Relance phoning', statut: 'RDV Pris', rdvInH: atDay(3, 16) }),
  make({ centre: 'cysoing', createdAgoH: 5 * 24, etat: 'NRP 2', statut: 'RDV Pris', rdvInH: atDay(4, 11) }),
]

/* ------------------------------------------------------------------ */
/* 2. Historique généré sur 12 mois (campagnes Meta en croissance)     */
/* ------------------------------------------------------------------ */
const historique: Prospect[] = []
const NOTES_FACTURE = ['Appareillage classe 1 (100% Santé), très satisfaite.', 'Appareillage classe 2 rechargeable. Bon ressenti dès la 1re semaine.', 'Choix du modèle intra. Contrôle à 1 mois planifié.', 'Patient ravi, recommande le centre à son épouse.']
const NOTES_PERDU = ['Trouve le reste à charge trop élevé.', "N'a pas supporté les embouts, essai interrompu.", 'Est parti chez un concurrent (prix).', 'Préfère attendre l’an prochain.']
const NOTES_PAS_INT = ['Pensait que la démarche était gratuite sans conditions.', 'A déjà un audioprothésiste.', 'Ne se souvient pas avoir rempli le formulaire.', 'Pas de gêne réelle, curiosité.']

for (let dayAgo = 365; dayAgo >= 3; dayAgo--) {
  // Volume quotidien croissant : ~0,6 lead/jour il y a un an → ~1,6 aujourd'hui.
  const rate = 0.6 + (1 - dayAgo / 365) * 1.0
  let count = Math.floor(rate)
  if (rand() < rate - count) count++
  for (let i = 0; i < count; i++) {
    const createdAgoH = dayAgo * 24 - between(0, 14)
    const r = rand()
    const daysSince = createdAgoH / 24

    if (r < 0.3) {
      historique.push(make({ createdAgoH, etat: 'Pas intéressé', notes: [{ agoH: createdAgoH - 20, texte: pick(NOTES_PAS_INT) }] }))
      continue
    }
    if (r < 0.48) {
      const r2 = rand()
      if (r2 < 0.55) historique.push(make({ createdAgoH, etat: 'Clôture', notes: [{ agoH: createdAgoH - 80, texte: '3 tentatives sans réponse, dossier clôturé.' }] }))
      else if (r2 < 0.72) historique.push(make({ createdAgoH, etat: 'Hors zone', notes: [{ agoH: createdAgoH - 4, texte: 'Habite à plus de 40 km du centre le plus proche.' }] }))
      else if (r2 < 0.88) historique.push(make({ createdAgoH, etat: 'Faux numéro', notes: [{ agoH: createdAgoH - 2, texte: 'Numéro non attribué.' }] }))
      else historique.push(make({ createdAgoH, etat: 'Doublon', notes: [{ agoH: createdAgoH - 1, texte: 'Formulaire déjà rempli le mois dernier, fiche fusionnée.' }] }))
      continue
    }

    // A obtenu un RDV : on avance dans le parcours selon le temps écoulé.
    const etatAvant = pick<EtatProspect>(['Nouveau lead', 'Nouveau lead', 'NRP 1', 'NRP 2', 'Relance phoning'])
    const rdvAfterD = between(2, 9)
    const rdvAgoD = daysSince - rdvAfterD
    if (rdvAgoD < 0) {
      // RDV pas encore passé : déjà couvert par les prospects actifs.
      historique.push(make({ createdAgoH, etat: 'Pas intéressé' }))
      continue
    }
    const rdvInH = -rdvAgoD * 24
    const outcome = rand()
    if (outcome < 0.12) {
      historique.push(make({ createdAgoH, etat: 'Clôture', statut: 'RDV Réalisé', rdvInH, notes: [{ agoH: rdvAgoD * 24 - 2, texte: 'Bilan réalisé : perte légère, pas d’appareillage nécessaire pour le moment.' }] }))
      continue
    }
    if (rdvAgoD < 4) {
      historique.push(make({ createdAgoH, etat: etatAvant, statut: 'RDV Réalisé', rdvInH, notes: [{ agoH: rdvAgoD * 24 - 1, texte: 'Bilan réalisé. Devis remis, en attente de validation mutuelle.' }] }))
      continue
    }
    const essaiDuree = between(21, 30)
    const essaiAgoH = (rdvAgoD - 1) * 24
    if (rdvAgoD < essaiDuree) {
      historique.push(make({ createdAgoH, etat: etatAvant, statut: 'Essai', rdvInH, essaiAgoH, notes: [{ agoH: rdvAgoD * 24 - 24, texte: `Mise en essai ${pick(['classe 1', 'classe 2', 'rechargeable', 'RIC'])}. Contrôle prévu à J+15.` }] }))
      continue
    }
    if (outcome < 0.82) {
      const factureAgoH = (rdvAgoD - essaiDuree) * 24
      historique.push(make({ createdAgoH, etat: etatAvant, statut: 'Facturé', rdvInH, factureAgoH, essaiAgoH, panier: pick([2500, 2500, 2500, 2500, 1980, 3190, 3600]), notes: [{ agoH: factureAgoH, texte: pick(NOTES_FACTURE) }] }))
    } else {
      historique.push(make({ createdAgoH, etat: 'Clôture', statut: 'Essai', rdvInH, essaiAgoH, notes: [{ agoH: (rdvAgoD - essaiDuree) * 24, texte: pick(NOTES_PERDU) }] }))
    }
  }
}

export const INITIAL_PROSPECTS: Prospect[] = [...actifs, ...historique].sort(
  (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
)
