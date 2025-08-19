export type AccessTier = 'free' | 'explorer' | 'architect' | 'initiate' | 'master' | 'elite'

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  free: 0,
  explorer: 1,
  architect: 2,
  initiate: 3,
  master: 4,
  elite: 5
}

export const PREVIEW_PERCENTAGES: Record<AccessTier, number> = {
  free: 10,
  explorer: 20,
  architect: 40,
  initiate: 70,
  master: 90,
  elite: 100
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
    free: 'Free',
    explorer: 'Explorer',
    architect: 'Architect', 
    initiate: 'Initiate',
    master: 'Master',
    elite: 'Elite'
  }
  
  return `🔒 Upgrade to ${tierNames[requiredTier]} tier to access this content`
}

export function getTierBenefits(userTier: AccessTier): string[] {
  const benefits = {
    free: [
      'Access to basic cognitive frameworks',
      '10% preview of advanced content',
      'Community access'
    ],
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
      'Access to advanced frameworks',
      '90% preview of elite content',
      'VIP community access',
      'Live workshops',
      'Priority support'
    ],
    elite: [
      'Unlimited access to all content',
      '100% content access',
      'Exclusive elite-level frameworks',
      '1-on-1 consultation sessions',
      'Custom framework development',
      'White-label solutions'
    ]
  }
  
  return benefits[userTier] || benefits.free
}
