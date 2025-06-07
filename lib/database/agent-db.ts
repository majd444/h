/**
 * Agent Database Adapter
 * 
 * This module provides a database adapter for agent storage using SQLite
 * similar to the account-db implementation.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Agent interface matching the expected structure
export interface Agent {
  id: number;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'busy';
  created_at: string;
  updated_at: string;
  userId: string;
  
  // Additional fields in snake_case to match frontend
  chatbot_name?: string;
  system_prompt?: string;
  top_color?: string;
  accent_color?: string;
  background_color?: string;
  is_active?: boolean;
  avatar_url?: string;
  workflow_id?: string;
}

// Interface for database operations
export interface AgentDatabase {
  query(filter: Record<string, any>): Promise<Agent[]>;
  create(data: Partial<Agent>): Promise<Agent>;
  update(id: number, data: Partial<Agent>): Promise<Agent>;
  remove(id: number): Promise<void>;
  getById(id: number): Promise<Agent | null>;
  getByUserId(userId: string): Promise<Agent[]>;
}

// SQLite database implementation
class SQLiteAgentDatabase implements AgentDatabase {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database connection
    const dbPath = path.join(dataDir, 'agents.db');
    this.db = new Database(dbPath);
    
    // Initialize database schema
    this.initializeDatabase();
  }

  private initializeDatabase() {
    if (this.initialized) return;

    // Create agents table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        userId TEXT NOT NULL,
        chatbot_name TEXT,
        system_prompt TEXT,
        top_color TEXT,
        accent_color TEXT,
        background_color TEXT,
        is_active INTEGER,
        avatar_url TEXT,
        workflow_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_agents_userId ON agents(userId);
    `);

    this.initialized = true;
  }

  async query(filter: Record<string, any> = {}): Promise<Agent[]> {
    // Build WHERE clause from filter
    const conditions: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      conditions.push(`${key} = ?`);
      params.push(value);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const stmt = this.db.prepare(`SELECT * FROM agents ${whereClause}`);
    const rows = conditions.length > 0 
      ? stmt.all(...params) 
      : stmt.all();

    return rows.map(this.rowToAgent);
  }

  async create(data: Partial<Agent>): Promise<Agent> {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO agents (
        name, description, status, created_at, updated_at, userId,
        chatbot_name, system_prompt, top_color, accent_color, background_color,
        is_active, avatar_url, workflow_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.name || 'New Agent',
      data.description || '',
      data.status || 'online',
      now,
      now,
      data.userId || 'default-user',
      data.chatbot_name || data.name || 'AI Assistant',
      data.system_prompt || 'You are a helpful AI assistant.',
      data.top_color || '#1f2937',
      data.accent_color || '#3B82F6',
      data.background_color || '#F3F4F6',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.avatar_url || '',
      data.workflow_id || '1'
    );
    
    const id = result.lastInsertRowid as number;
    return this.getById(id) as Promise<Agent>;
  }

  async update(id: number, data: Partial<Agent>): Promise<Agent> {
    // First check if the agent exists
    const agent = await this.getById(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    // Only update fields that are provided
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        
        // Handle boolean conversion for is_active
        if (key === 'is_active') {
          params.push(value ? 1 : 0);
        } else {
          params.push(value);
        }
      }
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());

    // Add the id as the last parameter for the WHERE clause
    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...params);
    
    return this.getById(id) as Promise<Agent>;
  }

  async remove(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM agents WHERE id = ?');
    stmt.run(id);
  }

  async getById(id: number): Promise<Agent | null> {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToAgent(row) : null;
  }

  async getByUserId(userId: string): Promise<Agent[]> {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE userId = ?');
    const rows = stmt.all(userId);
    return rows.map(this.rowToAgent);
  }

  private rowToAgent(row: any): Agent {
    return {
      ...row,
      // Convert SQLite integer to boolean
      is_active: row.is_active === 1
    };
  }
}

// Factory function to get the database implementation
export function getAgentDatabase(): AgentDatabase {
  return new SQLiteAgentDatabase();
}

// Export a singleton instance
export const agentDb = getAgentDatabase();
