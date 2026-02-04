
export type VehicleType = 'Motor' | 'Others';
export type InsuranceType = 'Comprehensive' | 'Third Party' | 'Fire & Theft';
export type OthersCategory = 'Public Liability' | 'Contractor All Risk' | "Workmen's Compensation" | 'Bond';
export type DocType = 'Invoice' | 'Receipt';

/** For Others: one category with its insurance amount */
export interface OthersEntry {
  category: OthersCategory;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  ic: string;
  email: string;
  vehicleType: VehicleType;
  vehicleRegNo: string;
  insuranceType: InsuranceType;
  othersCategory?: OthersCategory;
  isCompany?: boolean;
  lastUpdated: string;
}

export interface Document {
  id: string;
  docNumber: string;
  type: DocType;
  customerId: string;
  customerName: string;
  customerIc: string;
  issuedCompany: string;
  date: string;
  amount: number;
  insuranceDetails: string;
  remarks: string;
  staffId: string;
  staffName: string;
  othersCategory?: OthersCategory;
  /** For Others: multiple categories with individual amounts */
  othersEntries?: OthersEntry[];
  /** Optional service charge amount */
  serviceCharge?: number;
  attachmentUrl?: string;
  /** When invoice was marked paid (ISO date); receipt id and number created */
  paidAt?: string;
  receiptId?: string;
  receiptDocNumber?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  docId?: string;
}

export interface SystemConfig {
  companyName: string;
  address: string;
  contact: string;
  logo: string;
  footerNotes: string;
  invoicePrefix: string;
  receiptPrefix: string;
}

export type UserRole = 'Owner' | 'Staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}
