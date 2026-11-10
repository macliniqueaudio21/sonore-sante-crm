# Sonore Santé — CRM Espace Partenaire

Prototype visuel interactif du CRM SaaS **Sonore Santé** destiné aux audioprothésistes
(frontend uniquement, données fictives pré-remplies, aucune base de données).

**Stack :** Vite · React 18 · TypeScript · Tailwind CSS v4 · lucide-react · Recharts

## Démarrer

```bash
npm install
npm run dev
```

`npm run build` vérifie les types et produit le build de production dans `dist/`.

## Structure

```
src/
  data/        types, constantes (centres, états, statuts), données fictives (mock.ts)
  store.tsx    état global (prospects, centre sélectionné, vue, modales, toasts)
  components/  Sidebar + sélecteur de centre, UI (cartes, badges…), fiche prospect, modales RDV / relance
  views/       Tableau de Bord, Suivi des Prospects (Kanban), Relance Phoning,
               Parcours Patient, Tous les Prospects, Facturation, Support
```

## Règles métier du prototype

- **Navigation** : « Tableau de Bord » (vue Groupe), puis un accordéon par centre (tableau de bord, suivi des prospects,
  relance phoning, parcours patient) avec pastilles d'alerte rouge (nouveaux leads) et ambre (relances dues),
  puis « Tous les Prospects » (filtre par centre).
- **État Prospect** : Nouveau lead, NRP 1, NRP 2, Relance phoning, RDV fixé, Pas intéressé, Hors zone, Faux numéro, Doublon, Clôture.
- **Statut Suivi Patient** : (Vide), En attente, Pas venu, En essai, Facturé, Non appareillable, Échec d'appareillage.
- **Kanban** : prospects en Nouveau lead / NRP 1 / NRP 2 sans statut patient. Ancienneté en rouge au-delà de 2 h (nouveaux leads).
- **Relance Phoning** : prospects en « Relance phoning » sans statut patient, classés selon la date de rappel.
- **Parcours Patient** : prospects ayant un statut patient. Le montant facturé et la demande d'avis Google
  n'apparaissent qu'à partir de « En essai ».
- **CA** : somme des montants facturés des patients au statut « Facturé ».
- **Confidentialité** : aucune source publicitaire n'est affichée ; l'email est conservé dans les données
  (automatisations) mais n'est jamais affiché, cherchable ni exporté.

Thème unique « Forêt & Blanc » (jetons dans `src/index.css`).

Les modifications (changement d'état, RDV, notes…) sont gardées en mémoire et réinitialisées au rechargement de la page.
