import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DBManager, DB_KEYS, Account, Transaction, Category } from './db';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  getAccount: (accountId: string) => Account | undefined;

  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  getTransaction: (transactionId: string) => Transaction | undefined;
  getAccountTransactions: (accountId: string) => Transaction[];

  // Category operations
  addCategory: (category: Omit<Category, 'createdAt'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategory: (categoryId: string) => Category | undefined;

  // Data operations
  loadData: () => Promise<void>;
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
  clearAllData: () => Promise<void>;

  // Calculations
  getAccountBalance: (accountId: string) => number;
  getTotalBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpense: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await DBManager.init();
      const [loadedAccounts, loadedTransactions, loadedCategories] = await Promise.all([
        DBManager.getAll(DB_KEYS.ACCOUNTS),
        DBManager.getAll(DB_KEYS.TRANSACTIONS),
        DBManager.getAll(DB_KEYS.CATEGORIES),
      ]);
      setAccounts(loadedAccounts);
      setTransactions(loadedTransactions);
      setCategories(loadedCategories);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ في تحميل البيانات';
      setError(errorMsg);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Account operations
  const addAccount = useCallback(
    async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newAccount: Account = {
          ...accountData,
          id: `acc-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await DBManager.put(DB_KEYS.ACCOUNTS, newAccount);
        setAccounts([...accounts, newAccount]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في إضافة الحساب';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts]
  );

  const updateAccount = useCallback(
    async (account: Account) => {
      try {
        await DBManager.put(DB_KEYS.ACCOUNTS, account);
        setAccounts(accounts.map((a) => (a.id === account.id ? account : a)));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في تحديث الحساب';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      try {
        await DBManager.deleteItem(DB_KEYS.ACCOUNTS, accountId);
        setAccounts(accounts.filter((a) => a.id !== accountId));
        // Also delete associated transactions
        const accountTransactions = transactions.filter((t) => t.accountId === accountId);
        for (const transaction of accountTransactions) {
          await DBManager.deleteItem(DB_KEYS.TRANSACTIONS, transaction.id);
        }
        setTransactions(transactions.filter((t) => t.accountId !== accountId));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في حذف الحساب';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts, transactions]
  );

  const getAccount = useCallback((accountId: string) => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts]);

  // Transaction operations
  const addTransaction = useCallback(
    async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newTransaction: Transaction = {
          ...transactionData,
          id: `trn-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await DBManager.put(DB_KEYS.TRANSACTIONS, newTransaction);
        setTransactions([...transactions, newTransaction]);

        // Update account balance
        const account = accounts.find((a) => a.id === transactionData.accountId);
        if (account) {
          const updatedAccount = {
            ...account,
            balance: account.balance + transactionData.amount,
          };
          await updateAccount(updatedAccount);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في إضافة المعاملة';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts, transactions, updateAccount]
  );

  const updateTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        const oldTransaction = transactions.find((t) => t.id === transaction.id);
        if (!oldTransaction) throw new Error('المعاملة غير موجودة');

        // Calculate the difference in amount
        const amountDifference = transaction.amount - oldTransaction.amount;

        await DBManager.put(DB_KEYS.TRANSACTIONS, transaction);
        setTransactions(transactions.map((t) => (t.id === transaction.id ? transaction : t)));

        // Update account balance
        const account = accounts.find((a) => a.id === transaction.accountId);
        if (account) {
          const updatedAccount = {
            ...account,
            balance: account.balance + amountDifference,
          };
          await updateAccount(updatedAccount);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في تحديث المعاملة';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts, transactions, updateAccount]
  );

  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      try {
        const transaction = transactions.find((t) => t.id === transactionId);
        if (!transaction) throw new Error('المعاملة غير موجودة');

        await DBManager.deleteItem(DB_KEYS.TRANSACTIONS, transactionId);
        setTransactions(transactions.filter((t) => t.id !== transactionId));

        // Update account balance
        const account = accounts.find((a) => a.id === transaction.accountId);
        if (account) {
          const updatedAccount = {
            ...account,
            balance: account.balance - transaction.amount,
          };
          await updateAccount(updatedAccount);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في حذف المعاملة';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts, transactions, updateAccount]
  );

  const getTransaction = useCallback((transactionId: string) => {
    return transactions.find((t) => t.id === transactionId);
  }, [transactions]);

  const getAccountTransactions = useCallback((accountId: string) => {
    return transactions.filter((t) => t.accountId === accountId);
  }, [transactions]);

  // Category operations
  const addCategory = useCallback(
    async (categoryData: Omit<Category, 'createdAt'>) => {
      try {
        const newCategory: Category = {
          ...categoryData,
          createdAt: new Date().toISOString(),
        };
        await DBManager.put(DB_KEYS.CATEGORIES, newCategory);
        setCategories([...categories, newCategory]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في إضافة التصنيف';
        setError(errorMsg);
        throw err;
      }
    },
    [categories]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        // Check if category is in use
        const inUse = accounts.some((a) => a.categoryId === categoryId);
        if (inUse) throw new Error('لا يمكن حذف تصنيف يحتوي على حسابات');

        await DBManager.deleteItem(DB_KEYS.CATEGORIES, categoryId);
        setCategories(categories.filter((c) => c.id !== categoryId));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ في حذف التصنيف';
        setError(errorMsg);
        throw err;
      }
    },
    [accounts, categories]
  );

  const getCategory = useCallback((categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  }, [categories]);

  // Data operations
  const exportData = useCallback(async () => {
    try {
      return await DBManager.exportData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ في تصدير البيانات';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const importData = useCallback(async (data: any) => {
    try {
      await DBManager.importData(data);
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ في استيراد البيانات';
      setError(errorMsg);
      throw err;
    }
  }, [loadData]);

  const clearAllData = useCallback(async () => {
    try {
      await DBManager.clearAll();
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      await DBManager.init();
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ في حذف البيانات';
      setError(errorMsg);
      throw err;
    }
  }, [loadData]);

  // Calculations
  const getAccountBalance = useCallback((accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.balance || 0;
  }, [accounts]);

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  }, [accounts]);

  const getTotalIncome = useCallback(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const getTotalExpense = useCallback(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const value: AppContextType = {
    accounts,
    transactions,
    categories,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
    getAccountTransactions,
    addCategory,
    deleteCategory,
    getCategory,
    loadData,
    exportData,
    importData,
    clearAllData,
    getAccountBalance,
    getTotalBalance,
    getTotalIncome,
    getTotalExpense,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
