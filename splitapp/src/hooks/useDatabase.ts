import { useState, useEffect, useCallback } from 'react';
import { db, generateGroupId, generateBillId } from '@/db/database';
import type { Group, Bill } from '@/types';

// Custom hook for database operations
export const useDatabase = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.getAllGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new group
  const createGroup = useCallback(async (name: string, members: string[]): Promise<Group | null> => {
    try {
      const newGroup: Group = {
        id: generateGroupId(),
        name: name.trim(),
        members: [...new Set(members.map(m => m.trim()).filter(m => m))],
        bills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        defaultPayer: members[0] || ''
      };

      await db.addGroup(newGroup);
      await loadGroups();
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, [loadGroups]);

  // Update group
  const updateGroup = useCallback(async (groupId: string, changes: Partial<Group>): Promise<boolean> => {
    try {
      await db.updateGroup(groupId, changes);
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      return false;
    }
  }, [loadGroups]);

  // Delete group
  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      await db.deleteGroup(groupId);
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      return false;
    }
  }, [loadGroups]);

  // Add bill to group
  const addBill = useCallback(async (groupId: string, billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const group = await db.getGroupById(groupId);
      if (!group) return false;

      const newBill: Bill = {
        ...billData,
        id: generateBillId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      group.bills.push(newBill);
      group.updatedAt = new Date().toISOString();

      await db.saveGroup(group);
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error adding bill:', error);
      return false;
    }
  }, [loadGroups]);

  // Update bill
  const updateBill = useCallback(async (groupId: string, billId: string, changes: Partial<Bill>): Promise<boolean> => {
    try {
      const group = await db.getGroupById(groupId);
      if (!group) return false;

      const billIndex = group.bills.findIndex(b => b.id === billId);
      if (billIndex === -1) return false;

      group.bills[billIndex] = {
        ...group.bills[billIndex],
        ...changes,
        updatedAt: new Date().toISOString()
      };

      group.updatedAt = new Date().toISOString();
      await db.saveGroup(group);
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error updating bill:', error);
      return false;
    }
  }, [loadGroups]);

  // Delete bill
  const deleteBill = useCallback(async (groupId: string, billId: string): Promise<boolean> => {
    try {
      const group = await db.getGroupById(groupId);
      if (!group) return false;

      group.bills = group.bills.filter(b => b.id !== billId);
      group.updatedAt = new Date().toISOString();

      await db.saveGroup(group);
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error deleting bill:', error);
      return false;
    }
  }, [loadGroups]);

  // Import data
  const importData = useCallback(async (data: Group[]): Promise<boolean> => {
    try {
      await db.importData(data);
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, [loadGroups]);

  // Export data
  const exportData = useCallback(async (): Promise<Group[]> => {
    try {
      return await db.exportAllData();
    } catch (error) {
      console.error('Error exporting data:', error);
      return [];
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(async (): Promise<boolean> => {
    try {
      await db.clearAllData();
      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }, [loadGroups]);

  // Get group by ID
  const getGroupById = useCallback(async (groupId: string): Promise<Group | undefined> => {
    return await db.getGroupById(groupId);
  }, []);

  return {
    groups,
    loading,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addBill,
    updateBill,
    deleteBill,
    importData,
    exportData,
    clearAllData,
    getGroupById
  };
};
