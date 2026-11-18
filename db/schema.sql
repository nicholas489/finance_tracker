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

-- Admins can view and deactivate other accounts (see lib/admin.ts). Granted
-- with `npm run admin:grant -- <email>`.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin       boolean     NOT NULL DEFAULT false;
-- Null while the account is active. Deactivated users can't sign in or reset
-- their password, and lose their sessions when it happens.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

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

-- A monthly spending limit for one expense category, the same every month.
-- Stored by name like transactions.category, so renaming or deleting a custom
-- category also renames or removes its budget (see lib/user-categories.ts).
CREATE TABLE IF NOT EXISTS budgets (
  id         integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    integer       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category   text          NOT NULL,
  amount     numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz   NOT NULL DEFAULT now()
);
-- One budget per category.
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_id_category ON budgets(user_id, category);

-- Income or an expense that repeats, like rent, a paycheque or a subscription.
-- Each date it comes due, a copy is added to transactions (see lib/recurring.ts).
-- next_date is the next date still to be added; last_posted the latest one
-- that was. Category is stored by name like transactions.category.
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id          integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text          NOT NULL CHECK (type IN ('income', 'expense')),
  name        text          NOT NULL,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  category    text,
  description text,
  frequency   text          NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date  date          NOT NULL, -- anchors the schedule, e.g. the 31st for monthly
  end_date    date,                   -- inclusive; null repeats forever
  next_date   date          NOT NULL,
  last_posted date,
  paused      boolean       NOT NULL DEFAULT false,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT recurring_category_for_expenses CHECK ((type = 'expense') = (category IS NOT NULL)),
  CONSTRAINT recurring_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_next_date ON recurring_transactions(user_id, next_date);

-- The recurring transaction a transaction was added from, if any. Deleting the
-- recurring transaction keeps the ones it already added.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_id integer
  REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- A bill to remember to pay. Unlike a recurring transaction nothing is added
-- automatically: the user marks it paid, which can also record the expense,
-- and moves due_date on to the next one. due_date is null once a one-time bill
-- is paid. Category is stored by name like transactions.category.
CREATE TABLE IF NOT EXISTS bills (
  id           integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      integer       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         text          NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  category     text          NOT NULL,
  frequency    text          NOT NULL CHECK (frequency IN ('once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date   date          NOT NULL, -- anchors the schedule, e.g. the 31st for monthly
  due_date     date,
  remind_days  integer       NOT NULL DEFAULT 3 CHECK (remind_days BETWEEN 0 AND 60), -- shown on the dashboard this many days ahead
  last_paid_on date,
  notes        text,
  created_at   timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bills_user_id_due_date ON bills(user_id, due_date);

-- An amount to save by a deadline. saved is how much the user has put toward
-- it so far; they add money (or take it back out) from the Goals page. Progress
-- is measured from start_date, the day the goal was created.
CREATE TABLE IF NOT EXISTS savings_goals (
  id         integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    integer       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text          NOT NULL,
  target     numeric(12,2) NOT NULL CHECK (target > 0),
  saved      numeric(12,2) NOT NULL DEFAULT 0 CHECK (saved >= 0),
  start_date date          NOT NULL,
  deadline   date          NOT NULL,
  notes      text,
  created_at timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS savings_goals_user_id_deadline ON savings_goals(user_id, deadline);

-- Supabase exposes the public schema through its REST API to anyone holding the
-- publishable key. RLS with no policies blocks that route entirely; the app
-- connects as the table owner, which RLS doesn't apply to.
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals   ENABLE ROW LEVEL SECURITY;
