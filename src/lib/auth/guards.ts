import { auth, type UserRole } from './config';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect('/');
  }
  return session;
}

export async function requireAdmin() {
  return requireRole('admin');
}

export async function requireLeader() {
  return requireRole('admin', 'leader');
}

export async function requireOfficer() {
  return requireRole('admin', 'leader', 'officer');
}

export function canManageOps(role: UserRole): boolean {
  return ['admin', 'leader', 'officer'].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return ['admin', 'leader'].includes(role);
}

export function canViewTroops(role: UserRole): boolean {
  return ['admin', 'leader', 'officer'].includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
