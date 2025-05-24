export interface Channel {
  id: string;
  workspace_id: string;
  platform: SocialPlatform;
  name: string;
  credentials: Record<string, any>; // Stockage JSON flexible
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SocialPlatform = 
  | 'facebook'
  | 'instagram' 
  | 'twitter'
  | 'linkedin'  // ✅ Ajouté
  | 'youtube'
  | 'tiktok'
  | 'wordpress'
  | 'pinterest';

export interface CredentialConfig {
  facebook: {
    ACCESS_TOKEN: string;
    PAGE_ID?: string;
  };
  linkedin: {  // ✅ Nouveau
    ACCESS_TOKEN: string;
    USER_URN?: string;        // Pour profils personnels
    ORGANIZATION_URN?: string; // Pour pages d'entreprise
    PAGE_ID?: string;         // ID de la page (optionnel)
  };
  wordpress: {
    API_KEY: string;
    BASE_URL: string;
    USERNAME?: string;
  };
  instagram: {
    ACCESS_TOKEN: string;
    BUSINESS_ACCOUNT_ID: string;
  };
  // Autres plateformes...
}