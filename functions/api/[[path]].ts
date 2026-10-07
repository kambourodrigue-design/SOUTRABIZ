// API SoutraBiz — Cloudflare Pages Functions + D1
// Routes : /api/auth/*, /api/data, /api/admin/*

interface Env {
  DB: D1Database;
  ADMIN_EMAIL?: string;
}

const SESSION_DAYS = 30;
const COOKIE = 'sb_session';
const MAX_KEY_BYTES = 1_800_000; // limite D1 : 2 Mo par ligne
const DATA_KEYS = ['products', 'sales', 'expenses', 'customers', 'suppliers'] as const;

// ---------- helpers ----------
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
const fail = (message: string, status = 400) => json({ error: message }, status);

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
const randomHex = (n: number) => toHex(crypto.getRandomValues(new Uint8Array(n)));

async function sha256(text: string) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function hashPassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: 100_000 }, key, 256);
  return toHex(bits);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const normPhone = (p: string) => {
  const t = (p || '').trim();
  const digits = t.replace(/\D/g, '');
  return digits ? (t.startsWith('+') ? '+' : '') + digits : '';
};
const normEmail = (e: unknown) => (typeof e === 'string' ? e.trim().toLowerCase() : '');
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function getCookie(req: Request, name: string) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
const sessionCookie = (token: string, maxAge: number) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

interface UserRow {
  id: string; email: string | null; phone: string; name: string; password_hash: string; salt: string;
  role: 'admin' | 'merchant'; status: 'active' | 'suspended'; shop_id: string; created_at: string; last_login_at: string;
}
const publicUser = (u: UserRow) => ({
  id: u.id, email: u.email || '', phone: u.phone, name: u.name, role: u.role,
  status: u.status, shopId: u.shop_id, createdAt: u.created_at, lastLoginAt: u.last_login_at,
});

async function createSession(env: Env, userId: string) {
  const token = randomHex(32);
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)')
    .bind(await sha256(token), userId, exp).run();
  // nettoyage opportuniste des sessions expirées
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)).run();
  return token;
}

async function currentUser(req: Request, env: Env): Promise<UserRow | null> {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(await sha256(token), Math.floor(Date.now() / 1000)).first<UserRow>();
  if (!row || row.status !== 'active') return null;
  return row;
}

async function readBody(req: Request, maxBytes = 3_000_000): Promise<any> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error('Requête trop volumineuse');
  try { return JSON.parse(text || '{}'); } catch { throw new Error('JSON invalide'); }
}

// anti force brute : 8 échecs / 15 min par identifiant
async function checkRate(env: Env, key: string) {
  const now = Math.floor(Date.now() / 1000);
  const r = await env.DB.prepare('SELECT count, window_start FROM login_attempts WHERE key = ?').bind(key).first<any>();
  if (r && now - r.window_start < 900 && r.count >= 8) return false;
  return true;
}
async function recordFailure(env: Env, key: string) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO login_attempts (key, count, window_start) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN ?2 - window_start >= 900 THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN ?2 - window_start >= 900 THEN ?2 ELSE window_start END`)
    .bind(key, now).run();
}
const clearFailures = (env: Env, key: string) =>
  env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();

// ---------- handlers ----------
async function register(req: Request, env: Env) {
  const b = await readBody(req, 20_000);
  const name = str(b.fullName, 100);
  const email = normEmail(b.email);
  const phone = normPhone(str(b.phone, 30));
  const password = typeof b.password === 'string' ? b.password : '';
  const shopName = str(b.shopName, 120);
  if (!name || !phone || !shopName) return fail("Nom, téléphone et nom d'entreprise sont obligatoires.");
  if (phone.replace(/\D/g, '').length < 8) return fail('Numéro de téléphone invalide.');
  if (email && !isEmail(email)) return fail('Adresse email invalide.');
  if (password.length < 8 || password.length > 200) return fail('Le mot de passe doit contenir au moins 8 caractères.');

  const admin = normEmail(env.ADMIN_EMAIL);
  const isAdmin = !!email && !!admin && email === admin;

  const dup = await env.DB.prepare('SELECT id FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)')
    .bind(phone, email || '\u0000').first();
  if (dup) return fail('Un compte existe déjà avec ce téléphone ou cet email.', 409);

  const id = 'user-' + randomHex(8);
  const shopId = 'shop-' + randomHex(8);
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const now = new Date().toISOString();
  const country = str(b.country, 80) || "Côte d'Ivoire";
  const shop = {
    shopId, shopName, ownerName: name, country, city: str(b.city, 80) || 'Abidjan', phone,
    currency: country.toLowerCase().includes('guinée') ? 'GNF' : 'XOF',
    isFormalized: false, businessType: shopName,
    businessCategory: str(b.businessCategory, 40) || 'retail_food', foundedYear: new Date().getFullYear(),
  };
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id,email,phone,name,password_hash,salt,role,status,shop_id,created_at,last_login_at)
                    VALUES (?,?,?,?,?,?,?, 'active',?,?,?)`)
      .bind(id, email || null, phone, name, hash, salt, isAdmin ? 'admin' : 'merchant', shopId, now, now),
    env.DB.prepare('INSERT INTO shops (shop_id,user_id,settings) VALUES (?,?,?)').bind(shopId, id, JSON.stringify(shop)),
  ]);
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>())!;
  const token = await createSession(env, id);
  return json({ user: publicUser(user), shop }, 201, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
}

async function login(req: Request, env: Env) {
  const b = await readBody(req, 5_000);
  const idRaw = str(b.identifier, 120);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!idRaw || !password) return fail('Identifiant et mot de passe requis.');
  const email = normEmail(idRaw);
  const phone = normPhone(idRaw);
  const rateKey = (email || phone).toLowerCase();
  if (!(await checkRate(env, rateKey))) return fail('Trop de tentatives. Réessayez dans 15 minutes.', 429);

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
    .bind(email, phone || '\u0000').first<UserRow>();
  // calcul fait même si l'utilisateur n'existe pas (timing uniforme)
  const hash = await hashPassword(password, user?.salt || '00'.repeat(16));
  if (!user || !safeEqual(hash, user.password_hash)) {
    await recordFailure(env, rateKey);
    return fail('Identifiant ou mot de passe incorrect.', 401);
  }
  if (user.status === 'suspended') return fail("Ce compte est suspendu par l'administration.", 403);
  await clearFailures(env, rateKey);

  const admin = normEmail(env.ADMIN_EMAIL);
  if (user.email && admin && user.email === admin && user.role !== 'admin') {
    await env.DB.prepare("UPDATE users SET role='admin' WHERE id=?").bind(user.id).run();
    user.role = 'admin';
  }
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE users SET last_login_at=? WHERE id=?').bind(now, user.id).run();
  user.last_login_at = now;
  const shopRow = await env.DB.prepare('SELECT settings FROM shops WHERE shop_id=?').bind(user.shop_id).first<any>();
  const token = await createSession(env, user.id);
  return json({ user: publicUser(user), shop: shopRow ? JSON.parse(shopRow.settings) : null }, 200,
    { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
}

async function logout(req: Request, env: Env) {
  const token = getCookie(req, COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}

async function loadShopBundle(env: Env, shopId: string) {
  const shopRow = await env.DB.prepare('SELECT settings FROM shops WHERE shop_id=?').bind(shopId).first<any>();
  const rows = await env.DB.prepare('SELECT key, json, updated_at FROM shop_data WHERE shop_id=?').bind(shopId).all<any>();
  const data: Record<string, unknown> = {};
  for (const r of rows.results) data[r.key] = JSON.parse(r.json);
  return { settings: shopRow ? JSON.parse(shopRow.settings) : null, data };
}

async function putData(req: Request, env: Env, user: UserRow) {
  const b = await readBody(req, 8_000_000);
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];
  for (const k of DATA_KEYS) {
    if (b[k] === undefined) continue;
    if (!Array.isArray(b[k])) return fail(`"${k}" doit être une liste.`);
    const text = JSON.stringify(b[k]);
    if (text.length > MAX_KEY_BYTES) return fail(`Données "${k}" trop volumineuses (limite atteinte).`, 413);
    stmts.push(env.DB.prepare(
      `INSERT INTO shop_data (shop_id,key,json,updated_at) VALUES (?,?,?,?)
       ON CONFLICT(shop_id,key) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at`)
      .bind(user.shop_id, k, text, now));
  }
  if (b.settings && typeof b.settings === 'object') {
    const s = { ...b.settings, shopId: user.shop_id };
    stmts.push(env.DB.prepare('UPDATE shops SET settings=? WHERE shop_id=?').bind(JSON.stringify(s), user.shop_id));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true, savedAt: now });
}

async function changePassword(req: Request, env: Env, user: UserRow) {
  const b = await readBody(req, 5_000);
  const cur = typeof b.currentPassword === 'string' ? b.currentPassword : '';
  const next = typeof b.newPassword === 'string' ? b.newPassword : '';
  if (next.length < 8) return fail('Le nouveau mot de passe doit contenir au moins 8 caractères.');
  if (!safeEqual(await hashPassword(cur, user.salt), user.password_hash)) return fail('Mot de passe actuel incorrect.', 401);
  const salt = randomHex(16);
  await env.DB.prepare('UPDATE users SET password_hash=?, salt=? WHERE id=?')
    .bind(await hashPassword(next, salt), salt, user.id).run();
  return json({ ok: true });
}

// ---------- admin ----------
async function adminList(env: Env) {
  const users = await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all<UserRow>();
  const shops = await env.DB.prepare('SELECT shop_id, settings FROM shops').all<any>();
  const sales = await env.DB.prepare("SELECT shop_id, json FROM shop_data WHERE key='sales'").all<any>();
  const since = Date.now() - 30 * 86400000;
  const stats: Record<string, { salesCount: number; revenue30d: number; revenueTotal: number }> = {};
  for (const r of sales.results) {
    let arr: any[] = [];
    try { arr = JSON.parse(r.json); } catch { /* ignore */ }
    let rev30 = 0, tot = 0, n = 0;
    for (const s of arr) {
      if (s?.status && s.status !== 'completed') continue;
      const t = Number(s?.total) || 0;
      tot += t; n++;
      if (new Date(s?.date).getTime() >= since) rev30 += t;
    }
    stats[r.shop_id] = { salesCount: n, revenue30d: rev30, revenueTotal: tot };
  }
  return json({
    users: users.results.map(publicUser),
    shops: shops.results.map((s: any) => JSON.parse(s.settings)),
    stats,
  });
}

async function adminUser(req: Request, env: Env, admin: UserRow, id: string, sub: string | undefined) {
  const target = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first<UserRow>();
  if (!target) return fail('Utilisateur introuvable.', 404);

  if (req.method === 'GET' && sub === 'data') return json(await loadShopBundle(env, target.shop_id));

  if (target.id === admin.id && req.method !== 'GET')
    return fail('Vous ne pouvez pas modifier votre propre compte administrateur ici.', 400);

  if (req.method === 'PATCH' && !sub) {
    const b = await readBody(req, 2_000);
    if (b.status !== 'active' && b.status !== 'suspended') return fail('Statut invalide.');
    await env.DB.prepare('UPDATE users SET status=? WHERE id=?').bind(b.status, id).run();
    if (b.status === 'suspended') await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id).run();
    return json({ ok: true });
  }
  if (req.method === 'POST' && sub === 'reset-password') {
    const b = await readBody(req, 2_000);
    const pw = typeof b.newPassword === 'string' ? b.newPassword : '';
    if (pw.length < 8) return fail('Mot de passe : 8 caractères minimum.');
    const salt = randomHex(16);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash=?, salt=? WHERE id=?').bind(await hashPassword(pw, salt), salt, id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),
    ]);
    return json({ ok: true });
  }
  if (req.method === 'DELETE' && !sub) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM shop_data WHERE shop_id=?').bind(target.shop_id),
      env.DB.prepare('DELETE FROM shops WHERE shop_id=?').bind(target.shop_id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),
      env.DB.prepare('DELETE FROM users WHERE id=?').bind(id),
    ]);
    return json({ ok: true });
  }
  return fail('Route inconnue.', 404);
}

// ---------- routeur ----------
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

    const user = await currentUser(request, env);
    if (!user) return fail('Non connecté.', 401);

    if (route === 'auth/me' && m === 'GET') {
      const b = await loadShopBundle(env, user.shop_id);
      return json({ user: publicUser(user), ...b });
    }
    if (route === 'auth/password' && m === 'POST') return await changePassword(request, env, user);
    if (route === 'data' && m === 'PUT') return await putData(request, env, user);

    if (parts[0] === 'admin') {
      if (user.role !== 'admin') return fail('Accès réservé aux administrateurs.', 403);
      if (route === 'admin/users' && m === 'GET') return await adminList(env);
      if (parts[1] === 'users' && parts[2]) return await adminUser(request, env, user, parts[2], parts[3]);
    }
    return fail('Route introuvable.', 404);
  } catch (e: any) {
    return fail(e?.message || 'Erreur serveur', e?.message === 'Requête trop volumineuse' ? 413 : 500);
  }
};
