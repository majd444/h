/**
 * Database utilities for user management
 */

// Types for user entities
export interface User {
  id: string;
  email: string;
  name?: string;
  plan: 'free' | 'basic' | 'pro';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  subscription_id?: string;
  customer_id?: string;
  messages_used?: number;
  messages_limit?: number;
}

// Mock database for users - would be replaced with real database
const db: {
  users: User[];
} = {
  users: []
};

// Function to create a new user
export async function createUser(userData: Partial<User>): Promise<User> {
  // Generate a unique ID for the user
  const id = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Set message limits based on plan
  let messagesLimit = 250; // Default free tier
  if (userData.plan === 'basic') {
    messagesLimit = 2500;
  } else if (userData.plan === 'pro') {
    messagesLimit = 6000;
  }
  
  // Create the new user
  const newUser: User = {
    id,
    email: userData.email!,
    name: userData.name || userData.email!.split('@')[0],
    plan: userData.plan as 'free' | 'basic' | 'pro',
    status: userData.status as 'active' | 'inactive' | 'pending' || 'active',
    created_at: userData.created_at || new Date().toISOString(),
    subscription_id: userData.subscription_id,
    customer_id: userData.customer_id,
    messages_used: 0,
    messages_limit: messagesLimit
  };
  
  // Add to database
  db.users.push(newUser);
  console.log(`Created user: ${newUser.email} with plan: ${newUser.plan}`);
  
  return newUser;
}

// Function to get a user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = db.users.find(u => u.email === email);
  return user || null;
}

// Function to get a user by ID
export async function getUserById(id: string): Promise<User | null> {
  const user = db.users.find(u => u.id === id);
  return user || null;
}

// Function to update a user
export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const index = db.users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error(`User with id ${id} not found`);
  }
  
  // Update message limit if plan changes
  if (userData.plan && userData.plan !== db.users[index].plan) {
    if (userData.plan === 'free') {
      userData.messages_limit = 250;
    } else if (userData.plan === 'basic') {
      userData.messages_limit = 2500;
    } else if (userData.plan === 'pro') {
      userData.messages_limit = 6000;
    }
  }
  
  // Update the user
  db.users[index] = {
    ...db.users[index],
    ...userData
  };
  
  return db.users[index];
}

// For development purposes - get all users
export async function getAllUsers(): Promise<User[]> {
  return db.users;
}
