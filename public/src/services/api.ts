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

export interface Announcement { id: string; title: string; body: string; level: 'info' | 'important'; createdAt: string; read: boolean }
export interface AdminAnnouncement { id: string; title: string; body: string; audience: string; level: string; createdAt: string; expiresAt: string; active: boolean; reads: number; audienceSize: number }
export interface SiteStats {
  totals: { merchants: number; suspended: number; teamMembers: number; sales: number; revenue: number; active7d: number; visits30d: number; signups30d: number };
  series: { day: string; signups: number; activeShops: number; sales: number; revenue: number; visits: number }[];
  categories: { k: string; n: number }[]; countries: { k: string; n: number }[];
  ai: { day: string; count: number }[]; aiDailyGlobal: number;
}

export interface PlanSettings { enabled: boolean; trialDays: number; price1: number; price3: number; price12: number; currency: string; payInfo: string; freeAiPerDay: number; freeTeamMax: number; readOnlyAfterTrial: boolean }
export interface PlanStatus { enforced: boolean; readOnly: boolean; state: 'off' | 'paid' | 'trial' | 'free'; pro: boolean; paidUntil: string | null; trialEndsAt: string | null; daysLeft: number }
export interface PaymentRow { id: string; shopId: string; shopName?: string; userName: string; phone: string; amount: number; months: number; method: string; reference: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; decidedAt: string | null; note: string | null }
export interface BillingAdminSettings extends PlanSettings { launchedAt: string; currency: string }
export interface MonitorData {
  level: 'green' | 'orange' | 'red'; dbMs: number; errors24h: number; server24h: number; client24h: number; lastHour: number;
  top: { sig: string; message: string; route: string; source: string; n: number; last: string }[];
  recent: { ts: string; source: string; route: string; status: number | null; message: string; shop_id: string | null }[];
  series: { h: string; n: number }[]; telegram: boolean; ai: boolean; whatsapp: boolean;
}

export const api = {
  logClient: (where: string, message: string) => call<{ ok: true }>('POST', 'log', { where, message }, 5000),
  plans: () => call<PlanSettings & { whatsapp: string }>('GET', 'plans', undefined, 8000),
  billing: () => call<{ status: PlanStatus; settings: PlanSettings; payments: PaymentRow[] }>('GET', 'billing', undefined, 8000),
  billingPay: (b: { months: number; method: string; reference: string; phone?: string }) => call<{ ok: true }>('POST', 'billing/pay', b),
  adminBilling: () => call<{ settings: BillingAdminSettings; pending: PaymentRow[]; recent: PaymentRow[]; revenue30d: number; approved30d: number; activeSubs: number }>('GET', 'admin/billing'),
  adminBillingSave: (b: Partial<BillingAdminSettings>) => call<{ settings: BillingAdminSettings }>('PUT', 'admin/billing', b),
  adminPayDecide: (id: string, action: 'approve' | 'reject', note?: string) => call<{ ok: true }>('POST', `admin/billing/payments/${id}/${action}`, { note }),
  adminGrant: (shopId: string, months: number) => call<{ ok: true; paidUntil: string }>('POST', 'admin/billing/grant', { shopId, months }),
  adminMonitor: () => call<MonitorData>('GET', 'admin/monitor'),
  adminMonitorTest: () => call<{ ok: true }>('POST', 'admin/monitor/test-alert', {}),
  adminMonitorClear: () => call<{ ok: true }>('DELETE', 'admin/monitor/clear'),

  hit: () => call<{ ok: true }>('POST', 'hit', {}, 5000),
  announcements: () => call<{ items: Announcement[] }>('GET', 'announcements', undefined, 8000),
  announcementRead: (id: string) => call<{ ok: true }>('POST', `announcements/${id}/read`, {}),
  adminStats: () => call<SiteStats>('GET', 'admin/stats'),
  adminAnnouncements: () => call<{ items: AdminAnnouncement[] }>('GET', 'admin/announcements'),
  adminAnnouncementAdd: (b: { title: string; body: string; audience: string; level: string; days: number }) =>
    call<{ ok: true }>('POST', 'admin/announcements', b),
  adminAnnouncementDelete: (id: string) => call<{ ok: true }>('DELETE', `admin/announcements/${id}`),

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

  ai: (body: Record<string, unknown>) =>
    call<{ text: string; remaining: number }>('POST', 'ai', body, 45000),

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
