-- ─────────────────────────────────────────────────────────────
-- Budgetarko — migration 002
--   • Adds 'scheduled_income' entry kind
--   • Adds user_lookup table (email → user_id, for share-by-email)
--   • Adds account_shares table
--   • Updates RLS on profiles / categories / entries for cross-account access
-- ─────────────────────────────────────────────────────────────

-- ── 1. Extend entries.kind ────────────────────────────────────
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_kind_check;
ALTER TABLE entries ADD CONSTRAINT entries_kind_check
  CHECK (kind IN ('expense', 'income', 'card', 'subscription', 'scheduled_income'));

-- ── 2. user_lookup ────────────────────────────────────────────
-- Stores the email address of every registered user so that
-- sharing by email is possible without exposing auth.users.
CREATE TABLE IF NOT EXISTS user_lookup (
  user_id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_lookup ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a user by email (needed to share with them)
CREATE POLICY "Public read for user lookup"
  ON user_lookup FOR SELECT
  USING (true);

-- Each user manages only their own row
CREATE POLICY "Users insert own lookup entry"
  ON user_lookup FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own lookup entry"
  ON user_lookup FOR UPDATE
  USING (auth.uid() = user_id);

-- ── 3. account_shares ─────────────────────────────────────────
-- One row per share: owner_user_id has granted full access to shared_with_uid.
CREATE TABLE IF NOT EXISTS account_shares (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  shared_with_uid uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (owner_user_id, shared_with_uid)
);

ALTER TABLE account_shares ENABLE ROW LEVEL SECURITY;

-- Owner can create, view, and revoke their shares
CREATE POLICY "Owner manages their account shares"
  ON account_shares FOR ALL
  USING (auth.uid() = owner_user_id);

-- Shared user can see the accounts they've been given access to
CREATE POLICY "Shared user can read their access"
  ON account_shares FOR SELECT
  USING (auth.uid() = shared_with_uid);

-- ── 4. Update RLS for cross-account access ────────────────────

-- profiles: own OR shared-with-me
DROP POLICY IF EXISTS "Users manage own profiles" ON profiles;
CREATE POLICY "Users access own and shared profiles"
  ON profiles FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_shares s
      WHERE s.owner_user_id = profiles.user_id
        AND s.shared_with_uid = auth.uid()
    )
  );

-- categories: own OR shared-with-me
DROP POLICY IF EXISTS "Users manage own categories" ON categories;
CREATE POLICY "Users access own and shared categories"
  ON categories FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_shares s
      WHERE s.owner_user_id = categories.user_id
        AND s.shared_with_uid = auth.uid()
    )
  );

-- entries: via accessible profiles
DROP POLICY IF EXISTS "Users manage entries in own profiles" ON entries;
CREATE POLICY "Users access entries in accessible profiles"
  ON entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = entries.profile_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM account_shares s
            WHERE s.owner_user_id = p.user_id
              AND s.shared_with_uid = auth.uid()
          )
        )
    )
  );
