export type Category =
  | 'Tools'
  | 'Fasteners'
  | 'Electrical'
  | 'Plumbing'
  | 'Paint'
  | 'Lumber';

export type UserRole = 'admin' | 'staff';

export interface StoreUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  pinHash: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  price: number;
  cost: number;
  stock: number;
  reorderAt: number;
  unit: string;
  /** Public path or compressed data URL */
  image?: string;
  favorite?: boolean;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'Cash' | 'GCash' | 'Card' | 'Bank transfer';

export interface Sale {
  id: string;
  createdAt: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  referenceNo?: string;
  voided?: boolean;
  voidedAt?: string;
  soldById?: string;
  soldByName?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  note?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enabled: boolean;
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: StoreSettings;
  users: StoreUser[];
}

export interface RecordSaleInput {
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  referenceNo?: string;
}
