/**
 * Plugin Database Adapter
 * 
 * This module provides SQLite database operations for managing chatbot plugins
 * and their configurations.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the plugin configuration type
export interface PluginConfig {
  id: number;
  plugin_id: string;
  user_id: string;
  agent_id: number;
  platform: string;
  config: string; // JSON string of configuration
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Define the plugin integration type
export interface PluginIntegration {
  id: number;
  user_id: string;
  agent_id: number;
  plugin_id: string;
  platform: string;
  external_id: string; // ID in the external platform
  metadata: string; // JSON string of metadata
  created_at: string;
  updated_at: string;
}

class PluginDatabase {
  private db: Database.Database;

  constructor() {
    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize the database
    const dbPath = path.join(dataDir, 'plugins.db');
    this.db = new Database(dbPath);
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Initialize the database schema
    this.initSchema();
  }

  private initSchema() {
    // Create plugin configurations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugin_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        agent_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        config TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(plugin_id, user_id, agent_id)
      )
    `);

    // Create plugin integrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugin_integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        agent_id INTEGER NOT NULL,
        plugin_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        external_id TEXT NOT NULL,
        metadata TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(plugin_id, external_id)
      )
    `);
  }

  // Plugin Configuration Methods

  async getPluginConfigs(userId: string, agentId?: number): Promise<PluginConfig[]> {
    try {
      let query = 'SELECT * FROM plugin_configs WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (agentId !== undefined) {
        query += ' AND agent_id = ?';
        params.push(agentId);
      }
      
      const stmt = this.db.prepare(query);
      return stmt.all(...params) as PluginConfig[];
    } catch (error) {
      console.error('Error getting plugin configs:', error);
      return [];
    }
  }

  async getPluginConfigById(id: number): Promise<PluginConfig | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM plugin_configs WHERE id = ?');
      return stmt.get(id) as PluginConfig || null;
    } catch (error) {
      console.error(`Error getting plugin config with ID ${id}:`, error);
      return null;
    }
  }

  async getPluginConfigByPluginId(pluginId: string, userId: string, agentId: number): Promise<PluginConfig | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM plugin_configs WHERE plugin_id = ? AND user_id = ? AND agent_id = ?');
      return stmt.get(pluginId, userId, agentId) as PluginConfig || null;
    } catch (error) {
      console.error(`Error getting plugin config for plugin ${pluginId}:`, error);
      return null;
    }
  }

  async createPluginConfig(config: Omit<PluginConfig, 'id' | 'created_at' | 'updated_at'>): Promise<PluginConfig | null> {
    try {
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT INTO plugin_configs (plugin_id, user_id, agent_id, platform, config, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        config.plugin_id,
        config.user_id,
        config.agent_id,
        config.platform,
        config.config,
        config.enabled ? 1 : 0,
        now,
        now
      );
      
      if (result.lastInsertRowid) {
        return this.getPluginConfigById(result.lastInsertRowid as number);
      }
      
      return null;
    } catch (error) {
      console.error('Error creating plugin config:', error);
      return null;
    }
  }

  async updatePluginConfig(id: number, updates: Partial<Omit<PluginConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<PluginConfig | null> {
    try {
      const existingConfig = await this.getPluginConfigById(id);
      if (!existingConfig) {
        return null;
      }
      
      const now = new Date().toISOString();
      
      // Build the update query dynamically based on the provided fields
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.plugin_id !== undefined) {
        fields.push('plugin_id = ?');
        values.push(updates.plugin_id);
      }
      
      if (updates.user_id !== undefined) {
        fields.push('user_id = ?');
        values.push(updates.user_id);
      }
      
      if (updates.agent_id !== undefined) {
        fields.push('agent_id = ?');
        values.push(updates.agent_id);
      }
      
      if (updates.platform !== undefined) {
        fields.push('platform = ?');
        values.push(updates.platform);
      }
      
      if (updates.config !== undefined) {
        fields.push('config = ?');
        values.push(updates.config);
      }
      
      if (updates.enabled !== undefined) {
        fields.push('enabled = ?');
        values.push(updates.enabled ? 1 : 0);
      }
      
      fields.push('updated_at = ?');
      values.push(now);
      
      // Add the ID as the last parameter
      values.push(id);
      
      const stmt = this.db.prepare(`
        UPDATE plugin_configs
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      
      stmt.run(...values);
      
      return this.getPluginConfigById(id);
    } catch (error) {
      console.error(`Error updating plugin config with ID ${id}:`, error);
      return null;
    }
  }

  async deletePluginConfig(id: number): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM plugin_configs WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting plugin config with ID ${id}:`, error);
      return false;
    }
  }

  // Plugin Integration Methods

  async getPluginIntegrations(userId: string, agentId?: number): Promise<PluginIntegration[]> {
    try {
      let query = 'SELECT * FROM plugin_integrations WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (agentId !== undefined) {
        query += ' AND agent_id = ?';
        params.push(agentId);
      }
      
      const stmt = this.db.prepare(query);
      return stmt.all(...params) as PluginIntegration[];
    } catch (error) {
      console.error('Error getting plugin integrations:', error);
      return [];
    }
  }

  async getPluginIntegrationById(id: number): Promise<PluginIntegration | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM plugin_integrations WHERE id = ?');
      return stmt.get(id) as PluginIntegration || null;
    } catch (error) {
      console.error(`Error getting plugin integration with ID ${id}:`, error);
      return null;
    }
  }

  async getPluginIntegrationByExternalId(pluginId: string, externalId: string): Promise<PluginIntegration | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM plugin_integrations WHERE plugin_id = ? AND external_id = ?');
      return stmt.get(pluginId, externalId) as PluginIntegration || null;
    } catch (error) {
      console.error(`Error getting plugin integration for external ID ${externalId}:`, error);
      return null;
    }
  }

  async createPluginIntegration(integration: Omit<PluginIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<PluginIntegration | null> {
    try {
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT INTO plugin_integrations (user_id, agent_id, plugin_id, platform, external_id, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        integration.user_id,
        integration.agent_id,
        integration.plugin_id,
        integration.platform,
        integration.external_id,
        integration.metadata,
        now,
        now
      );
      
      if (result.lastInsertRowid) {
        return this.getPluginIntegrationById(result.lastInsertRowid as number);
      }
      
      return null;
    } catch (error) {
      console.error('Error creating plugin integration:', error);
      return null;
    }
  }

  async updatePluginIntegration(id: number, updates: Partial<Omit<PluginIntegration, 'id' | 'created_at' | 'updated_at'>>): Promise<PluginIntegration | null> {
    try {
      const existingIntegration = await this.getPluginIntegrationById(id);
      if (!existingIntegration) {
        return null;
      }
      
      const now = new Date().toISOString();
      
      // Build the update query dynamically based on the provided fields
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.user_id !== undefined) {
        fields.push('user_id = ?');
        values.push(updates.user_id);
      }
      
      if (updates.agent_id !== undefined) {
        fields.push('agent_id = ?');
        values.push(updates.agent_id);
      }
      
      if (updates.plugin_id !== undefined) {
        fields.push('plugin_id = ?');
        values.push(updates.plugin_id);
      }
      
      if (updates.platform !== undefined) {
        fields.push('platform = ?');
        values.push(updates.platform);
      }
      
      if (updates.external_id !== undefined) {
        fields.push('external_id = ?');
        values.push(updates.external_id);
      }
      
      if (updates.metadata !== undefined) {
        fields.push('metadata = ?');
        values.push(updates.metadata);
      }
      
      fields.push('updated_at = ?');
      values.push(now);
      
      // Add the ID as the last parameter
      values.push(id);
      
      const stmt = this.db.prepare(`
        UPDATE plugin_integrations
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      
      stmt.run(...values);
      
      return this.getPluginIntegrationById(id);
    } catch (error) {
      console.error(`Error updating plugin integration with ID ${id}:`, error);
      return null;
    }
  }

  async deletePluginIntegration(id: number): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM plugin_integrations WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting plugin integration with ID ${id}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const pluginDb = new PluginDatabase();
