export type AccessTier = 'explorer' | 'architect' | 'initiate' | 'master'

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  explorer: 1,
  architect: 2,
  initiate: 3,
  master: 4
}

export const PREVIEW_PERCENTAGES: Record<AccessTier, number> = {
  explorer: 20,
  architect: 40,
  initiate: 70,
  master: 100
}

export function getAccessibleContent(
  fullContent: string,
  userTier: AccessTier,
  requiredTier: AccessTier
): { content: string; hasFullAccess: boolean } {
  const hasFullAccess = TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
  
  if (hasFullAccess) {
    return { content: fullContent, hasFullAccess: true }
  }

  const previewPercentage = PREVIEW_PERCENTAGES[userTier]
  const words = fullContent.split(' ')
  const previewWordCount = Math.floor(words.length * (previewPercentage / 100))
  const previewContent = words.slice(0, previewWordCount).join(' ')
  
  return { 
    content: previewContent + '...\n\n🔒 **Upgrade to see full content**', 
    hasFullAccess: false 
  }
}

export function canAccessPrompt(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
}

export function getTierUpgradeMessage(userTier: AccessTier, requiredTier: AccessTier): string {
  if (canAccessPrompt(userTier, requiredTier)) {
    return ''
  }
  
  const tierNames = {
    explorer: 'Explorer',
    architect: 'Architect', 
    initiate: 'Initiate',
    master: 'Master'
  }
  
  return `🔒 Upgrade to ${tierNames[requiredTier]} tier to access this content`
}

export function getTierBenefits(userTier: AccessTier): string[] {
  const benefits = {
    explorer: [
      'Access to basic cognitive frameworks',
      '20% preview of advanced content',
      'Community access'
    ],
    architect: [
      'Access to intermediate frameworks',
      '40% preview of expert content',
      'Priority community access',
      'Video tutorials'
    ],
    initiate: [
      'Access to professional frameworks',
      '70% preview of master content',
      'VIP community access',
      'Live workshops',
      'Priority support'
    ],
    master: [
      'Unlimited access to all content',
      '100% content access',
      'Exclusive master-level frameworks',
      '1-on-1 consultation sessions',
      'Custom framework development',
      'White-label solutions'
    ]
  }
  
  return benefits[userTier] || benefits.explorer
}
