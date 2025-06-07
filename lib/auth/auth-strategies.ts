/**
 * Auth0 Authentication Strategies Configuration
 * 
 * This file defines the available authentication strategies and their configurations.
 */

// Define available authentication strategies
export enum AuthStrategy {
  GOOGLE = 'google',
  GITHUB = 'github',
  EMAIL_PASSWORD = 'email-password',
  MICROSOFT = 'microsoft',
  APPLE = 'apple'
}

// Interface for strategy configuration
export interface AuthStrategyConfig {
  name: string;
  enabled: boolean;
  displayName: string;
  icon: string;
  callbackPath: string;
  scope?: string[];
}

// Configuration for each strategy
export const AUTH_STRATEGIES: Record<AuthStrategy, AuthStrategyConfig> = {
  [AuthStrategy.GOOGLE]: {
    name: 'google',
    enabled: true,
    displayName: 'Google',
    icon: 'google',
    callbackPath: '/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  [AuthStrategy.GITHUB]: {
    name: 'github',
    enabled: true, // Now enabled
    displayName: 'GitHub',
    icon: 'github',
    callbackPath: '/api/auth/github/callback',
    scope: ['user:email']
  },
  [AuthStrategy.EMAIL_PASSWORD]: {
    name: 'email-password',
    enabled: false, // Not yet implemented
    displayName: 'Email & Password',
    icon: 'email',
    callbackPath: '/api/auth/email/callback'
  },
  [AuthStrategy.MICROSOFT]: {
    name: 'microsoft',
    enabled: true, // Now enabled
    displayName: 'Microsoft',
    icon: 'microsoft',
    callbackPath: '/api/auth/microsoft/callback',
    scope: ['profile', 'email']
  },
  [AuthStrategy.APPLE]: {
    name: 'apple',
    enabled: true, // Now enabled
    displayName: 'Apple',
    icon: 'apple',
    callbackPath: '/api/auth/apple/callback',
    scope: ['name', 'email']
  }
};

// Get enabled authentication strategies
export function getEnabledAuthStrategies(): AuthStrategyConfig[] {
  return Object.values(AUTH_STRATEGIES).filter(strategy => strategy.enabled);
}

// Get a specific authentication strategy configuration
export function getAuthStrategy(strategy: AuthStrategy): AuthStrategyConfig {
  return AUTH_STRATEGIES[strategy];
}

// Check if a strategy is enabled
export function isStrategyEnabled(strategy: AuthStrategy): boolean {
  return AUTH_STRATEGIES[strategy].enabled;
}

// Get Auth0 connection name for a strategy
export function getAuth0ConnectionName(strategy: AuthStrategy): string {
  switch (strategy) {
    case AuthStrategy.GOOGLE:
      return 'google-oauth2';
    case AuthStrategy.GITHUB:
      return 'github';
    case AuthStrategy.MICROSOFT:
      return 'windowslive';
    case AuthStrategy.APPLE:
      return 'apple';
    case AuthStrategy.EMAIL_PASSWORD:
      return 'Username-Password-Authentication';
    default:
      return '';
  }
}
