# CRM SaaS - Application de Gestion Commerciale

Une application CRM moderne et complète construite avec Next.js, TypeScript, et Tailwind CSS.

## 🚀 Fonctionnalités

### 📊 Tableau de Bord
- Vue d'ensemble des performances commerciales
- Graphiques interactifs du chiffre d'affaires
- Pipeline commercial avec visualisation
- Statistiques clés en temps réel

### 👥 Gestion des Clients
- **CRUD complet** : Créer, lire, modifier, supprimer des clients
- **Informations détaillées** : Nom, email, téléphone, entreprise, secteur
- **Suivi du CA** : Chiffre d'affaires total généré par client
- **Recherche avancée** : Filtres rapides et recherche multi-critères

### 📋 Gestion des Devis
- **Pipeline commercial** : Suivi des statuts (En cours, Gagné, Perdu)
- **Informations complètes** : Titre, montant, date d'échéance, description
- **Association client** : Lien direct avec les fiches clients

### 📈 Dashboard Analytics
- **Graphiques CA vs Objectif** : Suivi mensuel des performances
- **Pipeline visuel** : Répartition des devis par statut
- **Taux de conversion** : Métriques de performance
- **Dernières activités** : Vue rapide des clients et devis récents

### 📤 Export de Données
- Export CSV/Excel des listes clients
- Inclusion des statistiques et informations de contact

### 🎨 Interface Utilisateur
- **Design moderne** : Interface épurée avec Shadcn/UI
- **Navigation latérale** : Menu intuitif et accessible
- **Mode sombre/clair** : Adaptation aux préférences utilisateur
- **Responsive** : Utilisation optimale sur mobile et desktop

## 🛠️ Stack Technique

- **Frontend** : Next.js 14, React 18, TypeScript
- **Styling** : Tailwind CSS, Shadcn/UI
- **Base de données** : SQLite avec Prisma ORM
- **Graphiques** : Recharts
- **Icons** : Lucide React
- **Formulaires** : React Hook Form avec Zod validation

## 📋 Structure du Projet

```
src/
├── app/                    # Pages Next.js
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx          # Dashboard
│   └── clients/          # Pages clients
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   ├── app-sidebar.tsx   # Barre latérale
│   └── dashboard.tsx     # Dashboard
├── lib/                  # Utilitaires
│   ├── utils.ts          # Fonctions helpers
│   └── prisma.ts         # Client Prisma
└── prisma/               # Schéma base de données
    └── schema.prisma     # Modèles de données
```

## 🗄️ Schéma de la Base de Données

### Clients
- `id`, `nom`, `email`, `telephone`, `entreprise`, `secteur`
- `dateCreation`, `caTotal`

### Interactions
- `id`, `clientId`, `type` (appel/rdv/note/email)
- `contenu`, `date`

### Devis
- `id`, `clientId`, `titre`, `montant`
- `statut` (en_cours/gagne/perdu), `dateEcheance`
- `description`, `dateCreation`

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd crm-saas-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer la base de données**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

5. **Ouvrir le navigateur**
   ```
   http://localhost:3000
   ```

## 📱 Utilisation

### Navigation
- **Tableau de bord** : Vue d'ensemble et statistiques
- **Clients** : Gestion de la base de données clients
- **Devis** : Suivi du pipeline commercial
- **Pipeline** : Visualisation des opportunités

### Gestion des Clients
1. Cliquez sur "Nouveau client" pour ajouter un contact
2. Utilisez la barre de recherche pour filtrer rapidement
3. Cliquez sur l'œil pour voir les détails d'un client
4. Utilisez les icônes d'édition/suppression pour gérer les fiches

### Dashboard
- Consultez les graphiques de performance
- Suivez le taux de conversion
- Visualisez le pipeline commercial
- Accédez rapidement aux dernières activités

## 🔧 Développement

### Scripts disponibles
- `npm run dev` : Serveur de développement
- `npm run build` : Build de production
- `npm run start` : Serveur de production
- `npm run lint` : Linter TypeScript

### Base de données
- `npx prisma studio` : Interface de gestion BDD
- `npx prisma migrate dev` : Appliquer les migrations
- `npx prisma generate` : Générer le client Prisma

## 🎯 Roadmap

### Fonctionnalités à venir
- [ ] Système d'utilisateurs et rôles
- [ ] Notifications et rappels automatiques
- [ ] Intégration email (envoi de devis)
- [ ] API REST pour intégrations externes
- [ ] Tableaux de bord personnalisables
- [ ] Rapports avancés et export PDF

### Améliorations techniques
- [ ] Tests unitaires et E2E
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring et analytics
- [ ] Optimisation des performances

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ pour les équipes commerciales modernes**
