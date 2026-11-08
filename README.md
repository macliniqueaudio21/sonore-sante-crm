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

- **Kanban** : uniquement les prospects à l'état « Nouveau lead », « NRP 1 » ou « NRP 2 » **et** sans statut suivi patient.
  Badge d'ancienneté rouge au-delà de 2 h.
- **Relance Phoning** : prospects à l'état « Relance phoning » sans statut patient, classés selon la date de rappel.
- **Parcours Patient** : prospects ayant un statut suivi patient (RDV Pris → RDV Réalisé → Essai en cours → Facturé / Non appareillé).
- **CA** : chaque patient « Facturé » compte 2 500 €.
- Le sélecteur de centre filtre toute l'application (vues, KPI, badges du menu).

Les modifications (changement d'état, RDV, notes…) sont gardées en mémoire et réinitialisées au rechargement de la page.
