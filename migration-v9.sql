ALTER TABLE shops ADD COLUMN referral_code TEXT;
ALTER TABLE shops ADD COLUMN referred_by TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_refcode ON shops(referral_code);
CREATE INDEX IF NOT EXISTS idx_shops_refby ON shops(referred_by);
CREATE TABLE IF NOT EXISTS referral_payouts (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, amount INTEGER NOT NULL, note TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_payouts_shop ON referral_payouts(shop_id);
