-- v7 : avis des commerçants (formulaire dans l'application + témoignages sur la page d'accueil)
CREATE TABLE IF NOT EXISTS feedback (
  id         TEXT PRIMARY KEY,
  shop_id    TEXT NOT NULL UNIQUE,
  user_id    TEXT NOT NULL,
  name       TEXT,
  shop_label TEXT,
  city       TEXT,
  rating     INTEGER NOT NULL,
  text       TEXT NOT NULL,
  consent    INTEGER NOT NULL DEFAULT 0,       -- 1 = le commerçant autorise la publication
  status     TEXT NOT NULL DEFAULT 'new',      -- new | published | hidden
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status, created_at);
