export type Category =
  | 'Tools'
  | 'Fasteners'
  | 'Electrical'
  | 'Plumbing'
  | 'Paint'
  | 'Lumber';

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
}

export interface AppState {
  products: Product[];
  sales: Sale[];
}

export interface RecordSaleInput {
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  note?: string;
}
