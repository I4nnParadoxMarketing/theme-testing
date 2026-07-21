import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SEED_PRODUCTS, SEED_SALES } from '../data/seed';
import { uid } from '../lib/format';
import type { Product, RecordSaleInput, Sale } from '../types';

const STORAGE_KEY = 'gaba-hardware-store-v3';

interface StoreContextValue {
  products: Product[];
  sales: Sale[];
  recordSale: (input: RecordSaleInput) => Sale | null;
  adjustStock: (productId: string, delta: number) => void;
  updateProduct: (productId: string, patch: Partial<Product>) => void;
  addProduct: (input: Omit<Product, 'id'>) => void;
  updateSaleCustomer: (
    saleId: string,
    patch: Pick<Sale, 'customerName' | 'customerPhone'>,
  ) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): { products: Product[]; sales: Sale[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: SEED_PRODUCTS, sales: SEED_SALES };
    const parsed = JSON.parse(raw) as { products: Product[]; sales: Sale[] };
    if (!parsed.products?.length || !parsed.sales) {
      return { products: SEED_PRODUCTS, sales: SEED_SALES };
    }
    return parsed;
  } catch {
    return { products: SEED_PRODUCTS, sales: SEED_SALES };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadState().products);
  const [sales, setSales] = useState<Sale[]>(() => loadState().sales);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, sales }));
  }, [products, sales]);

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      sales,
      recordSale: (input) => {
        if (!input.items.length) return null;
        const total = input.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
        const sale: Sale = {
          id: uid('sale'),
          createdAt: new Date().toISOString(),
          items: input.items,
          total: Math.round(total * 100) / 100,
          paymentMethod: input.paymentMethod,
          customerName: input.customerName?.trim() || undefined,
          customerPhone: input.customerPhone?.trim() || undefined,
          note: input.note,
        };
        setSales((prev) => [sale, ...prev]);
        setProducts((prev) =>
          prev.map((p) => {
            const line = input.items.find((i) => i.productId === p.id);
            if (!line) return p;
            return { ...p, stock: Math.max(0, p.stock - line.quantity) };
          }),
        );
        return sale;
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
      resetDemo: () => {
        setProducts(SEED_PRODUCTS);
        setSales(SEED_SALES);
      },
    }),
    [products, sales],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
