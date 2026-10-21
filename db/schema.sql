-- Database schema. Safe to re-run: `npm run db:setup`.

CREATE TABLE IF NOT EXISTS users (
  id            integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE, -- the app always stores it lowercased
  password_hash text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Used to reset a forgotten password. Null until the user sets one up after
-- signing up. The answer is normalized (see lib/security-question.ts) and hashed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_hash text;

CREATE TABLE IF NOT EXISTS sessions (
  id         text        PRIMARY KEY, -- sha256 of the token stored in the cookie
  user_id    integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id         text        PRIMARY KEY, -- sha256 of the token in the reset cookie, set once the security answer is verified
  user_id    integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

-- Income and expenses. Expenses must have a category, stored by name: one of
-- the defaults in lib/categories.ts or one of the user's own (below). Income
-- never has one.
CREATE TABLE IF NOT EXISTS transactions (
  id          integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text          NOT NULL CHECK (type IN ('income', 'expense')),
  name        text          NOT NULL,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  date        date          NOT NULL,
  category    text,
  description text,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT transactions_category_for_expenses CHECK ((type = 'expense') = (category IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS transactions_user_id_date ON transactions(user_id, date DESC);

-- Expense categories a user adds on top of the defaults. Renaming or deleting
-- one also updates that user's transactions (see lib/user-categories.ts).
CREATE TABLE IF NOT EXISTS categories (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Names are unique per user, ignoring case.
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_id_name ON categories(user_id, lower(name));

-- Supabase exposes the public schema through its REST API to anyone holding the
-- publishable key. RLS with no policies blocks that route entirely; the app
-- connects as the table owner, which RLS doesn't apply to.
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
