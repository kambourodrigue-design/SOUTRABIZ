// API SoutraBiz — Cloudflare Pages Functions + D1
// Routes : /api/auth/*, /api/sync, /api/team/*, /api/admin/*
// La logique est répartie dans functions/_lib/ (auth, sync, merge, team, admin).

import {
  fail, currentUser, HttpError, type Env,
} from '../_lib/util';
import { register, login, logout, forgot, me, changePassword } from '../_lib/auth';
import { handlePull, handlePush } from '../_lib/sync';
import { handleTeam } from '../_lib/team';
import { adminList, adminExport, adminUser } from '../_lib/admin';

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const parts = ([] as string[]).concat((params.path as string | string[]) || []);
    const route = parts.join('/');
    const m = request.method;

    // protection CSRF : les requêtes qui modifient doivent provenir du même site
    if (m !== 'GET' && m !== 'HEAD') {
      const origin = request.headers.get('Origin');
      if (origin && origin !== new URL(request.url).origin) return fail('Origine refusée.', 403);
    }

    if (route === 'auth/register' && m === 'POST') return await register(request, env);
    if (route === 'auth/login' && m === 'POST') return await login(request, env);
    if (route === 'auth/logout' && m === 'POST') return await logout(request, env);
    if (route === 'auth/forgot' && m === 'POST') return await forgot(request, env);

    const user = await currentUser(request, env);
    if (!user) return fail('Non connecté.', 401);

    if (route === 'auth/me' && m === 'GET') return await me(request, env, user);
    if (route === 'auth/password' && m === 'POST') return await changePassword(request, env, user);

    if (route === 'sync' && m === 'GET') return await handlePull(request, env, user);
    if (route === 'sync' && m === 'POST') return await handlePush(request, env, user);

    // Ancienne synchronisation (versions précédentes de l'application)
    if (route === 'data' && m === 'PUT') {
      return fail("Mise à jour requise : fermez complètement l'application puis rouvrez-la.", 410);
    }

    if (parts[0] === 'team') return await handleTeam(request, env, user, parts);

    if (parts[0] === 'admin') {
      if (user.role !== 'admin') return fail('Accès réservé aux administrateurs.', 403);
      if (route === 'admin/users' && m === 'GET') return await adminList(request, env);
      if (route === 'admin/export' && m === 'GET') return await adminExport(env);
      if (parts[1] === 'users' && parts[2]) return await adminUser(request, env, user, parts[2], parts[3]);
    }
    return fail('Route introuvable.', 404);
  } catch (e: any) {
    if (e instanceof HttpError) return fail(e.message, e.status);
    return fail(e?.message || 'Erreur serveur', 500);
  }
};
