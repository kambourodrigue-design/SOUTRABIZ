import assert from 'node:assert/strict';
import { referralPct, nextReferralTier, referralCommission, cleanReferralCode } from '../shared/referral';
import { countryOffsetMin, localDayOf } from '../shared/timezone';
let n = 0; const t = (name: string, f: () => void) => { f(); n++; console.log('ok', name); };
t('paliers', () => { assert.equal(referralPct(0), 0); assert.equal(referralPct(1), 5); assert.equal(referralPct(4), 5); assert.equal(referralPct(5), 7); assert.equal(referralPct(10), 10); assert.equal(referralPct(50), 10); });
t('prochain palier', () => { assert.deepEqual(nextReferralTier(1), { min: 5, pct: 7 }); assert.equal(nextReferralTier(10), null); });
t('commission', () => { assert.equal(referralCommission(30000, 10), 3000); assert.equal(referralCommission(30000, 5), 1500); assert.equal(referralCommission(2500, 7), 175); assert.equal(referralCommission(-5, 10), 0); });
t('code', () => assert.equal(cleanReferralCode(' ab-c1!23 '), 'ABC123'));
t('pays', () => { assert.equal(countryOffsetMin("Côte d'Ivoire"), 0); assert.equal(countryOffsetMin('Burkina Faso'), 0); assert.equal(countryOffsetMin('Cameroun'), 60); assert.equal(countryOffsetMin('Madagascar'), 180); assert.equal(countryOffsetMin(undefined), 0); });
t('jour local', () => {
  assert.equal(localDayOf('2026-11-03T23:30:00.000Z', 60), '2026-11-04');
  assert.equal(localDayOf('2026-11-03T23:30:00.000Z', 0), '2026-11-03');
  assert.equal(localDayOf('2026-11-03', 180), '2026-11-03');
  assert.equal(localDayOf('2026-11-03T22:00:00.000Z', 180), '2026-11-04');
});
console.log(n, 'tests ok');
