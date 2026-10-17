// /ads.txt généré depuis les réglages de l'espace admin (exigé par Google AdSense).
import { loadAds } from './_lib/site';
import type { Env } from './_lib/util';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const c = await loadAds(env);
    const m = c.client.match(/^ca-(pub-\d{10,20})$/);
    if (m) return new Response(`google.com, ${m[1]}, DIRECT, f08c47fec0942fa0\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch { /* base non migrée */ }
  return new Response('Not found', { status: 404 });
};
