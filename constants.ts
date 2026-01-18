import { SystemConfig, User } from './types';

export const INITIAL_CONFIG: SystemConfig = {
  companyName: "Cekap Guard Insurance Solutions",
  address: "123 Business Avenue, Suite 400, Financial District",
  contact: "+60 3-9876 5432 | contact@cekapguard.com",
  logo: "https://picsum.photos/200/200",
  footerNotes: "Thank you for choosing Cekap Guard. This is a computer-generated document.",
  invoicePrefix: "INV-",
  receiptPrefix: "REC-"
};

export const MOCK_USERS: User[] = [
  // Fix: Changed 'Admin' to 'Owner' to match UserRole type definition
  { id: '1', name: 'Admin User', role: 'Owner' },
  { id: '2', name: 'John Doe', role: 'Staff' },
  { id: '3', name: 'Sarah Smith', role: 'Staff' }
];

export const VEHICLE_TYPES = ['Car', 'Bike'];
export const INSURANCE_TYPES = ['Comprehensive', 'Third Party', 'Theft & Fire'];

export const INSURANCE_COMPANIES = [
  "Takaful Ikhlas",
  "Etiqa Takaful",
  "Zurich Takaful",
  "Pacific",
  "Allianz",
  "Syarikat Takaful Malaysia"
];
