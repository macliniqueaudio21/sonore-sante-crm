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

## 3 architectures de design

Un sélecteur discret (en bas à droite) change la structure **et** le style de toute l'application :

1. **Épuré Blanc & Vert** (par défaut) : sidebar blanche fine (220 px), fond #F8FAFC, accent unique #059669.
2. **Pleine Largeur** : plus de sidebar, navigation horizontale de 64 px en haut, contenu sur toute la largeur, accent #047857.
3. **Minimaliste Suisse** : ultra-plat, sans ombres, bordures 1 px #E4E4E7, typographie plus petite.

Les badges sont monochromes, avec un petit point de couleur pour le statut. Les jetons de chaque design
(accent, bordures, ombres, rayons, gris) sont dans `src/index.css` ; la structure (sidebar ou barre du haut)
et les couleurs des graphiques sont dans `src/design.tsx`. Le choix est mémorisé dans le navigateur.

Les modifications (changement d'état, RDV, notes…) sont gardées en mémoire et réinitialisées au rechargement de la page.
