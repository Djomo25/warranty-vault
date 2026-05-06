export type WarrantyStatus = 'active' | 'expiring' | 'expired';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  category: string;
  purchase_date: string;
  warranty_months: number;
  warranty_end: string;
  price?: number;
  store?: string;
  notes?: string;
  invoice_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductForm {
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category: string;
  purchaseDate: string;
  warrantyMonths: number;
  price?: number;
  store?: string;
  notes?: string;
}

export const CATEGORIES = [
  'Électroménager',
  'Informatique',
  'Téléphonie',
  'Audiovisuel',
  'Mobilier',
  'Outillage',
  'Automobile',
  'Autre',
] as const;

export function getWarrantyStatus(warrantyEnd: string): WarrantyStatus {
  const end = new Date(warrantyEnd);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'active';
}

export function getDaysRemaining(warrantyEnd: string): number {
  const end = new Date(warrantyEnd);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
