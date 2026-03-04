// Types for AMMARIZE Split Bills App

export interface BillDistribution {
  [memberName: string]: number;
}

export interface Bill {
  id: string;
  desc: string;
  amount: number;
  payer: string;
  date: string;
  distribution: BillDistribution;
  createdAt: string;
  updatedAt: string;
  isAdvancedPayment?: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  bills: Bill[];
  createdAt: string;
  updatedAt: string;
  defaultPayer: string;
}

export type SortMethod = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
export type FilterType = 'all' | 'today' | 'week' | 'month';
export type ReportType = 'all' | 'by_member';

export interface MemberBalance {
  member: string;
  paid: number;
  owed: number;
  balance: number;
}

export interface GroupStats {
  totalBills: number;
  totalAmount: number;
  totalMembers: number;
}
