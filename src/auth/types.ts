export type UserRole = 'admin' | 'staff';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  passwordHash: string;
  displayName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  loggedInAt: string;
}
