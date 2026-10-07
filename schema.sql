-- SoutraBiz — schéma D1 (exécuter une seule fois dans la console D1)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE,
  phone         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'merchant' CHECK (role IN ('admin','merchant')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  shop_id       TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shops (
  shop_id  TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL,
  settings TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_data (
  shop_id    TEXT NOT NULL,
  key        TEXT NOT NULL CHECK (key IN ('products','sales','expenses','customers','suppliers')),
  json       TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (shop_id, key)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
