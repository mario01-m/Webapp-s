import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Database keys for AsyncStorage
 */
export const DB_KEYS = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
} as const;

/**
 * Type definitions for data models
 */
export interface Account {
  id: string;
  name: string;
  balance: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
  transferId?: string;
  isTransfer?: boolean;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Settings {
  key: string;
  value: any;
}

/**
 * Database Manager for AsyncStorage operations
 */
export const DBManager = {
  /**
   * Initialize database with default data
   */
  async init() {
    try {
      const categories = await this.getAll(DB_KEYS.CATEGORIES);
      if (categories.length === 0) {
        const defaultCategories: Category[] = [
          { id: 'cat-1', name: 'شخصي', createdAt: new Date().toISOString() },
          { id: 'cat-2', name: 'عمل', createdAt: new Date().toISOString() },
          { id: 'cat-3', name: 'عائلة', createdAt: new Date().toISOString() },
        ];

        for (const category of defaultCategories) {
          await this.put(DB_KEYS.CATEGORIES, category);
        }
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  },

  /**
   * Get all items from a store
   */
  async getAll(storeName: string): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(storeName);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting all items from ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Get a single item by ID
   */
  async getById(storeName: string, id: string): Promise<any | null> {
    try {
      const items = await this.getAll(storeName);
      return items.find((item) => item.id === id) || null;
    } catch (error) {
      console.error(`Error getting item ${id} from ${storeName}:`, error);
      return null;
    }
  },

  /**
   * Get items by index/property
   */
  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    try {
      const items = await this.getAll(storeName);
      return items.filter((item) => item[indexName] === value);
    } catch (error) {
      console.error(`Error getting items by index ${indexName} from ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Add or update an item
   */
  async put(storeName: string, item: any): Promise<any> {
    try {
      const items = await this.getAll(storeName);
      const index = items.findIndex((i) => i.id === item.id);

      if (index !== -1) {
        items[index] = { ...items[index], ...item, updatedAt: new Date().toISOString() };
      } else {
        items.push({
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem(storeName, JSON.stringify(items));
      return item;
    } catch (error) {
      console.error(`Error putting item in ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Delete an item by ID
   */
  async deleteItem(storeName: string, id: string): Promise<void> {
    try {
      const items = await this.getAll(storeName);
      const filtered = items.filter((item) => item.id !== id);
      await AsyncStorage.setItem(storeName, JSON.stringify(filtered));
    } catch (error) {
      console.error(`Error deleting item ${id} from ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Clear all items from a store
   */
  async clear(storeName: string): Promise<void> {
    try {
      await AsyncStorage.setItem(storeName, JSON.stringify([]));
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Clear all data from database
   */
  async clearAll(): Promise<void> {
    try {
      await this.clear(DB_KEYS.ACCOUNTS);
      await this.clear(DB_KEYS.TRANSACTIONS);
      await this.clear(DB_KEYS.CATEGORIES);
      await this.clear(DB_KEYS.SETTINGS);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },

  /**
   * Export all data
   */
  async exportData() {
    try {
      const accounts = await this.getAll(DB_KEYS.ACCOUNTS);
      const transactions = await this.getAll(DB_KEYS.TRANSACTIONS);
      const categories = await this.getAll(DB_KEYS.CATEGORIES);
      const settings = await this.getAll(DB_KEYS.SETTINGS);

      return {
        accounts,
        transactions,
        categories,
        settings,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  /**
   * Import data
   */
  async importData(data: any): Promise<void> {
    try {
      await this.clearAll();

      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          await this.put(DB_KEYS.ACCOUNTS, account);
        }
      }

      if (data.transactions && Array.isArray(data.transactions)) {
        for (const transaction of data.transactions) {
          await this.put(DB_KEYS.TRANSACTIONS, transaction);
        }
      }

      if (data.categories && Array.isArray(data.categories)) {
        for (const category of data.categories) {
          await this.put(DB_KEYS.CATEGORIES, category);
        }
      }

      if (data.settings && Array.isArray(data.settings)) {
        for (const setting of data.settings) {
          await this.put(DB_KEYS.SETTINGS, setting);
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },
};
