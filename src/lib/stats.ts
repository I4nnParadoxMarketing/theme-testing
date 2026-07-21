import {
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  subDays,
} from 'date-fns';
import type { Product, Sale } from '../types';

export function salesInRange(sales: Sale[], from: Date, to: Date): Sale[] {
  const start = startOfDay(from).getTime();
  const end = endOfDay(to).getTime();
  return sales.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t >= start && t <= end;
  });
}

export function sumSales(sales: Sale[]): number {
  return sales.reduce((acc, s) => acc + s.total, 0);
}

export function todaySales(sales: Sale[]): Sale[] {
  const now = new Date();
  return sales.filter((s) => isSameDay(new Date(s.createdAt), now));
}

export function weekSeries(sales: Sale[]): { day: string; total: number; label: string }[] {
  const end = new Date();
  const start = subDays(end, 6);
  const days = eachDayOfInterval({ start, end });
  return days.map((day) => {
    const total = sales
      .filter((s) => isSameDay(new Date(s.createdAt), day))
      .reduce((acc, s) => acc + s.total, 0);
    return {
      day: format(day, 'yyyy-MM-dd'),
      label: format(day, 'EEE'),
      total: Math.round(total * 100) / 100,
    };
  });
}

export function lowStockProducts(products: Product[]): Product[] {
  return products
    .filter((p) => p.stock <= p.reorderAt)
    .sort((a, b) => a.stock / a.reorderAt - b.stock / b.reorderAt);
}

export function inventoryValue(products: Product[]): number {
  return products.reduce((acc, p) => acc + p.stock * p.cost, 0);
}

export function topSelling(
  sales: Sale[],
  limit = 5,
): { productId: string; name: string; qty: number; revenue: number }[] {
  const map = new Map<string, { productId: string; name: string; qty: number; revenue: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const prev = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        qty: 0,
        revenue: 0,
      };
      prev.qty += item.quantity;
      prev.revenue += item.quantity * item.unitPrice;
      map.set(item.productId, prev);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function stockStatus(product: Product): 'critical' | 'low' | 'ok' {
  if (product.stock <= Math.max(1, Math.floor(product.reorderAt * 0.4))) return 'critical';
  if (product.stock <= product.reorderAt) return 'low';
  return 'ok';
}
