import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, SEED_CUSTOMERS } from '../data/defaults';
import { SEED_PRODUCTS, SEED_SALES } from '../data/seed';
import { normalizePhMobile, uid } from '../lib/format';
import type {
  Customer,
  Product,
  RecordSaleInput,
  Sale,
  StoreSettings,
} from '../types';

const STORAGE_KEY = 'gaba-hardware-store-v4';

interface PersistedState {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: StoreSettings;
}

interface StoreContextValue extends PersistedState {
  recordSale: (input: RecordSaleInput) => Sale | null;
  voidSale: (saleId: string) => void;
  adjustStock: (productId: string, delta: number) => void;
  updateProduct: (productId: string, patch: Partial<Product>) => void;
  addProduct: (input: Omit<Product, 'id'>) => void;
  toggleFavorite: (productId: string) => void;
  updateSaleCustomer: (
    saleId: string,
    patch: Pick<Sale, 'customerName' | 'customerPhone'>,
  ) => void;
  upsertCustomer: (input: { id?: string; name: string; phone: string; note?: string }) => Customer;
  deleteCustomer: (id: string) => void;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function seedState(): PersistedState {
  return {
    products: SEED_PRODUCTS.map((p, i) => ({
      ...p,
      favorite: i < 3,
    })),
    sales: SEED_SALES,
    customers: SEED_CUSTOMERS,
    settings: DEFAULT_SETTINGS,
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.products?.length || !parsed.sales) return seedState();
    return {
      products: parsed.products,
      sales: parsed.sales,
      customers: parsed.customers ?? SEED_CUSTOMERS,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return seedState();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [products, setProducts] = useState<Product[]>(() => initial.products);
  const [sales, setSales] = useState<Sale[]>(() => initial.sales);
  const [customers, setCustomers] = useState<Customer[]>(() => initial.customers);
  const [settings, setSettings] = useState<StoreSettings>(() => initial.settings);

  useEffect(() => {
    const payload: PersistedState = { products, sales, customers, settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [products, sales, customers, settings]);

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      sales,
      customers,
      settings,
      recordSale: (input) => {
        if (!input.items.length) return null;
        const total = input.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
        const phone = input.customerPhone?.trim();
        const name = input.customerName?.trim();
        const sale: Sale = {
          id: uid('sale'),
          createdAt: new Date().toISOString(),
          items: input.items,
          total: Math.round(total * 100) / 100,
          paymentMethod: input.paymentMethod,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          note: input.note?.trim() || undefined,
          referenceNo: input.referenceNo?.trim() || undefined,
        };
        setSales((prev) => [sale, ...prev]);
        setProducts((prev) =>
          prev.map((p) => {
            const line = input.items.find((i) => i.productId === p.id);
            if (!line) return p;
            return { ...p, stock: Math.max(0, p.stock - line.quantity) };
          }),
        );
        if (phone && normalizePhMobile(phone)) {
          setCustomers((prev) => {
            const existing = prev.find(
              (c) => normalizePhMobile(c.phone) === normalizePhMobile(phone),
            );
            if (existing) {
              return prev.map((c) =>
                c.id === existing.id
                  ? { ...c, name: name || c.name, phone: phone }
                  : c,
              );
            }
            return [
              {
                id: uid('cust'),
                name: name || 'Customer',
                phone,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ];
          });
        }
        return sale;
      },
      voidSale: (saleId) => {
        const sale = sales.find((s) => s.id === saleId);
        if (!sale || sale.voided) return;
        setProducts((productsPrev) =>
          productsPrev.map((p) => {
            const line = sale.items.find((i) => i.productId === p.id);
            if (!line) return p;
            return { ...p, stock: p.stock + line.quantity };
          }),
        );
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId
              ? { ...s, voided: true, voidedAt: new Date().toISOString() }
              : s,
          ),
        );
      },
      adjustStock: (productId, delta) => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        );
      },
      updateProduct: (productId, patch) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, ...patch, id: p.id } : p)),
        );
      },
      addProduct: (input) => {
        const product: Product = { ...input, id: uid('prod') };
        setProducts((prev) => [product, ...prev]);
      },
      toggleFavorite: (productId) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, favorite: !p.favorite } : p)),
        );
      },
      updateSaleCustomer: (saleId, patch) => {
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId
              ? {
                  ...s,
                  customerName: patch.customerName?.trim() || undefined,
                  customerPhone: patch.customerPhone?.trim() || undefined,
                }
              : s,
          ),
        );
      },
      upsertCustomer: (input) => {
        const phone = input.phone.trim();
        const name = input.name.trim();
        if (input.id) {
          const updated: Customer = {
            id: input.id,
            name,
            phone,
            note: input.note?.trim() || undefined,
            createdAt:
              customers.find((c) => c.id === input.id)?.createdAt ?? new Date().toISOString(),
          };
          setCustomers((prev) => prev.map((c) => (c.id === input.id ? updated : c)));
          return updated;
        }
        const created: Customer = {
          id: uid('cust'),
          name,
          phone,
          note: input.note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        setCustomers((prev) => [created, ...prev]);
        return created;
      },
      deleteCustomer: (id) => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      },
      updateSettings: (patch) => {
        setSettings((prev) => ({ ...prev, ...patch }));
      },
      resetDemo: () => {
        const seeded = seedState();
        setProducts(seeded.products);
        setSales(seeded.sales);
        setCustomers(seeded.customers);
        setSettings(seeded.settings);
      },
    }),
    [products, sales, customers, settings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
