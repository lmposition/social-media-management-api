
# 🌐 Guide : Ajouter un Nouveau Réseau Social

> Guide complet pour intégrer une nouvelle plateforme dans le **Social Media Manager Backend**

---

## 📋 Vue d'Ensemble

L'architecture modulaire du backend permet d'ajouter facilement de nouveaux réseaux sociaux.  
Chaque plateforme suit le même pattern avec 3 services principaux :

- **PostingService** : Gestion des publications  
- **MessagingService** : Gestion des messages privés  
- **StatsService** : Collecte des métriques/analytics  

---

## 🎯 Exemple Complet : Ajouter Instagram

### 🧩 Étape 1 : Configuration des Types

Fichier : `src/types/channel.ts`

```ts
export type SocialPlatform = 
  | 'linkedin'
  | 'instagram'  // ✅ Nouveau
  | 'facebook'
  | 'twitter'
  | 'tiktok';

export interface CredentialConfig {
  instagram: {
    ACCESS_TOKEN: string;
    BUSINESS_ACCOUNT_ID: string;
    FACEBOOK_PAGE_ID: string;
    expires_at: string;
  };
}
```

---

### 🌱 Étape 2 : Variables d'Environnement

Fichier : `.env`

```env
# Instagram API (via Facebook Graph API)
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=https://your-app.com/auth/instagram/callback
```

---

### 📤 Étape 3 : Créer le Service Posting

Fichier : `src/services/social-networks/instagram/instagram.posting.service.ts`  
[Code complet inclus dans le fichier original]

---

### 📈 Étape 4 : Créer le Service Stats

Fichier : `src/services/social-networks/instagram/instagram.stats.service.ts`  
[Code complet inclus dans le fichier original]

---

### 💬 Étape 5 : Créer le Service Messaging

Fichier : `src/services/social-networks/instagram/instagram.messaging.service.ts`  
[Code complet inclus dans le fichier original]

---

### 🛠️ Étape 6 : Ajouter les Règles de Collecte

SQL :

```sql
INSERT INTO metrics.collection_rules (
    platform, rule_name, post_age_hours_min, post_age_hours_max, 
    collection_frequency_minutes, metrics_to_collect, max_collections, priority
) VALUES 
-- Instagram : Engagement rapide puis déclin
('instagram', 'post_0_1h', 0, 1, 5, '["likes", "comments", "views", "reach", "impressions"]', 12, 1),
('instagram', 'post_1_6h', 1, 6, 30, '["likes", "comments", "views", "reach", "impressions"]', 10, 2),
('instagram', 'post_6_24h', 6, 24, 60, '["likes", "comments", "views", "reach"]', 18, 3),
('instagram', 'post_1_7d', 24, 168, 240, '["likes", "comments", "views"]', 42, 4),
('instagram', 'post_7_30d', 168, 720, 1440, '["likes", "comments"]', 23, 5),
('instagram', 'post_30d_plus', 720, NULL, 10080, '["likes"]', NULL, 6);
```

---

### 🏭 Étape 7 : Mettre à Jour la Factory

Fichier : `src/services/social-networks/factory.ts`

```ts
import { InstagramPostingService } from './instagram/instagram.posting.service.js';
import { InstagramStatsService } from './instagram/instagram.stats.service.js';
import { InstagramMessagingService } from './instagram/instagram.messaging.service.js';

export class SocialNetworkServiceFactory {
  static createPostingService(channel: Channel): BasePostingService {
    switch (channel.platform) {
      case 'linkedin':
        return new LinkedInPostingService(channel);
      case 'instagram':
        return new InstagramPostingService(channel);
      default:
        throw new Error(`Posting service not implemented for platform: ${channel.platform}`);
    }
  }

  static createStatsService(channel: Channel): BaseStatsService {
    switch (channel.platform) {
      case 'linkedin':
        return new LinkedInStatsService(channel);
      case 'instagram':
        return new InstagramStatsService(channel);
      default:
        throw new Error(`Stats service not implemented for platform: ${channel.platform}`);
    }
  }

  static createMessagingService(channel: Channel): BaseMessagingService {
    switch (channel.platform) {
      case 'linkedin':
        return new LinkedInMessagingService(channel);
      case 'instagram':
        return new InstagramMessagingService(channel);
      default:
        throw new Error(`Messaging service not implemented for platform: ${channel.platform}`);
    }
  }
}
```

---

### 🧪 Étape 8 : Mettre à Jour les Contrôleurs

Fichier : `src/controllers/posting.controller.ts`

```ts
import { SocialNetworkServiceFactory } from '../services/social-networks/factory.js';

export class PostingController {
  async createPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      const result = await postingService.createPost(postData as PostData);
    } catch (error) {
      // gestion d'erreurs
    }
  }
}
```

---

## ✅ Checklist Rapide

### 🔍 Préparation
- [ ] Lire la doc de l’API cible  
- [ ] Créer un compte développeur  
- [ ] Lister les fonctionnalités supportées  
- [ ] Définir les règles de collecte  

### 🧠 Types & Config
- [ ] Ajouter dans `SocialPlatform`  
- [ ] Structurer les `credentials`  
- [ ] Ajouter les variables `.env`  

### 🛠️ Implémentation Services
- [ ] `platform.posting.service.ts`  
- [ ] `platform.stats.service.ts`  
- [ ] `platform.messaging.service.ts`  
- [ ] Implémenter les méthodes requises  

### 🔗 Intégration
- [ ] Ajouter à `SocialNetworkServiceFactory`  
- [ ] Ajouter les règles SQL  
- [ ] Vérifier les contrôleurs  

### 🧪 Tests & Validation
- [ ] Tests unitaires  
- [ ] Tests d’intégration  
- [ ] Cas d’erreurs  
- [ ] Documentation  

---

## 🧬 Pattern à Suivre

### 📁 Structure

```
src/services/social-networks/[PLATFORM]/
├── [platform].posting.service.ts
├── [platform].messaging.service.ts
└── [platform].stats.service.ts
```

### 📤 PostingService
- `createPost()`  
- `updatePost()`  
- `deletePost()`  
- `getPost()`  
- `getPosts()`  

### 📈 StatsService
- `collectPostMetrics()`  
- `getAccountMetrics()`  
- `collectionRules`  

### 💬 MessagingService
- `sendMessage()`  
- `getMessages()`  
- `markAsRead()`  

---

## 🚀 Prêt à Ajouter un Nouveau Réseau !

Avec cette structure, vous pouvez maintenant ajouter **n'importe quelle plateforme sociale**.  
L'architecture modulaire garantit une intégration fluide et une maintenance facile.
