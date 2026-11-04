// Programme de parrainage : commission sur les abonnements payés par les filleuls, par paliers (jusqu'à 10 %).
// Le palier dépend du nombre de filleuls qui ont payé au moins un abonnement.
export const REFERRAL_TIERS: { min: number; pct: number }[] = [
  { min: 1, pct: 5 },
  { min: 5, pct: 7 },
  { min: 10, pct: 10 },
];
export const REFERRAL_MAX_PCT = Math.max(...REFERRAL_TIERS.map(t => t.pct));

/** Taux de commission (%) pour un nombre de filleuls payants. */
export const referralPct = (paying: number): number => {
  let p = 0;
  for (const t of REFERRAL_TIERS) if (paying >= t.min) p = t.pct;
  return p;
};
/** Prochain palier à atteindre (ou null si le maximum est atteint). */
export const nextReferralTier = (paying: number): { min: number; pct: number } | null =>
  REFERRAL_TIERS.find(t => paying < t.min) || null;
export const referralCommission = (paid: number, pct: number): number => Math.floor((Math.max(0, paid) * pct) / 100);
export const cleanReferralCode = (v: unknown): string => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
