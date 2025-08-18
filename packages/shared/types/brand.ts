export interface BrandConfig {
  id: string;
  name: string;
  domain: string;
  theme: BrandTheme;
  features: string[];
  targetAudience: string;
  description: string;
  logo: string;
  favicon: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface BrandTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  border: string;
}

export interface BrandFeatures {
  cognitive_frameworks: boolean;
  meaning_engineering: boolean;
  deep_analysis: boolean;
  consciousness_mapping: boolean;
  advanced_systems: boolean;
  expert_tier: boolean;
}

export const BRAND_IDS = {
  AI_PROMPT_TEMPLATES: 'ai-prompt-templates',
  EIGHT_VULTUS: '8vultus'
} as const;

export type BrandId = typeof BRAND_IDS[keyof typeof BRAND_IDS];

export interface BrandContext {
  currentBrand: BrandConfig;
  setBrand: (brandId: BrandId) => void;
  isBrand: (brandId: BrandId) => boolean;
}
