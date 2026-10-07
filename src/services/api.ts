import { UserAccount, ShopSettings } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Réseau indisponible', 0);
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

export interface ShopBundle {
  settings: ShopSettings | null;
  data: Partial<Record<'products' | 'sales' | 'expenses' | 'customers' | 'suppliers', any[]>>;
}
export interface MeResponse extends ShopBundle { user: UserAccount }
export interface AdminStats { salesCount: number; revenue30d: number; revenueTotal: number }
export interface AdminListResponse {
  users: UserAccount[];
  shops: ShopSettings[];
  stats: Record<string, AdminStats>;
}

export interface RegisterInput {
  fullName: string; email: string; phone: string; password: string;
  shopName: string; businessCategory: string; city: string; country: string;
}

export const api = {
  me: () => call<MeResponse>('GET', 'auth/me'),
  login: (identifier: string, password: string) =>
    call<{ user: UserAccount; shop: ShopSettings | null }>('POST', 'auth/login', { identifier, password }),
  register: (input: RegisterInput) =>
    call<{ user: UserAccount; shop: ShopSettings }>('POST', 'auth/register', input),
  logout: () => call<{ ok: true }>('POST', 'auth/logout', {}),
  changePassword: (currentPassword: string, newPassword: string) =>
    call<{ ok: true }>('POST', 'auth/password', { currentPassword, newPassword }),
  saveData: (payload: Record<string, unknown>) => call<{ ok: true }>('PUT', 'data', payload),

  adminList: () => call<AdminListResponse>('GET', 'admin/users'),
  adminSetStatus: (id: string, status: 'active' | 'suspended') =>
    call<{ ok: true }>('PATCH', `admin/users/${id}`, { status }),
  adminResetPassword: (id: string, newPassword: string) =>
    call<{ ok: true }>('POST', `admin/users/${id}/reset-password`, { newPassword }),
  adminDelete: (id: string) => call<{ ok: true }>('DELETE', `admin/users/${id}`),
  adminShopData: (id: string) => call<ShopBundle>('GET', `admin/users/${id}/data`),
};
