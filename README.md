# Social Media Manager Backend API

Backend API en **TypeScript + Fastify**, conçu pour orchestrer les interactions avec plusieurs réseaux sociaux dans un outil de gestion centralisé.  
Il est **appelé exclusivement depuis Xano**, qui gère la base de données, les tokens et les utilisateurs.  
🎯 Objectif : fournir une API modulaire, scalable et sécurisée **centrée sur les workspaces**, permettant la publication, la messagerie et la collecte de statistiques sociales.

---

## 🏗️ Architecture

### 🧩 Principe Central : *Workspace-first*
- **Toutes les actions sont liées à un workspace**, jamais directement à un utilisateur.
- Un même utilisateur peut gérer plusieurs workspaces.
- Les autorisations et les ressources sont isolées par workspace.

### 🔗 Intégration Xano
- Xano gère : utilisateurs, tokens, permissions, logs, base de données principale.
- Le backend se contente de **traiter les requêtes** et **communiquer avec les APIs sociales**.
- **Aucune donnée sensible** n’est stockée localement.

### 🧱 Structure Modulaire

```
src/
├── services/social-networks/     # Un dossier par réseau (Facebook, Instagram, etc.)
│   └── base/                     # Services abstraits pour standardiser les actions
├── controllers/                  # Logique métier (posting, messaging, stats)
├── routes/                       # Définition des endpoints
└── plugins/                      # Intégrations externes (Xano, PostgreSQL, etc.)
```

---

## 🔄 Fonctionnalités par Domaine

### 1. 📬 Posting

- `POST /api/posting` – Créer un post  
- `PUT /api/posting` – Modifier un post  
- `DELETE /api/posting/{workspace_id}/{channel_id}/{post_id}` – Supprimer un post  
- `GET /api/posting/{workspace_id}/{channel_id}` – Lister les posts  

### 2. 💬 Messaging

- `POST /api/messaging` – Envoyer un message privé  
- `GET /api/messaging/{workspace_id}/{channel_id}` – Lister les messages  
- `PUT /api/messaging/{workspace_id}/{channel_id}/{message_id}/read` – Marquer comme lu  

### 3. 📊 Statistiques *(via PostgreSQL uniquement)*

- `POST /api/stats/workspace/{workspace_id}` – Stats globales  
- `POST /api/stats/workspace/{workspace_id}/channel/{channel_id}` – Stats d’un canal  
- `POST /api/stats/workspace/{workspace_id}/channel/{channel_id}/collect` – Déclenche collecte  
- `GET /api/stats/workspace/{workspace_id}/channel/{channel_id}/post/{post_id}` – Stats d’un post  

> Chaque **métrique du dashboard** doit avoir un **endpoint dédié**, ajoutable dynamiquement.

---

## 📈 Statistiques & Collecte (PostgreSQL)

### 🔢 Table centrale : `metrics`

```sql
metrics (
  id SERIAL PRIMARY KEY,
  workspace_id UUID,
  channel_id UUID,
  platform TEXT,
  post_id TEXT,
  metric_type TEXT,
  value INTEGER,
  metadata JSONB,
  collected_at TIMESTAMP,
  post_created_at TIMESTAMP
)
```

### 🧠 Règles de collecte intelligente (ex. Facebook)

```ts
const facebookRules: StatsCollectionRule[] = [
  {
    post_age_hours: 0,
    collection_frequency_minutes: 30,
    max_collections: 48,
    metrics_to_collect: ['likes', 'comments', 'shares', 'views']
  },
  {
    post_age_hours: 24,
    collection_frequency_minutes: 120,
    max_collections: 84,
    metrics_to_collect: ['likes', 'comments', 'shares']
  },
  {
    post_age_hours: 168,
    collection_frequency_minutes: 1440,
    max_collections: 30,
    metrics_to_collect: ['likes', 'comments']
  }
];
```

### ➕ Ajouter un Endpoint Statistique

1. Étendre `MetricType` dans `src/types/metrics.ts`
2. Ajouter la route dans `src/routes/stats/index.ts`
3. Implémenter la logique dans `src/controllers/stats.controller.ts`
4. Brancher dans le service réseau concerné

**Exemple :**

```ts
fastify.get('/workspace/:workspace_id/conversion-rate', {
  schema: {
    params: Type.Object({
      workspace_id: Type.String()
    }),
    querystring: Type.Object({
      period_days: Type.Number({ minimum: 1, maximum: 365 })
    })
  }
}, statsController.getConversionRate);
```

---

## 🚀 Installation & Lancement

```bash
# Installation des dépendances
npm install

# Config .env
cp .env.example .env
# Modifier les variables nécessaires

# Migration PostgreSQL
npm run migrate

# Lancer en développement
npm run dev

# Lancer en production
npm run build
npm start
```

---

## 🌐 Ajout d’un Réseau Social

1. Créer le dossier : `src/services/social-networks/tiktok/`
2. Implémenter :
   - `tiktok.posting.service.ts` *(étend BasePostingService)*
   - `tiktok.messaging.service.ts` *(étend BaseMessagingService)*
   - `tiktok.stats.service.ts` *(étend BaseStatsService)*
3. Ajouter le type dans `src/types/channel.ts`
4. Définir les credentials dans `CredentialConfig`
5. Mettre à jour la factory des services

---

## 🛡️ Sécurité

- Middleware de validation du `workspace_id`
- Rate limiting intégré
- Sécurisation des headers avec Helmet
- Aucun stockage local de tokens
- Centralisation des logs dans Xano

---

## 📊 Monitoring & Logs

- Logs structurés via [Pino](https://getpino.io/)
- Activités trackées dans Xano
- Gestion d’erreurs détaillées avec contexte
- Métriques de performance stockées en PostgreSQL

---

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Rapport de couverture
npm run test:coverage
```

---

## 📚 Documentation API

Une documentation Swagger est disponible sur `/docs` en mode développement (à activer via plugin Swagger).

---

> Cette architecture est pensée pour être **scalable**, **maintenable** et **modulaire**, afin d’intégrer de nouveaux réseaux sociaux et de nouvelles métriques sans refonte.
