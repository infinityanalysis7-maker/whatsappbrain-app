// Free plan limits
export const FREE_PLAN_LIMITS = {
  conversations: 50,
  rules: 5,
  contacts: 100,
  templates: 10,
  broadcasts: 5,
  campaigns: 3,
} as const

export type PlanLimits = typeof FREE_PLAN_LIMITS

// Check if a count has reached the free plan limit
export function isAtLimit(current: number, limit: number): boolean {
  return current >= limit
}

// Check if a count is near the limit (80% or more)
export function isNearLimit(current: number, limit: number): boolean {
  return current >= limit * 0.8 && current < limit
}

// Get a usage summary for the free plan
export function getUsageSummary(conversationCount: number, ruleCount: number, contactCount = 0, templateCount = 0, broadcastCount = 0, campaignCount = 0) {
  return {
    conversations: {
      current: conversationCount,
      limit: FREE_PLAN_LIMITS.conversations,
      atLimit: isAtLimit(conversationCount, FREE_PLAN_LIMITS.conversations),
      nearLimit: isNearLimit(conversationCount, FREE_PLAN_LIMITS.conversations),
    },
    rules: {
      current: ruleCount,
      limit: FREE_PLAN_LIMITS.rules,
      atLimit: isAtLimit(ruleCount, FREE_PLAN_LIMITS.rules),
      nearLimit: isNearLimit(ruleCount, FREE_PLAN_LIMITS.rules),
    },
    contacts: {
      current: contactCount,
      limit: FREE_PLAN_LIMITS.contacts,
      atLimit: isAtLimit(contactCount, FREE_PLAN_LIMITS.contacts),
      nearLimit: isNearLimit(contactCount, FREE_PLAN_LIMITS.contacts),
    },
    templates: {
      current: templateCount,
      limit: FREE_PLAN_LIMITS.templates,
      atLimit: isAtLimit(templateCount, FREE_PLAN_LIMITS.templates),
      nearLimit: isNearLimit(templateCount, FREE_PLAN_LIMITS.templates),
    },
    broadcasts: {
      current: broadcastCount,
      limit: FREE_PLAN_LIMITS.broadcasts,
      atLimit: isAtLimit(broadcastCount, FREE_PLAN_LIMITS.broadcasts),
      nearLimit: isNearLimit(broadcastCount, FREE_PLAN_LIMITS.broadcasts),
    },
    campaigns: {
      current: campaignCount,
      limit: FREE_PLAN_LIMITS.campaigns,
      atLimit: isAtLimit(campaignCount, FREE_PLAN_LIMITS.campaigns),
      nearLimit: isNearLimit(campaignCount, FREE_PLAN_LIMITS.campaigns),
    },
    anyAtLimit: isAtLimit(conversationCount, FREE_PLAN_LIMITS.conversations) || isAtLimit(ruleCount, FREE_PLAN_LIMITS.rules) || isAtLimit(contactCount, FREE_PLAN_LIMITS.contacts) || isAtLimit(templateCount, FREE_PLAN_LIMITS.templates) || isAtLimit(broadcastCount, FREE_PLAN_LIMITS.broadcasts) || isAtLimit(campaignCount, FREE_PLAN_LIMITS.campaigns),
    anyNearLimit: isNearLimit(conversationCount, FREE_PLAN_LIMITS.conversations) || isNearLimit(ruleCount, FREE_PLAN_LIMITS.rules) || isNearLimit(contactCount, FREE_PLAN_LIMITS.contacts) || isNearLimit(templateCount, FREE_PLAN_LIMITS.templates) || isNearLimit(broadcastCount, FREE_PLAN_LIMITS.broadcasts) || isNearLimit(campaignCount, FREE_PLAN_LIMITS.campaigns),
  }
}
