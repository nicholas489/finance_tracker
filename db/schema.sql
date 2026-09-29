-- Database schema. Safe to re-run: `npm run db:setup`.

CREATE TABLE IF NOT EXISTS users (
  id            integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE, -- the app always stores it lowercased
  password_hash text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id         text        PRIMARY KEY, -- sha256 of the token stored in the cookie
  user_id    integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id         text        PRIMARY KEY, -- sha256 of the token in the emailed link
  user_id    integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

-- Supabase exposes the public schema through its REST API to anyone holding the
-- publishable key. RLS with no policies blocks that route entirely; the app
-- connects as the table owner, which RLS doesn't apply to.
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
