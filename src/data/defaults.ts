import type { Customer, StoreSettings } from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Gaba Hardware',
  address: 'Philippines',
  phone: '',
  receiptFooter: 'Salamat! Thank you for your purchase.',
};

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Juan Dela Cruz',
    phone: '09171234567',
    note: 'Regular contractor',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Maria Santos',
    phone: '09181234567',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'Pedro Reyes',
    phone: '09201234567',
    note: 'Prefers GCash',
    createdAt: new Date().toISOString(),
  },
];
