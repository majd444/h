/**
 * Account Database Adapter
 * 
 * This module provides a database adapter for account storage that can be
 * switched between mock in-memory storage and a real database implementation.
 */
import { AccountInfo } from '../account-utils';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Interface for database operations
export interface AccountDatabase {
  getAccountByUserId(userId: string): Promise<AccountInfo | null>;
  getAccountByEmail(email: string): Promise<AccountInfo | null>;
  getAccountById(accountId: string): Promise<AccountInfo | null>;
  createAccount(account: AccountInfo): Promise<AccountInfo>;
  updateAccount(account: AccountInfo): Promise<AccountInfo>;
  getAllAccounts(): Promise<AccountInfo[]>;
  getPaginatedAccounts(page: number, limit: number): Promise<{
    accounts: AccountInfo[];
    total: number;
    start: number;
    limit: number;
    length: number;
  }>;
}

// Mock in-memory database implementation
class MockAccountDatabase implements AccountDatabase {
  private accounts: Record<string, AccountInfo> = {};
  private userIdToAccountId: Record<string, string> = {};
  private emailToAccountId: Record<string, string> = {};

  async getAccountByUserId(userId: string): Promise<AccountInfo | null> {
    const accountId = this.userIdToAccountId[userId];
    return accountId ? this.accounts[accountId] : null;
  }

  async getAccountByEmail(email: string): Promise<AccountInfo | null> {
    const accountId = this.emailToAccountId[email];
    return accountId ? this.accounts[accountId] : null;
  }

  async getAccountById(accountId: string): Promise<AccountInfo | null> {
    return this.accounts[accountId] || null;
  }

  async createAccount(account: AccountInfo): Promise<AccountInfo> {
    this.accounts[account.accountId] = account;
    this.userIdToAccountId[account.userId] = account.accountId;
    this.emailToAccountId[account.email] = account.accountId;
    return account;
  }

  async updateAccount(account: AccountInfo): Promise<AccountInfo> {
    this.accounts[account.accountId] = account;
    return account;
  }

  async getAllAccounts(): Promise<AccountInfo[]> {
    return Object.values(this.accounts);
  }

  async getPaginatedAccounts(page: number, limit: number): Promise<{
    accounts: AccountInfo[];
    total: number;
    start: number;
    limit: number;
    length: number;
  }> {
    const allAccounts = Object.values(this.accounts);
    const total = allAccounts.length;
    const start = page * limit;
    const paginatedAccounts = allAccounts.slice(start, start + limit);
    
    return {
      accounts: paginatedAccounts,
      total,
      start,
      limit,
      length: paginatedAccounts.length
    };
  }
}

// SQLite database implementation
class SQLiteAccountDatabase implements AccountDatabase {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database connection
    const dbPath = path.join(dataDir, 'accounts.db');
    this.db = new Database(dbPath);
    
    // Initialize database schema
    this.initializeDatabase();
  }

  private initializeDatabase() {
    if (this.initialized) return;

    // Create accounts table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        accountId TEXT PRIMARY KEY,
        userId TEXT UNIQUE,
        email TEXT UNIQUE,
        createdAt TEXT,
        lastLogin TEXT,
        name TEXT,
        picture TEXT,
        metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_userId ON accounts(userId);
      CREATE INDEX IF NOT EXISTS idx_email ON accounts(email);
    `);

    this.initialized = true;
  }

  async getAccountByUserId(userId: string): Promise<AccountInfo | null> {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE userId = ?');
    const row = stmt.get(userId);
    return row ? this.rowToAccount(row) : null;
  }

  async getAccountByEmail(email: string): Promise<AccountInfo | null> {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE email = ?');
    const row = stmt.get(email);
    return row ? this.rowToAccount(row) : null;
  }

  async getAccountById(accountId: string): Promise<AccountInfo | null> {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE accountId = ?');
    const row = stmt.get(accountId);
    return row ? this.rowToAccount(row) : null;
  }

  async createAccount(account: AccountInfo): Promise<AccountInfo> {
    // Fix the userId and email field swapping issue
    // Store them in the correct fields in the database
    const stmt = this.db.prepare(`
      INSERT INTO accounts (accountId, userId, email, createdAt, lastLogin, name, picture, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      account.accountId,
      account.userId, // Store userId as userId
      account.email, // Store email as email
      account.createdAt,
      account.lastLogin,
      account.name || null,
      account.picture || null,
      account.metadata ? JSON.stringify(account.metadata) : null
    );
    
    return account;
  }

  async updateAccount(account: AccountInfo): Promise<AccountInfo> {
    const stmt = this.db.prepare(`
      UPDATE accounts SET
        userId = ?,
        email = ?,
        lastLogin = ?,
        name = ?,
        picture = ?,
        metadata = ?
      WHERE accountId = ?
    `);
    
    stmt.run(
      account.userId,
      account.email,
      account.lastLogin,
      account.name || null,
      account.picture || null,
      account.metadata ? JSON.stringify(account.metadata) : null,
      account.accountId
    );
    
    return account;
  }

  async getAllAccounts(): Promise<AccountInfo[]> {
    const stmt = this.db.prepare('SELECT * FROM accounts');
    const rows = stmt.all();
    return rows.map(row => this.rowToAccount(row));
  }

  async getPaginatedAccounts(page: number, limit: number): Promise<{
    accounts: AccountInfo[];
    total: number;
    start: number;
    limit: number;
    length: number;
  }> {
    const offset = page * limit;
    
    // Get total count
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM accounts');
    const { count } = countStmt.get() as { count: number };
    
    // Get paginated accounts
    const stmt = this.db.prepare('SELECT * FROM accounts LIMIT ? OFFSET ?');
    const rows = stmt.all(limit, offset);
    const accounts = rows.map(row => this.rowToAccount(row));
    
    return {
      accounts,
      total: count,
      start: offset,
      limit,
      length: accounts.length
    };
  }

  private rowToAccount(row: any): AccountInfo {
    // Note: In the account creation process, userId and email fields are swapped
    // We need to keep this consistent with how accounts are created and retrieved
    return {
      accountId: row.accountId,
      userId: row.userId,
      email: row.email,
      createdAt: row.createdAt,
      lastLogin: row.lastLogin,
      name: row.name || undefined,
      picture: row.picture || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}

// Factory function to get the appropriate database implementation
export function getAccountDatabase(): AccountDatabase {
  // Check if we should use a real database
  const USE_REAL_DATABASE = process.env.USE_REAL_DATABASE === 'true';
  
  if (USE_REAL_DATABASE) {
    console.log('🔍 Using SQLite database for account storage');
    return new SQLiteAccountDatabase();
  }
  
  // Return mock database for development
  console.log('🔍 Using in-memory database for account storage');
  return new MockAccountDatabase();
}

// Export a singleton instance
export const accountDb = getAccountDatabase();
