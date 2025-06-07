# NCORP Launcher

Un lanceur de jeux moderne et élégant développé avec SvelteKit en front avec un back en C# ASPNET Core, conçu pour gérer et lancer des jeux depuis une interface web intuitive.

## 🎮 Aperçu du Projet

NCORP Launcher est une application web de gestion de jeux qui permet aux utilisateurs de :

- **Découvrir** et parcourir une bibliothèque de jeux disponibles
- **Installer** et gérer des jeux localement
- **Lancer** des jeux directement depuis l'interface
- **Suivre** le temps de jeu et les statistiques
- **Communiquer** avec d'autres utilisateurs en temps réel
- **Administrer** la plateforme (pour les administrateurs)

## 🏗️ Architecture

Le projet suit une architecture client-serveur avec trois composants principaux :

### Frontend (SvelteKit)

- Interface utilisateur moderne avec Tailwind CSS
- Authentification avec Better Auth
- Communication temps réel via SignalR
- Gestion d'état réactive avec Svelte 5
- Interface responsive et thèmes adaptatifs

### Agent Local

- Service local pour la gestion des jeux installés
- Installation et désinstallation de jeux
- Surveillance des processus de jeux
- Communication avec le serveur principal

### Serveur Principal (Backend C# ASPNET Core)

- API REST pour la gestion des jeux et utilisateurs
- Hub SignalR pour broadcaster les événements aux joueurs
- Gestion des utilisateurs
- Coordination entre les clients

## 🚀 Fonctionnalités

### Pour les Utilisateurs

- **Bibliothèque de jeux** : Parcourir et rechercher dans le catalogue de jeux
- **Installation simplifiée** : Installer des jeux en un clic avec suivi de progression
- **Lancement rapide** : Démarrer des jeux directement depuis l'interface
- **Gestion des répertoires** : Configurer où installer les jeux
- **Profil utilisateur** : Gérer son compte et ses préférences
- **Temps de jeu** : Suivre le temps passé sur chaque jeu
- **Chat en temps réel** : Communiquer avec les autres utilisateurs connectés

### Pour les Administrateurs

- **Gestion des jeux** : Ajouter, modifier et supprimer des jeux du catalogue
- **Gestion des utilisateurs** : Administrer les comptes utilisateurs
- **Configuration système** : Gérer les paramètres globaux
- **Liens personnalisés** : Ajouter des liens dans la sidebar
- **Statistiques** : Voir les métriques d'utilisation

## 🛠️ Technologies Utilisées

### Frontend

- **SvelteKit** - Framework web moderne
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI
- **Better Auth** - Système d'authentification
- **SignalR** - Communication temps réel
- **Prisma** - ORM pour la base de données

### Backend

- **Node.js** - Runtime JavaScript
- **MySQL** - Base de données relationnelle
- **OpenAPI** - Génération automatique d'API
- **WebSockets** - Communication bidirectionnelle

### Outils de Développement

- **Vite** - Bundler et serveur de développement
- **ESLint** - Linter JavaScript/TypeScript
- **Prettier** - Formateur de code
- **Bun** - Gestionnaire de paquets et runtime

## 📦 Installation

### Prérequis

- Node.js 18+ ou Bun
- MySQL
- Git

### Configuration

1. **Cloner le projet**

```bash
git clone <url-du-repo>
cd ncorp.launcher
```

2. **Installer les dépendances**

```bash
bun install
# ou
npm install
```

3. **Configuration de l'environnement**

```bash
# Copier les fichiers d'environnement
cp .env.development.example .env.development
cp .env.production.example .env.production

# Configurer les variables d'environnement
# - Base de données MySQL
# - URLs des APIs (serveur et agent)
# - Clés d'authentification
```

4. **Configuration de la base de données**

```bash
# Appliquer les migrations Prisma
bunx prisma migrate dev

# Générer le client Prisma
bunx prisma generate
```

5. **Générer les modèles API**

```bash
# Générer les clients API depuis les spécifications OpenAPI
bun run genall
```

## 🚀 Développement

### Lancer le serveur de développement

```bash
bun run dev
# ou
npm run dev

# Ouvrir automatiquement dans le navigateur
bun run dev -- --open
```

L'application sera disponible sur `http://localhost:5173`

### Scripts disponibles

- `dev` - Serveur de développement avec hot reload
- `build` - Build de production
- `preview` - Prévisualiser le build de production
- `check` - Vérification TypeScript et Svelte
- `lint` - Vérification du code avec ESLint
- `format` - Formatage du code avec Prettier

### Génération des APIs

```bash
# Générer les modèles partagés
bun run genmodels

# Générer l'API serveur
bun run genserver

# Générer l'API agent
bun run genagent

# Générer toutes les APIs
bun run genall
```

## 🏭 Production

### Build de production

```bash
bun run build
```

### Déploiement

```bash
bun run start
```

L'application utilise l'adaptateur Node.js de SvelteKit pour le déploiement.

## 🗃️ Structure du Projet

```
ncorp.launcher/
├── src/
│   ├── lib/                 # Bibliothèques et utilitaires
│   │   ├── api/            # Clients API générés
│   │   ├── auth/           # Système d'authentification
│   │   ├── components/     # Composants Svelte
│   │   ├── states/         # Gestion d'état global
│   │   └── stores/         # Stores Svelte
│   ├── routes/             # Pages et routes SvelteKit
│   └── server/             # Code serveur
├── prisma/                 # Schéma et migrations de base de données
├── static/                 # Assets statiques
└── voice_server/           # Serveur vocal (MediaSoup)
```

## 🎨 Interface Utilisateur

L'interface propose :

- **Mode sombre/clair** avec basculement automatique
- **Sidebar collapsible** pour une navigation optimale
- **Grille de jeux** avec aperçus et informations détaillées
- **Chat en temps réel** avec les utilisateurs connectés
- **Interface d'administration** complète
- **Notifications** toast pour les actions utilisateur

## 📱 Fonctionnalités Avancées

- **PWA** - Installation comme application native
- **Service Worker** - Fonctionnement hors ligne partiel
- **Notifications** - Alertes système pour les événements importants
- **Synchronisation temps réel** - État des jeux et utilisateurs
- **Gestion des événements** - Système d'événements communautaires

## 📄 Licence

Ce projet est sous licence privée. Tous droits réservés.

## 🆘 Support

Pour toute question ou problème :

- Créer une issue sur le repository
- Contacter l'équipe de développement
- Consulter la documentation technique interne

---

**NCORP Launcher** - Votre plateforme de jeux nouvelle génération 🎮
