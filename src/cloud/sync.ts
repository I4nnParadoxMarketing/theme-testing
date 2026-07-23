import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CloudConfig,
  Customer,
  Product,
  Sale,
  StoreSettings,
  StoreUser,
} from '../types';
import { createSupabase, isCloudReady } from './supabase';

export interface SyncBundle {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: StoreSettings;
  users: StoreUser[];
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    sku: String(row.sku),
    category: row.category as Product['category'],
    price: Number(row.price),
    cost: Number(row.cost),
    stock: Number(row.stock),
    reorderAt: Number(row.reorder_at),
    unit: String(row.unit),
    image: (row.image as string) || undefined,
    favorite: Boolean(row.favorite),
  };
}

function mapSale(row: Record<string, unknown>): Sale {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    total: Number(row.total),
    paymentMethod: row.payment_method as Sale['paymentMethod'],
    customerName: (row.customer_name as string) || undefined,
    customerPhone: (row.customer_phone as string) || undefined,
    note: (row.note as string) || undefined,
    referenceNo: (row.reference_no as string) || undefined,
    voided: Boolean(row.voided),
    voidedAt: (row.voided_at as string) || undefined,
    soldById: (row.sold_by_id as string) || undefined,
    soldByName: (row.sold_by_name as string) || undefined,
    items: (row.items as Sale['items']) ?? [],
  };
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    note: (row.note as string) || undefined,
    createdAt: String(row.created_at),
  };
}

function mapUser(row: Record<string, unknown>): StoreUser {
  return {
    id: String(row.id),
    name: String(row.name),
    username: String(row.username),
    role: row.role as StoreUser['role'],
    pinHash: String(row.pin_hash),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}

export async function pullCloud(config: CloudConfig): Promise<SyncBundle | null> {
  if (!isCloudReady(config)) return null;
  const sb = createSupabase(config);
  if (!sb) return null;

  const [settingsRes, productsRes, salesRes, customersRes, usersRes] = await Promise.all([
    sb.from('store_settings').select('*').eq('id', 'main').maybeSingle(),
    sb.from('products').select('*'),
    sb.from('sales').select('*').order('created_at', { ascending: false }),
    sb.from('customers').select('*').order('created_at', { ascending: false }),
    sb.from('store_users').select('*').order('created_at', { ascending: true }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (salesRes.error) throw salesRes.error;
  if (customersRes.error) throw customersRes.error;
  if (usersRes.error) throw usersRes.error;

  const settingsRow = settingsRes.data;
  const settings: StoreSettings = settingsRow
    ? {
        storeName: String(settingsRow.store_name),
        address: String(settingsRow.address),
        phone: String(settingsRow.phone),
        receiptFooter: String(settingsRow.receipt_footer),
      }
    : {
        storeName: 'Gaba Hardware',
        address: 'Philippines',
        phone: '',
        receiptFooter: 'Salamat! Thank you for your purchase.',
      };

  return {
    settings,
    products: (productsRes.data ?? []).map((r) => mapProduct(r as Record<string, unknown>)),
    sales: (salesRes.data ?? []).map((r) => mapSale(r as Record<string, unknown>)),
    customers: (customersRes.data ?? []).map((r) => mapCustomer(r as Record<string, unknown>)),
    users: (usersRes.data ?? []).map((r) => mapUser(r as Record<string, unknown>)),
  };
}

export async function pushCloud(config: CloudConfig, bundle: SyncBundle): Promise<void> {
  if (!isCloudReady(config)) return;
  const sb = createSupabase(config);
  if (!sb) return;

  await upsertSettings(sb, bundle.settings);
  await upsertUsers(sb, bundle.users);
  await upsertProducts(sb, bundle.products);
  await upsertCustomers(sb, bundle.customers);
  await upsertSales(sb, bundle.sales);
}

async function upsertSettings(sb: SupabaseClient, settings: StoreSettings) {
  const { error } = await sb.from('store_settings').upsert({
    id: 'main',
    store_name: settings.storeName,
    address: settings.address,
    phone: settings.phone,
    receipt_footer: settings.receiptFooter,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function upsertUsers(sb: SupabaseClient, users: StoreUser[]) {
  if (!users.length) return;
  const { error } = await sb.from('store_users').upsert(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      pin_hash: u.pinHash,
      active: u.active,
      created_at: u.createdAt,
    })),
  );
  if (error) throw error;
}

async function upsertProducts(sb: SupabaseClient, products: Product[]) {
  if (!products.length) return;
  const { error } = await sb.from('products').upsert(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      reorder_at: p.reorderAt,
      unit: p.unit,
      image: p.image ?? null,
      favorite: Boolean(p.favorite),
      updated_at: new Date().toISOString(),
    })),
  );
  if (error) throw error;
}

async function upsertCustomers(sb: SupabaseClient, customers: Customer[]) {
  if (!customers.length) return;
  const { error } = await sb.from('customers').upsert(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      note: c.note ?? null,
      created_at: c.createdAt,
    })),
  );
  if (error) throw error;
}

async function upsertSales(sb: SupabaseClient, sales: Sale[]) {
  if (!sales.length) return;
  const { error } = await sb.from('sales').upsert(
    sales.map((s) => ({
      id: s.id,
      created_at: s.createdAt,
      total: s.total,
      payment_method: s.paymentMethod,
      customer_name: s.customerName ?? null,
      customer_phone: s.customerPhone ?? null,
      note: s.note ?? null,
      reference_no: s.referenceNo ?? null,
      voided: Boolean(s.voided),
      voided_at: s.voidedAt ?? null,
      sold_by_id: s.soldById ?? null,
      sold_by_name: s.soldByName ?? null,
      items: s.items,
    })),
  );
  if (error) throw error;
}

export async function logActivity(
  config: CloudConfig,
  entry: { actorId?: string; actorName?: string; action: string; detail?: string },
) {
  if (!isCloudReady(config)) return;
  const sb = createSupabase(config);
  if (!sb) return;
  await sb.from('activity_log').insert({
    actor_id: entry.actorId ?? null,
    actor_name: entry.actorName ?? null,
    action: entry.action,
    detail: entry.detail ?? null,
  });
}
