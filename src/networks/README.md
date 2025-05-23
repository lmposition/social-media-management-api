# Ajout de nouveaux réseaux sociaux

Ce dossier contiendra les modules spécifiques à chaque réseau social. Chaque réseau doit être implémenté dans un fichier séparé qui étend la classe `BaseNetworkService`.

## Structure pour chaque réseau

Chaque fichier de réseau doit suivre cette structure :

```
src/networks/
├── facebook/
│   ├── facebook.service.ts
│   ├── facebook.types.ts
│   └── facebook.utils.ts
├── instagram/
│   ├── instagram.service.ts
│   ├── instagram.types.ts
│   └── instagram.utils.ts
└── [autres-reseaux]/
```

## Implémentation d'un nouveau réseau

### 1. Créer le service principal

```typescript
// src/networks/example/example.service.ts
import { BaseNetworkService } from '../../services/base-network.service';
import { SocialNetworkType, NetworkCapabilities } from '../../interfaces/common';

export class ExampleNetworkService extends BaseNetworkService {
  constructor() {
    super(SocialNetworkType.EXAMPLE, {
      posting: {
        enabled: true,
        supportedMediaTypes: [MediaType.IMAGE, MediaType.VIDEO],
        maxMediaCount: 4,
        maxTextLength: 280,
        supportsScheduling: false,
        supportsEditing: false,
        supportsDrafts: true
      },
      messaging: {
        enabled: false,
        supportsPrivateMessages: false,
        supportsGroupMessages: false,
        supportsMediaMessages: false,
        supportsAutoReply: false
      },
      statistics: {
        enabled: true,
        availableMetrics: ['likes', 'shares', 'comments', 'views'],
        realTimeData: false,
        historicalDataDays: 90
      }
    });
  }

  // Implémenter toutes les méthodes abstraites
  async publishPost(account, request) { /* ... */ }
  async deletePost(account, postId) { /* ... */ }
  async editPost(account, postId, request) { /* ... */ }
  async getPost(account, postId) { /* ... */ }
  async getPostStatistics(account, postId) { /* ... */ }
  async getAccountStatistics(account, request) { /* ... */ }
}
```

### 2. Enregistrer le service

```typescript
// src/networks/index.ts
import { networkRegistry } from '../services/base-network.service';
import { ExampleNetworkService } from './example/example.service';

// Enregistrer tous les services réseau
export const initializeNetworkServices = () => {
  networkRegistry.register(new ExampleNetworkService());
  // Ajouter d'autres réseaux ici
};
```

### 3. Appeler l'initialisation

```typescript
// src/index.ts
import { initializeNetworkServices } from './networks';

// Initialiser les services réseau
initializeNetworkServices();
```

## Règles de récupération des statistiques

Chaque réseau aura ses propres règles de fréquence de récupération des statistiques selon l'âge du post :

### Exemple de règles (à personnaliser pour chaque réseau)

```typescript
export const STATISTICS_UPDATE_RULES = {
  // Posts de moins de 1 heure : toutes les 5 minutes
  0: 5,
  // Posts de 1-24 heures : toutes les 30 minutes
  1: 30,
  // Posts de 1-7 jours : toutes les 2 heures
  24: 120,
  // Posts de 7-30 jours : toutes les 12 heures
  168: 720,
  // Posts de plus de 30 jours : une fois par jour
  720: 1440
};
```

## Tests pour chaque réseau

Chaque réseau doit avoir ses propres tests :

```
tests/networks/
├── facebook/
│   ├── facebook.service.test.ts
│   └── facebook.integration.test.ts
└── [autres-reseaux]/
```

## Capacités par fonctionnalité

### Posting
- `enabled` : Le réseau supporte-t-il le posting ?
- `supportedMediaTypes` : Types de médias supportés
- `maxMediaCount` : Nombre maximum de médias par post
- `maxTextLength` : Longueur maximum du texte
- `supportsScheduling` : Programmation de posts
- `supportsEditing` : Édition de posts publiés
- `supportsDrafts` : Sauvegarde de brouillons

### Messaging
- `enabled` : Le réseau supporte-t-il les messages ?
- `supportsPrivateMessages` : Messages privés 1:1
- `supportsGroupMessages` : Messages de groupe
- `supportsMediaMessages` : Envoi de médias
- `supportsAutoReply` : Réponses automatiques

### Statistics
- `enabled` : Le réseau fournit-il des statistiques ?
- `availableMetrics` : Métriques disponibles
- `realTimeData` : Données en temps réel
- `historicalDataDays` : Jours d'historique disponibles

## Points d'attention

1. **Gestion des erreurs** : Chaque réseau a ses propres codes d'erreur
2. **Rate limiting** : Respecter les limites de chaque API
3. **Authentification** : Gérer le renouvellement des tokens
4. **Formats de données** : Mapper les réponses vers nos interfaces communes
5. **Webhooks** : Implémenter si le réseau le supporte