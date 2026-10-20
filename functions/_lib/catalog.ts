// Catalogue public de la boutique : une page web (sans connexion) listant les produits en stock,
// avec commande par WhatsApp. Réglages dans app_settings (aucune migration SQL) :
//   catalog_cfg:<shopId> = {slug, on, intro}     catalog_slug:<slug> = shopId

import { json, fail, readBody, shopRoleOf, type Env, type UserRow } from './util';

export interface CatalogCfg { slug: string; on: boolean; intro: string }
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, ' ').trim().slice(0, n);
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/;

async function getKey(env: Env, key: string): Promise<string | null> {
  try { const r: any = await env.DB.prepare('SELECT value FROM app_settings WHERE key = ?').bind(key).first(); return r?.value ?? null; }
  catch { return null; }
}
const putKey = (env: Env, key: string, value: string) =>
  env.DB.prepare('INSERT INTO app_settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').bind(key, value).run();

export async function loadCatalogCfg(env: Env, shopId: string): Promise<CatalogCfg> {
  const raw = await getKey(env, 'catalog_cfg:' + shopId);
  try { if (raw) return { slug: '', on: false, intro: '', ...JSON.parse(raw) }; } catch { /* ignore */ }
  return { slug: '', on: false, intro: '' };
}

export async function myCatalog(env: Env, user: UserRow) {
  if (shopRoleOf(user) === 'cashier') return fail('Accès refusé.', 403);
  return json(await loadCatalogCfg(env, user.shop_id));
}

export async function saveCatalog(req: Request, env: Env, user: UserRow) {
  if (shopRoleOf(user) !== 'owner') return fail('Réservé au propriétaire de la boutique.', 403);
  const x = await readBody(req, 3_000);
  const cur = await loadCatalogCfg(env, user.shop_id);
  const slug = clean(x.slug, 40).toLowerCase();
  const on = !!x.on;
  if (!SLUG_RE.test(slug)) return fail('Adresse invalide : 3 à 30 caractères, lettres minuscules, chiffres et tirets.');
  const owner = await getKey(env, 'catalog_slug:' + slug);
  if (owner && owner !== user.shop_id) return fail('Cette adresse est déjà prise, choisissez-en une autre.', 409);
  const next: CatalogCfg = { slug, on, intro: clean(x.intro, 200) };
  await putKey(env, 'catalog_slug:' + slug, user.shop_id);
  if (cur.slug && cur.slug !== slug) {
    const old = await getKey(env, 'catalog_slug:' + cur.slug);
    if (old === user.shop_id) await env.DB.prepare('DELETE FROM app_settings WHERE key = ?').bind('catalog_slug:' + cur.slug).run();
  }
  await putKey(env, 'catalog_cfg:' + user.shop_id, JSON.stringify(next));
  return json(next);
}

/* ---------- Page publique ---------- */
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const money = (n: number, cur: string) => {
  const f = new Intl.NumberFormat('fr-FR').format(Math.round(n)).replace(/ | /g, ' ');
  return cur === 'EUR' ? `${f} €` : cur === 'USD' ? `$${f}` : cur === 'GNF' ? `${f} GNF` : `${f} F CFA`;
};

const page = (status: number, title: string, body: string, extraHead = '') =>
  new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>${extraHead}<link rel="icon" href="/favicon.png">
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f4;color:#1c1917}
header{background:#022c22;color:#fff;padding:18px 16px}header h1{margin:0;font-size:20px}header p{margin:4px 0 0;font-size:13px;color:#a7f3d0}
main{max-width:720px;margin:0 auto;padding:12px 12px 110px}.search{width:100%;padding:12px 14px;border:1px solid #d6d3d1;border-radius:14px;font-size:16px;margin:4px 0 8px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#57534e;margin:18px 4px 6px}
.item{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:1px solid #e7e5e4;border-radius:14px;padding:12px;margin-bottom:8px}
.n{font-weight:700;font-size:15px}.p{font-size:13px;color:#047857;font-weight:700}.u{color:#78716c;font-weight:400}
.qty{display:flex;align-items:center;gap:8px}.qty button{width:34px;height:34px;border-radius:10px;border:1px solid #d6d3d1;background:#fff;font-size:18px;font-weight:700}
.qty button.add{background:#047857;border-color:#047857;color:#fff}.qty span{min-width:18px;text-align:center;font-weight:700}
#bar{position:fixed;left:0;right:0;bottom:0;padding:12px;background:#fff;border-top:1px solid #e7e5e4;display:none}
#bar a{display:block;max-width:696px;margin:0 auto;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:14px;border-radius:14px}
.empty{text-align:center;color:#78716c;padding:40px 10px}footer{text-align:center;font-size:11px;color:#a8a29e;padding:16px}footer a{color:#a8a29e}
</style></head><body>${body}</body></html>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store' },
  });

export async function renderCatalog(env: Env, slugRaw: string): Promise<Response> {
  const notFound = () => page(404, 'Boutique introuvable', '<main><div class="empty"><h1>Boutique introuvable</h1><p>Ce lien n\'est plus actif.</p></div></main>', '<meta name="robots" content="noindex">');
  const slug = String(slugRaw || '').toLowerCase();
  if (!SLUG_RE.test(slug)) return notFound();
  const shopId = await getKey(env, 'catalog_slug:' + slug);
  if (!shopId) return notFound();
  const cfg = await loadCatalogCfg(env, shopId);
  if (!cfg.on || cfg.slug !== slug) return notFound();

  const shop: any = await env.DB.prepare('SELECT settings FROM shops WHERE shop_id = ?').bind(shopId).first();
  let st: any = {}; try { st = JSON.parse(shop?.settings || '{}'); } catch { /* ignore */ }
  const rows = (await env.DB.prepare("SELECT json FROM records WHERE shop_id = ? AND kind = 'products' AND deleted = 0 LIMIT 600").bind(shopId).all<any>()).results;
  const cur = String(st.currency || 'XOF');
  const items = rows.map((r) => { try { return JSON.parse(r.json); } catch { return null; } })
    .filter((p: any) => p && p.name && Number(p.sellingPrice) > 0 && Number(p.stockQuantity) > 0)
    .sort((a: any, b: any) => String(a.category).localeCompare(String(b.category), 'fr') || String(a.name).localeCompare(String(b.name), 'fr'));

  const phone = String(st.phone || '').replace(/\D/g, '');
  const canOrder = phone.length >= 8;
  const shopName = String(st.shopName || 'Boutique');
  const groups = new Map<string, any[]>();
  for (const p of items) { const k = String(p.category || 'Produits'); (groups.get(k) || groups.set(k, []).get(k)!).push(p); }

  let list = '';
  let idx = 0;
  for (const [cat, ps] of groups) {
    list += `<h2>${esc(cat)}</h2>`;
    for (const p of ps) {
      list += `<div class="item" data-i="${idx}" data-name="${esc(String(p.name).toLowerCase())}"><div><div class="n">${esc(p.name)}</div>
<div class="p">${esc(money(Number(p.sellingPrice), cur))} <span class="u">/ ${esc(p.unit || 'pièce')}</span></div></div>
${canOrder ? '<div class="qty"><button class="m" aria-label="Retirer">−</button><span>0</span><button class="add" aria-label="Ajouter">+</button></div>' : ''}</div>`;
      idx++;
    }
  }
  const data = items.map((p: any) => ({ n: String(p.name), p: Math.round(Number(p.sellingPrice)) }));
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c').replace(new RegExp('[\\u2028\\u2029]', 'g'), '');
  const head = `<meta name="description" content="${esc(cfg.intro || `Catalogue de ${shopName} : produits disponibles et prix.`)}">
<meta property="og:title" content="${esc(shopName)} — catalogue"><meta property="og:description" content="${esc(cfg.intro || 'Produits disponibles et prix. Commandez par WhatsApp.')}"><meta property="og:type" content="website">`;
  const body = `<header><h1>${esc(shopName)}</h1><p>${esc([st.city, st.country].filter(Boolean).join(', '))}${cfg.intro ? ' — ' + esc(cfg.intro) : ''}</p></header>
<main><input class="search" id="q" type="search" placeholder="Rechercher un produit…" aria-label="Rechercher">
${items.length ? list : '<div class="empty">Aucun produit disponible pour le moment.</div>'}</main>
${canOrder ? '<div id="bar"><a id="go" href="#" rel="noopener"></a></div>' : ''}
<footer>Catalogue propulsé par <a href="/">Nafora</a></footer>
<script>(function(){var D=${dataJson},C={},SHOP=${JSON.stringify(shopName).replace(/</g, '\\u003c')},PH=${JSON.stringify(phone)},CUR=${JSON.stringify(cur)};
function f(n){var s=String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ');return CUR==='EUR'?s+' €':CUR==='USD'?'$'+s:CUR==='GNF'?s+' GNF':s+' F CFA'}
var q=document.getElementById('q');q.addEventListener('input',function(){var v=q.value.toLowerCase().trim();document.querySelectorAll('.item').forEach(function(e){e.style.display=e.getAttribute('data-name').indexOf(v)>-1?'':'none'})});
function upd(){var n=0,t=0,l=['Bonjour '+SHOP+', je souhaite commander :'];for(var i in C){if(C[i]>0){n+=C[i];t+=C[i]*D[i].p;l.push('- '+C[i]+' x '+D[i].n+' ('+f(D[i].p)+')')}}
var b=document.getElementById('bar');if(!b)return;if(!n){b.style.display='none';return}l.push('Total : '+f(t));b.style.display='block';
var a=document.getElementById('go');a.textContent='Commander sur WhatsApp ('+n+' article'+(n>1?'s':'')+' • '+f(t)+')';a.href='https://wa.me/'+PH+'?text='+encodeURIComponent(l.join('\\n'))}
document.querySelectorAll('.item').forEach(function(e){var i=e.getAttribute('data-i'),s=e.querySelector('span');if(!s)return;
e.querySelector('.add').onclick=function(){C[i]=(C[i]||0)+1;s.textContent=C[i];upd()};e.querySelector('.m').onclick=function(){C[i]=Math.max(0,(C[i]||0)-1);s.textContent=C[i];upd()}});})();</script>`;
  return page(200, `${shopName} — catalogue`, body, head);
}
