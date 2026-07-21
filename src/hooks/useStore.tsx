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
import type { Product, Sale, SaleItem } from '../types';

const STORAGE_KEY = 'boltyard-store-v1';

interface StoreContextValue {
  products: Product[];
  sales: Sale[];
  recordSale: (items: SaleItem[], paymentMethod: Sale['paymentMethod'], note?: string) => void;
  adjustStock: (productId: string, delta: number) => void;
  updateProduct: (productId: string, patch: Partial<Product>) => void;
  addProduct: (input: Omit<Product, 'id'>) => void;
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
      recordSale: (items, paymentMethod, note) => {
        if (!items.length) return;
        const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
        const sale: Sale = {
          id: uid('sale'),
          createdAt: new Date().toISOString(),
          items,
          total: Math.round(total * 100) / 100,
          paymentMethod,
          note,
        };
        setSales((prev) => [sale, ...prev]);
        setProducts((prev) =>
          prev.map((p) => {
            const line = items.find((i) => i.productId === p.id);
            if (!line) return p;
            return { ...p, stock: Math.max(0, p.stock - line.quantity) };
          }),
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
