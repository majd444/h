/**
 * Simple database query interface for Sevalla
 * This is a placeholder that would typically connect to a real database
 */

// Types for database entities
export interface Agent {
  id: number; // Changed to number to match Dashboard interface
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'busy';
  created_at: Date; // Using snake_case to match frontend
  updated_at: Date; // Using snake_case to match frontend
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

// Mock database - would be replaced with real database connection
const db: {
  agents: Agent[];
} = {
  agents: [
    {
      id: 1, // Changed to number
      name: 'Default Agent',
      description: 'A default agent for demonstration',
      status: 'online',
      created_at: new Date(),
      updated_at: new Date(),
      userId: 'default-user',
      chatbot_name: 'AI Assistant',
      system_prompt: 'You are a helpful AI assistant.',
      top_color: '#1f2937',
      accent_color: '#3B82F6',
      background_color: '#F3F4F6',
      is_active: true,
      avatar_url: '',
      workflow_id: '1'
    }
  ]
};

// Query function to retrieve data
export async function query<T>(collection: string, filter: Record<string, any> = {}): Promise<T[]> {
  // This is a mock implementation
  if (collection === 'agents') {
    return db.agents.filter(agent => {
      // Apply filters
      for (const [key, value] of Object.entries(filter)) {
        if (agent[key as keyof Agent] !== value) {
          return false;
        }
      }
      return true;
    }) as unknown as T[];
  }
  
  return [];
}

// Create function to add new data
export async function create<T>(collection: string, data: Partial<T>): Promise<T> {
  if (collection === 'agents') {
    // Cast the generic data to a more specific type
    const agentData = data as unknown as Partial<Agent>;
    
    // Create agent with snake_case date fields
    const newAgent = {
      id: db.agents.length + 1, // Changed to number
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
      chatbot_name: agentData.chatbot_name || 'AI Assistant',
      system_prompt: agentData.system_prompt || 'You are a helpful AI assistant.',
      top_color: agentData.top_color || '#1f2937',
      accent_color: agentData.accent_color || '#3B82F6',
      background_color: agentData.background_color || '#F3F4F6',
      is_active: agentData.is_active !== undefined ? agentData.is_active : true,
      avatar_url: agentData.avatar_url || '',
      workflow_id: agentData.workflow_id || '1'
    } as unknown as Agent;
    
    db.agents.push(newAgent);
    return newAgent as unknown as T;
  }
  
  throw new Error(`Collection ${collection} not supported`);
}

// Update function to modify existing data
export async function update<T>(collection: string, id: number | string, data: Partial<T>): Promise<T> {
  if (collection === 'agents') {
    // Ensure id is treated as a number for comparison
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = db.agents.findIndex(agent => agent.id === numericId);
    if (index === -1) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    db.agents[index] = {
      ...db.agents[index],
      ...data,
      updated_at: new Date() // Use snake_case for consistency
    };
    
    return db.agents[index] as unknown as T;
  }
  
  throw new Error(`Collection ${collection} not supported`);
}

// Delete function to remove data
export async function remove(collection: string, id: number | string): Promise<void> {
  if (collection === 'agents') {
    // Ensure id is treated as a number for comparison
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = db.agents.findIndex(agent => agent.id === numericId);
    if (index === -1) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    db.agents.splice(index, 1);
    return;
  }
  
  throw new Error(`Collection ${collection} not supported`);
}
