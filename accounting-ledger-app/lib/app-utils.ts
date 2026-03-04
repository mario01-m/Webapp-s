/**
 * Utility functions for the accounting app
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format number with Arabic locale
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date in Arabic locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Validate number
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Error cloning object:', error);
    return obj;
  }
}

/**
 * Validate field
 */
export interface ValidationRules {
  required?: boolean;
  number?: boolean;
  positive?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateField(value: any, rules: ValidationRules = {}): ValidationResult {
  const errors: string[] = [];

  if (rules.required && (!value || String(value).trim() === '')) {
    errors.push('هذا الحقل مطلوب');
  }

  if (rules.number && !isValidNumber(value)) {
    errors.push('يجب إدخال رقم صحيح');
  }

  if (rules.positive && parseFloat(value) < 0) {
    errors.push('يجب أن يكون الرقم موجباً');
  }

  if (rules.minLength && String(value).length < rules.minLength) {
    errors.push(`الحد الأدنى ${rules.minLength} أحرف`);
  }

  if (rules.maxLength && String(value).length > rules.maxLength) {
    errors.push(`الحد الأقصى ${rules.maxLength} حرف`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate account balance from transactions
 */
export function calculateBalance(transactions: any[]): number {
  if (!transactions || transactions.length === 0) return 0;

  return transactions.reduce((sum, transaction) => {
    const amount = parseFloat(transaction.amount) || 0;
    return sum + amount;
  }, 0);
}

/**
 * Sort array by multiple fields
 */
export type SortKey = 'date-desc' | 'date-asc' | 'balance-desc' | 'balance-asc' | 'amount-desc' | 'amount-asc';

export function sortBy<T>(array: T[], sortKey: SortKey): T[] {
  const cloned = [...array];

  switch (sortKey) {
    case 'date-desc':
      return cloned.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      });

    case 'date-asc':
      return cloned.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateA - dateB;
      });

    case 'balance-desc':
    case 'amount-desc':
      return cloned.sort((a: any, b: any) => {
        const valA = parseFloat(a.balance || a.amount || 0);
        const valB = parseFloat(b.balance || b.amount || 0);
        return valB - valA;
      });

    case 'balance-asc':
    case 'amount-asc':
      return cloned.sort((a: any, b: any) => {
        const valA = parseFloat(a.balance || a.amount || 0);
        const valB = parseFloat(b.balance || b.amount || 0);
        return valA - valB;
      });

    default:
      return cloned;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Get current timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Convert ISO date to YYYY-MM-DD format
 */
export function dateToInputFormat(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD format to ISO date
 */
export function inputFormatToDate(dateStr: string): string {
  return new Date(dateStr).toISOString();
}
