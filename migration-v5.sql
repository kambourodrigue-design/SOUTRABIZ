-- SoutraBiz v5 : surveillance (journal d'erreurs) et facturation (abonnements).
-- À exécuter UNE fois sur une base existante (Cloudflare → D1 → Console). Exécutez après migration-v4.sql.

CREATE TABLE IF NOT EXISTS error_log (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      TEXT NOT NULL,
  source  TEXT NOT NULL,           -- 'server' ou 'client'
  route   TEXT,
  status  INTEGER,
  message TEXT NOT NULL,
  sig     TEXT NOT NULL,           -- signature pour regrouper les erreurs identiques
  shop_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_error_ts ON error_log(ts);

CREATE TABLE IF NOT EXISTS payments (
  id         TEXT PRIMARY KEY,
  shop_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  user_name  TEXT,
  phone      TEXT,
  amount     INTEGER NOT NULL,
  months     INTEGER NOT NULL,
  method     TEXT NOT NULL,
  reference  TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  created_at TEXT NOT NULL,
  decided_at TEXT,
  note       TEXT
);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_pay_shop ON payments(shop_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  shop_id    TEXT PRIMARY KEY,
  paid_until TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
