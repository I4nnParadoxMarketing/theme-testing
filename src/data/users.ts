import { hashPin } from '../lib/pin';
import type { StoreUser } from '../types';

export async function createSeedUsers(): Promise<StoreUser[]> {
  const now = new Date().toISOString();
  const [adminHash, staffHash] = await Promise.all([hashPin('0000'), hashPin('1234')]);
  return [
    {
      id: 'user_admin',
      name: 'Boss / Admin',
      username: 'admin',
      role: 'admin',
      pinHash: adminHash,
      active: true,
      createdAt: now,
    },
    {
      id: 'user_staff',
      name: 'Staff Cashier',
      username: 'staff',
      role: 'staff',
      pinHash: staffHash,
      active: true,
      createdAt: now,
    },
  ];
}
