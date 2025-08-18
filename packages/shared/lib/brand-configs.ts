import { BrandConfig, BRAND_IDS } from '../types/brand';

export const AI_PROMPT_TEMPLATES_CONFIG: BrandConfig = {
  id: BRAND_IDS.AI_PROMPT_TEMPLATES,
  name: 'AI Prompt Templates',
  domain: 'ai-prompt-templates.com',
  theme: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    background: '#FFFFFF',
    text: '#1F2937',
    muted: '#6B7280',
    border: '#E5E7EB'
  },
  features: [
    'cognitive_frameworks',
    'meaning_engineering',
    'deep_analysis',
    'consciousness_mapping'
  ],
  targetAudience: 'AI researchers, cognitive architects, meaning engineers',
  description: 'Advanced AI prompts for cognitive depth and meaning engineering',
  logo: '/ai-prompt-templates-logo.svg',
  favicon: '/ai-prompt-templates-favicon.ico',
  socialMedia: {
    twitter: 'https://twitter.com/ai_prompt_templates',
    linkedin: 'https://linkedin.com/company/ai-prompt-templates',
    github: 'https://github.com/ai-prompt-templates'
  }
};

export const EIGHT_VULTUS_CONFIG: BrandConfig = {
  id: BRAND_IDS.EIGHT_VULTUS,
  name: '8Vultus',
  domain: '8vultus.com',
  theme: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    background: '#0F0F23',
    text: '#F8FAFC',
    muted: '#94A3B8',
    border: '#334155'
  },
  features: [
    'consciousness_mapping',
    'advanced_systems',
    'expert_tier',
    'deep_analysis'
  ],
  targetAudience: 'Consciousness researchers, system architects, expert practitioners',
  description: 'Elite consciousness mapping and advanced cognitive systems',
  logo: '/8vultus-logo.svg',
  favicon: '/8vultus-favicon.ico',
  socialMedia: {
    twitter: 'https://twitter.com/8vultus',
    linkedin: 'https://linkedin.com/company/8vultus',
    github: 'https://github.com/8vultus'
  }
};

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  [BRAND_IDS.AI_PROMPT_TEMPLATES]: AI_PROMPT_TEMPLATES_CONFIG,
  [BRAND_IDS.EIGHT_VULTUS]: EIGHT_VULTUS_CONFIG
};

export function getBrandConfig(brandId: string): BrandConfig {
  const config = BRAND_CONFIGS[brandId];
  if (!config) {
    throw new Error(`Brand config not found for: ${brandId}`);
  }
  return config;
}

export function getBrandConfigByDomain(domain: string): BrandConfig | null {
  return Object.values(BRAND_CONFIGS).find(config => 
    config.domain === domain || domain.includes(config.id)
  ) || null;
}
