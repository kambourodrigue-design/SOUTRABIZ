import assert from 'node:assert/strict';
import { mailWelcome, mailTrialEnding, sendMail } from '../functions/_lib/mail';
const sent: any[] = [];
(globalThis as any).fetch = async (_u: string, init: any) => { sent.push(JSON.parse(init.body)); return { ok: true }; };
const stmt: any = { bind: () => stmt, first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: { changes: 1 } }) };
const env: any = { DB: { prepare: () => stmt }, RESEND_API_KEY: 'k', SUPPORT_WHATSAPP: '+226 70 00 00 00' };
let n = 0; const t = async (name: string, f: () => Promise<void>) => { await f(); n++; console.log('ok', name); };
await t('sans clé : rien envoyé', async () => { assert.equal(await sendMail({ DB: env.DB } as any, 'a@b.c', 's', 'h', 't'), false); assert.equal(sent.length, 0); });
await t('bienvenue', async () => {
  assert.equal(await mailWelcome(env, 'a@b.c', 'Awa <Traoré>', 'shop1'), true);
  const m = sent[0]; assert.deepEqual(m.to, ['a@b.c']); assert.match(m.subject, /Bienvenue sur Nafora, Awa/);
  assert.ok(!m.html.includes('<Traoré>')); assert.match(m.html, /wa\.me\/22670000000/); assert.match(m.from, /Nafora/);
});
await t('rappel fin essai', async () => {
  await mailTrialEnding(env, 'a@b.c', 'Awa', 1, false); assert.match(sent[1].subject, /Dernier jour/);
  await mailTrialEnding(env, 'a@b.c', 'Awa', 0, true); assert.match(sent[2].subject, /terminé/); assert.match(sent[2].html, /30.000/);
});
console.log(n, 'tests ok');
