import type { UserRole } from '../types';

export type Permission =
  | 'sale.create'
  | 'sale.void'
  | 'inventory.edit'
  | 'inventory.adjust'
  | 'customers.manage'
  | 'reports.view'
  | 'settings.manage'
  | 'staff.manage'
  | 'cloud.manage'
  | 'demo.reset';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'sale.create',
    'sale.void',
    'inventory.edit',
    'inventory.adjust',
    'customers.manage',
    'reports.view',
    'settings.manage',
    'staff.manage',
    'cloud.manage',
    'demo.reset',
  ],
  staff: [
    'sale.create',
    'inventory.adjust',
    'customers.manage',
    'reports.view',
  ],
};

export function can(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}
