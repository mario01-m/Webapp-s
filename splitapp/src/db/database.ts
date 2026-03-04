import Dexie, { type Table } from 'dexie';
import type { Group } from '@/types';

// IndexedDB Database for AMMARIZE Split Bills
// More reliable than localStorage with larger storage capacity

class SplitBillsDatabase extends Dexie {
  groups!: Table<Group>;

  constructor() {
    super('SplitBillsDB');
    
    // Define database schema
    this.version(1).stores({
      groups: 'id, name, createdAt, updatedAt'
    });
  }

  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return await this.groups.toArray();
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    return await this.groups.get(id);
  }

  async addGroup(group: Group): Promise<string> {
    return await this.groups.add(group);
  }

  async updateGroup(id: string, changes: Partial<Group>): Promise<number> {
    return await this.groups.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async deleteGroup(id: string): Promise<void> {
    await this.groups.delete(id);
  }

  async saveGroup(group: Group): Promise<void> {
    await this.groups.put(group);
  }

  // Export all data
  async exportAllData(): Promise<Group[]> {
    return await this.getAllGroups();
  }

  // Import data (replace all)
  async importData(groups: Group[]): Promise<void> {
    await this.groups.clear();
    await this.groups.bulkAdd(groups);
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await this.groups.clear();
  }

  // Get database stats
  async getStats(): Promise<{ groups: number; totalBills: number }> {
    const groups = await this.getAllGroups();
    return {
      groups: groups.length,
      totalBills: groups.reduce((sum, g) => sum + g.bills.length, 0)
    };
  }
}

// Create singleton instance
export const db = new SplitBillsDatabase();

// Helper functions for common operations
export const generateGroupId = (): string => {
  return 'GRP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
};

export const generateBillId = (): string => {
  return 'BILL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
};

export const formatDateGregorian = (date: Date | string): string => {
  if (!date) return 'اليوم';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'اليوم';
  
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const parseDate = (dateStr: string): Date => {
  if (!dateStr || dateStr === 'اليوم') return new Date();
  
  const [day, month, year] = dateStr.split('/').map(Number);
  if (!day || !month || !year) return new Date();
  
  return new Date(year, month - 1, day);
};

export const formatMoney = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0.00";
  }
  
  const num = Math.abs(parseFloat(amount.toString()));
  let formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  let parts = formatted.split('.');
  const result = `${amount < 0 ? '-' : ''}${parts[0]}<span class="decimal-part">.${parts[1]}</span>`;
  return result;
};

export const formatMoneyPlain = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0.00";
  }
  
  return parseFloat(amount.toString()).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
