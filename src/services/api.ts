import { UserAccount, ShopSettings } from '../types';
import type { Kind } from '../../shared/syncCore';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(method: string, path: string, body?: unknown, timeoutMs = 20000): Promise<T> {
  let res: Response;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    res = await fetch(`/api/${path}`, {
      signal: ctrl.signal,
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Réseau indisponible', 0);
  } finally {
    clearTimeout(timer);
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* corps vide ou non JSON */ }
  if (!res.ok) {
    throw new ApiError(
      data?.error || (res.status === 404 ? "Le serveur (API) n'est pas disponible." : `Erreur ${res.status}`),
      res.status
    );
  }
  return data as T;
}

export interface SyncChange {
  k: Kind; id: string; t: number; d?: any; del?: boolean | number; c?: Record<string, number>;
}
export interface PullResponse { changes: SyncChange[]; cursor: number; more: boolean; now: number }
export interface PushResponse {
  results: Array<{ k: string; id: string; s: 'ok' | 'adopt' | 'denied'; d?: any; del?: number }>;
  seq: number; now: number;
}
export interface MeResponse { user: UserAccount; shop: ShopSettings | null }

export interface AdminItem {
  user: UserAccount;
  shop: ShopSettings | null;
  teamCount: number;
  stats: { salesCount: number; revenueTotal: number; lastActivity: string | null; revenue30d: number; sales30d: number };
}
export interface AdminKpis { merchants: number; active: number; new30: number; formalized: number; revenue30d: number; sales30d: number }
export interface AdminListResponse {
  page: number; pageSize: number; total: number; pages: number;
  kpis: AdminKpis;
  items: AdminItem[];
  resetRequests: { userId: string; createdAt: string; name: string; phone: string; shopRole: string }[];
}
export interface AdminQuery { page?: number; q?: string; status?: string; sector?: string }

export interface TeamMember {
  id: string; name: string; phone: string; email: string; shopRole: 'owner' | 'manager' | 'cashier';
  status: 'active' | 'suspended'; createdAt: string; lastLoginAt: string;
}

export interface RegisterInput {
  fullName: string; email: string; phone: string; password: string;
  shopName: string; businessCategory: string; city: string; country: string;
}

export const api = {
  me: () => call<MeResponse>('GET', 'auth/me?v=3', undefined, 8000),
  forgot: (identifier: string) =>
    call<{ ok: true; contact: string }>('POST', 'auth/forgot', { identifier }),
  login: (identifier: string, password: string) =>
    call<{ user: UserAccount; shop: ShopSettings | null }>('POST', 'auth/login', { identifier, password }),
  register: (input: RegisterInput) =>
    call<{ user: UserAccount; shop: ShopSettings }>('POST', 'auth/register', input),
  logout: () => call<{ ok: true }>('POST', 'auth/logout', {}),
  changePassword: (currentPassword: string, newPassword: string) =>
    call<{ ok: true }>('POST', 'auth/password', { currentPassword, newPassword }),

  syncPull: (since: number, shopId?: string) =>
    call<PullResponse>('GET', `sync?since=${since}${shopId ? `&shop=${encodeURIComponent(shopId)}` : ''}`, undefined, 30000),
  syncPush: (batch: string, changes: SyncChange[]) =>
    call<PushResponse>('POST', 'sync', { batch, changes }, 40000),

  teamList: () => call<{ members: TeamMember[] }>('GET', 'team'),
  teamAdd: (m: { name: string; phone: string; email?: string; password: string; shopRole: 'manager' | 'cashier' }) =>
    call<{ member: TeamMember }>('POST', 'team', m),
  teamUpdate: (id: string, patch: { status?: 'active' | 'suspended'; shopRole?: 'manager' | 'cashier' }) =>
    call<{ ok: true }>('PATCH', `team/${id}`, patch),
  teamResetPassword: (id: string, newPassword: string) =>
    call<{ ok: true }>('POST', `team/${id}/reset-password`, { newPassword }),
  teamRemove: (id: string) => call<{ ok: true }>('DELETE', `team/${id}`),

  adminList: (qy: AdminQuery = {}) => {
    const p = new URLSearchParams();
    if (qy.page && qy.page > 1) p.set('page', String(qy.page));
    if (qy.q) p.set('q', qy.q);
    if (qy.status && qy.status !== 'all') p.set('status', qy.status);
    if (qy.sector && qy.sector !== 'all') p.set('sector', qy.sector);
    const s = p.toString();
    return call<AdminListResponse>('GET', `admin/users${s ? '?' + s : ''}`);
  },
  adminExportUrl: '/api/admin/export',
  adminSetStatus: (id: string, status: 'active' | 'suspended') =>
    call<{ ok: true }>('PATCH', `admin/users/${id}`, { status }),
  adminResetPassword: (id: string, newPassword: string) =>
    call<{ ok: true }>('POST', `admin/users/${id}/reset-password`, { newPassword }),
  adminDelete: (id: string) => call<{ ok: true }>('DELETE', `admin/users/${id}`),
};
