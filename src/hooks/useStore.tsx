import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { isCloudReady, loadCloudConfig, saveCloudConfig } from '../cloud/supabase';
import { pullCloud, pushCloud } from '../cloud/sync';
import { DEFAULT_SETTINGS, SEED_CUSTOMERS } from '../data/defaults';
import { SEED_PRODUCTS, SEED_SALES } from '../data/seed';
import { normalizePhMobile, uid } from '../lib/format';
import type {
  CloudConfig,
  Customer,
  Product,
  RecordSaleInput,
  Sale,
  StoreSettings,
} from '../types';

const STORAGE_KEY = 'gaba-hardware-store-v5';

interface PersistedState {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: StoreSettings;
}

interface StoreContextValue extends PersistedState {
  cloud: CloudConfig;
  cloudStatus: 'offline' | 'online' | 'syncing' | 'error';
  cloudError: string;
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
  updateCloudConfig: (config: CloudConfig) => Promise<void>;
  syncNow: () => Promise<void>;
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
  const { user, users, setUsers } = useAuth();
  const initial = loadState();
  const [products, setProducts] = useState<Product[]>(() => initial.products);
  const [sales, setSales] = useState<Sale[]>(() => initial.sales);
  const [customers, setCustomers] = useState<Customer[]>(() => initial.customers);
  const [settings, setSettings] = useState<StoreSettings>(() => initial.settings);
  const [cloud, setCloud] = useState<CloudConfig>(() => loadCloudConfig());
  const [cloudStatus, setCloudStatus] = useState<'offline' | 'online' | 'syncing' | 'error'>(
    () => (isCloudReady(loadCloudConfig()) ? 'online' : 'offline'),
  );
  const [cloudError, setCloudError] = useState('');
  const skipPush = useRef(false);

  useEffect(() => {
    const payload: PersistedState = { products, sales, customers, settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [products, sales, customers, settings]);

  const syncNow = useCallback(async () => {
    if (!isCloudReady(cloud)) {
      setCloudStatus('offline');
      return;
    }
    setCloudStatus('syncing');
    setCloudError('');
    try {
      await pushCloud(cloud, { products, sales, customers, settings, users });
      setCloudStatus('online');
    } catch (err) {
      setCloudStatus('error');
      setCloudError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [cloud, products, sales, customers, settings, users]);

  const pullNow = useCallback(async () => {
    if (!isCloudReady(cloud)) {
      setCloudStatus('offline');
      return;
    }
    setCloudStatus('syncing');
    setCloudError('');
    try {
      const remote = await pullCloud(cloud);
      if (remote) {
        skipPush.current = true;
        if (remote.products.length) setProducts(remote.products);
        if (remote.sales.length) setSales(remote.sales);
        if (remote.customers.length) setCustomers(remote.customers);
        setSettings(remote.settings);
        if (remote.users.length) setUsers(remote.users);
      }
      setCloudStatus('online');
    } catch (err) {
      setCloudStatus('error');
      setCloudError(err instanceof Error ? err.message : 'Pull failed');
    }
  }, [cloud, setUsers]);

  useEffect(() => {
    void pullNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud.enabled, cloud.supabaseUrl, cloud.supabaseAnonKey]);

  useEffect(() => {
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    if (!isCloudReady(cloud)) return;
    const timer = window.setTimeout(() => {
      void syncNow();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [products, sales, customers, settings, users, cloud, syncNow]);

  const updateCloudConfig = useCallback(
    async (config: CloudConfig) => {
      saveCloudConfig(config);
      setCloud(config);
      if (!isCloudReady(config)) {
        setCloudStatus('offline');
        return;
      }
      setCloudStatus('syncing');
      try {
        // Push local first so a new project gets seeded, then pull.
        await pushCloud(config, { products, sales, customers, settings, users });
        const remote = await pullCloud(config);
        if (remote) {
          skipPush.current = true;
          if (remote.products.length) setProducts(remote.products);
          if (remote.sales.length) setSales(remote.sales);
          if (remote.customers.length) setCustomers(remote.customers);
          setSettings(remote.settings);
          if (remote.users.length) setUsers(remote.users);
        }
        setCloudStatus('online');
        setCloudError('');
      } catch (err) {
        setCloudStatus('error');
        setCloudError(err instanceof Error ? err.message : 'Cloud connect failed');
      }
    },
    [products, sales, customers, settings, users, setUsers],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      sales,
      customers,
      settings,
      cloud,
      cloudStatus,
      cloudError,
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
          soldById: user?.id,
          soldByName: user?.name,
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
                c.id === existing.id ? { ...c, name: name || c.name, phone } : c,
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
      updateCloudConfig,
      syncNow,
      resetDemo: () => {
        const seeded = seedState();
        setProducts(seeded.products);
        setSales(seeded.sales);
        setCustomers(seeded.customers);
        setSettings(seeded.settings);
      },
    }),
    [
      products,
      sales,
      customers,
      settings,
      cloud,
      cloudStatus,
      cloudError,
      user,
      updateCloudConfig,
      syncNow,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
