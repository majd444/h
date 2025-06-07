/**
 * Utilities for account management
 */
import { v4 as uuidv4 } from 'uuid';
import { generateConsistentAccountId, getAuth0UserById } from './auth0-utils';
import { accountDb } from './database/account-db';

// Interface for account information
export interface AccountInfo {
  accountId: string;
  userId: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  // Additional fields for user profile
  name?: string;
  picture?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a unique account ID
 * Format: acc_[timestamp]_[random]
 */
export function generateAccountId(): string {
  return `acc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a UUID-based account ID
 * More secure and globally unique
 */
export function generateUuidAccountId(): string {
  return `acc_${uuidv4()}`;
}

/**
 * Get account information by user ID
 */
export async function getAccountByUserId(userId: string): Promise<AccountInfo | null> {
  return await accountDb.getAccountByUserId(userId);
}

/**
 * Get account information by email
 */
export async function getAccountByEmail(email: string): Promise<AccountInfo | null> {
  return await accountDb.getAccountByEmail(email);
}

/**
 * Ensure an account exists for a user
 * If an account doesn't exist, create one
 */
export async function ensureAccountExists(userId: string, email: string): Promise<AccountInfo> {
  // Check if account already exists by userId
  let account = await accountDb.getAccountByUserId(userId);
  
  if (account) {
    // Update last login time
    account.lastLogin = new Date().toISOString();
    return await accountDb.updateAccount(account);
  }
  
  // Check if account exists by email
  account = await accountDb.getAccountByEmail(email);
  
  if (account) {
    // Update last login time
    account.lastLogin = new Date().toISOString();
    return await accountDb.updateAccount(account);
  }
  
  // Try to get Auth0 user information
  let auth0User = null;
  try {
    auth0User = await getAuth0UserById(userId);
  } catch (error) {
    console.log('Could not get Auth0 user, using fallback ID generation:', 
      error instanceof Error ? error.message : 'Unknown error');
  }
  
  // Create a new account with consistent ID based on Auth0 user ID
  // This ensures the same user always gets the same account ID
  const accountId = auth0User ? 
    generateConsistentAccountId(userId) : 
    `acc_${uuidv4()}`;
  
  // Create new account with Auth0 profile data if available
  const newAccount: AccountInfo = {
    accountId,
    userId,
    email,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    // Include Auth0 profile data if available
    name: auth0User?.name || `User ${userId.substring(0, 8)}`,
    picture: auth0User?.picture,
    metadata: auth0User ? {
      auth0_last_login: auth0User.last_login,
      auth0_logins_count: auth0User.logins_count,
      auth0_created_at: auth0User.created_at
    } : undefined
  };
  
  // Store in database
  await accountDb.createAccount(newAccount);
  
  console.log(`Created account ID ${accountId} for user ${userId} (${email})`);
  
  return newAccount;
}

/**
 * Get all accounts (for development purposes)
 */
export async function getAllAccounts(): Promise<AccountInfo[]> {
  return await accountDb.getAllAccounts();
}

/**
 * Get paginated accounts with Auth0-style pagination
 */
export async function getPaginatedAccounts(page: number = 0, limit: number = 10): Promise<{
  length: number;
  limit: number;
  accounts: AccountInfo[];
  start: number;
  total: number;
}> {
  return await accountDb.getPaginatedAccounts(page, limit);
}

/**
 * Update user profile information
 * This can be used to update profile data from Auth0 or other sources
 */
export async function updateUserProfile(userId: string, profileData: Partial<AccountInfo>): Promise<AccountInfo | null> {
  // Get existing account
  const account = await accountDb.getAccountByUserId(userId);
  
  if (!account) {
    console.error(`Cannot update profile for non-existent user: ${userId}`);
    return null;
  }
  
  // Update account with new profile data
  const updatedAccount: AccountInfo = {
    ...account,
    ...profileData,
    // Don't allow overwriting these critical fields
    userId: account.userId,
    accountId: account.accountId,
    email: profileData.email || account.email,
    // Update last modified time
    lastLogin: new Date().toISOString()
  };
  
  // Save to database
  return await accountDb.updateAccount(updatedAccount);
}
