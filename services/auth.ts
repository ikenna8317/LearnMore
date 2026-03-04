import { User } from '../types';

const USERS_STORAGE_KEY = 'learn_more_users_db';
const SESSION_STORAGE_KEY = 'learn_more_session';

// Simple mock hash (do not use in production)
const hashPassword = (password: string) => btoa(password);

export const authService = {
  async signup(email: string, password: string, name: string): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      username: email.split('@')[0], // Default username derived from email
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
      preferences: {
        theme: 'system',
        assessmentLength: 'medium',
        noteLength: 'standard',
        emailNotifications: true
      }
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  getCurrentUser(): User | null {
    const session = localStorage.getItem(SESSION_STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const index = users.findIndex(u => u.id === userId);

    if (index === -1) throw new Error('User not found');

    const updatedUser = { ...users[index], ...updates };
    
    // Update DB
    users[index] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Update Session if it's the current user
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) throw new Error('User not found');
    
    const user = users[index];
    if (user.passwordHash !== hashPassword(currentPassword)) {
        throw new Error('Incorrect current password');
    }
    
    user.passwordHash = hashPassword(newPassword);
    users[index] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update active session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }
};