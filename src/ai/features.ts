/**
 * AI Feature Toggles
 * Central configuration for enabling/disabling AI modules
 */

export interface AIFeatureConfig {
  enabled: boolean;
  fallback: 'rule-based' | 'simple' | 'disabled';
  maxRetries: number;
  timeoutMs: number;
}

export const AI_FEATURES = {
  taskBreakdown: {
    enabled: true,
    fallback: 'simple' as const,
    maxRetries: 3,
    timeoutMs: 30000,
  },
  dailyPlanner: {
    enabled: true,
    fallback: 'rule-based' as const,
    maxRetries: 3,
    timeoutMs: 30000,
  },
  inboxAtomizer: {
    enabled: true,
    fallback: 'simple' as const,
    maxRetries: 3,
    timeoutMs: 30000,
  },
  scheduling: {
    enabled: true,
    fallback: 'rule-based' as const,
    maxRetries: 2,
    timeoutMs: 20000,
  },
  reflection: {
    enabled: true,
    fallback: 'simple' as const,
    maxRetries: 2,
    timeoutMs: 15000,
  },
  taskAnalysis: {
    enabled: true,
    fallback: 'disabled' as const,
    maxRetries: 2,
    timeoutMs: 20000,
  },
  workflowProcessor: {
    enabled: true,
    fallback: 'disabled' as const,
    maxRetries: 2,
    timeoutMs: 45000,
  },
} as const;

export type AIFeatureName = keyof typeof AI_FEATURES;

export function isFeatureEnabled(feature: AIFeatureName): boolean {
  return AI_FEATURES[feature].enabled;
}

export function getFeatureConfig(feature: AIFeatureName): AIFeatureConfig {
  return AI_FEATURES[feature];
}
