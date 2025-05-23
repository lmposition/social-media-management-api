# Social Media Management API

API backend TypeScript pour outil de gestion de réseaux sociaux avec intégration Xano.

## 🎯 Vue d'ensemble

Cette API fournit une base scalable pour gérer plusieurs réseaux sociaux de manière unifiée. Elle s'intègre avec Xano pour la persistance des données et peut facilement accueillir de nouveaux réseaux sociaux.

## 📋 Fonctionnalités principales

### 🚀 Architecture modulaire
- **Séparation claire** : Chaque réseau social dans un module séparé
- **Extensible** : Ajout facile de nouveaux réseaux
- **Type-safe** : TypeScript avec interfaces strictes

### 🔧 Trois fonctionnalités core par réseau
1. **Posting** : Publication, suppression, édition de posts
2. **Messaging** : Gestion des messages privés (si supporté)
3. **Statistics** : Récupération intelligente des statistiques

### 🗄️ Intégration Xano
- **Base de données** entièrement gérée par Xano
- **Tokens d'accès** stockés de manière sécurisée
- **Aucune donnée sensible** en local

## 🏗️ Architecture

```
social-media-management-api/
├── src/
│   ├── index.ts                     # Point d'entrée
│   ├── app.ts                       # Configuration Express
│   ├── config/                      # Configuration Xano & environnement
│   ├── interfaces/                  # Types TypeScript communes
│   ├── services/                    # Services Xano & base réseaux
│   ├── controllers/                 # Contrôleurs API
│   ├── routes/                      # Routes Express
│   ├── middleware/                  # Auth, validation, erreurs
│   ├── utils/                       # Logger, erreurs, validators
│   └── networks/                    # 🔮 Modules réseaux (futurs)
├── tests/                           # Tests unitaires & intégration
└── logs/                           # Fichiers de logs
```

## 🚦 Endpoints API

### Posting
```
POST   /api/posting/:accountId           # Publier un post
DELETE /api/posting/posts/:postId        # Supprimer un post
PUT    /api/posting/posts/:postId        # Éditer un post
GET    /api/posting/:accountId/posts     # Posts du compte
GET    /api/posting/posts/:postId        # Post spécifique
```

### Messaging
```
POST   /api/messaging/:accountId         # Envoyer un message
GET    /api/messaging/:accountId/messages # Messages du compte
PUT    /api/messaging/messages/:messageId/read # Marquer comme lu
POST   /api/messaging/:accountId/sync    # Synchroniser messages
```

### Statistics
```
GET    /api/statistics/posts/:postId     # Stats d'un post
GET    /api/statistics/accounts/:accountId # Stats d'un compte
POST   /api/statistics/accounts/:accountId/sync # Sync stats
```

## 🛠️ Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Instance Xano configurée

### Setup
```bash
# Cloner le projet
git clone <repo-url>
cd social-media-management-api

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres Xano

# Créer le dossier logs
mkdir logs

# Lancer en développement
npm run dev
```

### Variables d'environnement requises
```env
XANO_API_URL=https://your-xano-instance.com/api:endpoint
XANO_API_KEY=your-xano-api-key
```

## 📝 Scripts disponibles

```bash
npm run dev          # Développement avec hot-reload
npm run build        # Build production
npm run start        # Lancer en production
npm test             # Tests
npm run lint         # Linting
npm run lint:fix     # Fix linting
```

## 🔐 Authentification

L'API utilise des tokens Bearer pour l'authentification :

```http
Authorization: Bearer your-xano-token
```

## 📊 Gestion des statistiques

### Règles de récupération intelligente
La fréquence de récupération des statistiques dépend de l'âge du post :

- **Posts < 1h** : Toutes les 5 minutes
- **Posts 1-24h** : Toutes les 30 minutes  
- **Posts 1-7 jours** : Toutes les 2 heures
- **Posts 7-30 jours** : Toutes les 12 heures
- **Posts > 30 jours** : Une fois par jour

*Ces règles seront personnalisées pour chaque réseau social lors de leur implémentation.*

## 🌐 Ajout de nouveaux réseaux sociaux

### Structure requise
Chaque réseau doit être implémenté dans un module séparé :

```typescript
// src/networks/[reseau]/[reseau].service.ts
export class ReseauService extends BaseNetworkService {
  constructor() {
    super(SocialNetworkType.RESEAU, {
      posting: { enabled: true, /* ... */ },
      messaging: { enabled: false, /* ... */ },
      statistics: { enabled: true, /* ... */ }
    });
  }

  // Implémenter toutes les méthodes abstraites
  async publishPost(account, request) { /* ... */ }
  async deletePost(account, postId) { /* ... */ }
  // ... autres méthodes
}
```

### Enregistrement
```typescript
// src/networks/index.ts
import { networkRegistry } from '../services/base-network.service';
import { ReseauService } from './reseau/reseau.service';

export const initializeNetworkServices = () => {
  networkRegistry.register(new ReseauService());
};
```

## 📋 Réseaux sociaux supportés

**Actuellement : Aucun** *(Structure prête pour l'implémentation)*

**Prévus :**
- Facebook
- Instagram  
- Twitter/X
- LinkedIn
- TikTok
- YouTube
- Pinterest

## 🔧 Structure des données

### Post
```typescript
interface Post {
  id: string;
  networkType: SocialNetworkType;
  accountId: string;
  content: PostContent;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  networkPostId?: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  networkType: SocialNetworkType;
  conversationId: string;
  content: MessageContent;
  isIncoming: boolean;
  isRead: boolean;
  sentAt: Date;
}
```

### Statistiques
```typescript
interface PostStatistics {
  postId: string;
  metrics: PostMetrics;
  lastUpdated: Date;
}

interface PostMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  // ... autres métriques
}
```

## 🛡️ Sécurité

### Mesures implémentées
- **Rate limiting** : 100 requêtes/15min par IP
- **Helmet** : Headers de sécurité
- **CORS** : Origines configurables
- **Validation** : Joi pour toutes les entrées
- **Logging** : Winston avec rotation des logs

### Gestion des erreurs
```typescript
// Types d'erreurs personnalisées
ValidationError (400)
AuthenticationError (401)
NotFoundError (404)
NetworkError (502)
XanoServiceError (503)
```

## 📈 Monitoring & Logs

### Endpoints de santé
```
GET /health              # Status serveur
GET /api/               # Info API
GET /api/status         # Status services réseaux
```

### Logs
- **error.log** : Erreurs uniquement
- **combined.log** : Tous les logs
- **Console** : En développement seulement

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests d'intégration
npm run test:integration
```

Structure des tests :
```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/
│   └── api/
└── setup.ts
```

## 📚 Documentation API

Une fois démarré, l'API expose des informations sur ses endpoints :

```bash
curl http://localhost:3000/api
```

## 🚀 Déploiement

### Production
```bash
# Build
npm run build

# Variables d'environnement
export NODE_ENV=production
export XANO_API_URL=your-production-url
export XANO_API_KEY=your-production-key

# Lancer
npm start
```

### Docker (optionnel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["npm", "start"]
```

## 🔄 Règles de développement

### Directives non négociables
1. **Séparation modulaire** : Chaque réseau dans un fichier séparé
2. **Scalabilité** : Architecture extensible et maintenable
3. **Sécurité** : Aucune donnée sensible en local
4. **Xano-first** : Toute persistance via Xano

### Standards de code
- **TypeScript strict** : Types explicites partout
- **ESLint** : Code standardisé
- **Joi validation** : Validation robuste des entrées
- **Error handling** : Gestion d'erreurs cohérente
- **Logging** : Traçabilité complète

## 🤝 Contribution

### Workflow
1. Créer une branche pour le nouveau réseau
2. Implémenter selon `src/networks/README.md`
3. Ajouter les tests correspondants
4. Mettre à jour la documentation
5. Créer une PR

### Checklist pour nouveau réseau
- [ ] Service qui étend `BaseNetworkService`
- [ ] Toutes les méthodes abstraites implémentées
- [ ] Capacités correctement définies
- [ ] Tests unitaires et d'intégration
- [ ] Documentation des spécificités
- [ ] Enregistrement dans le registry

## 📞 Support

Pour toute question sur cette base d'API :
1. Consulter le `src/networks/README.md` pour l'ajout de réseaux
2. Vérifier les logs dans le dossier `logs/`
3. Tester les endpoints de santé

## 🔮 Roadmap

### Phase 1 : Base (✅ Terminée)
- [x] Architecture modulaire
- [x] Intégration Xano
- [x] API REST complète
- [x] Système d'authentification
- [x] Gestion d'erreurs
- [x] Logging et monitoring

### Phase 2 : Premiers réseaux
- [ ] Facebook/Meta
- [ ] Instagram
- [ ] Twitter/X

### Phase 3 : Fonctionnalités avancées
- [ ] Webhooks pour synchronisation temps réel
- [ ] Système de cache Redis
- [ ] Métriques Prometheus
- [ ] Rate limiting avancé par réseau

### Phase 4 : Réseaux additionnels
- [ ] LinkedIn
- [ ] TikTok
- [ ] YouTube
- [ ] Pinterest

## 🏷️ Versions

**v1.0.0** - Structure de base
- API complète sans réseaux implémentés
- Prêt pour ajout modulaire des réseaux
- Documentation complète