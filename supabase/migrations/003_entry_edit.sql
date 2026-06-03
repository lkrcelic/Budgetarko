-- ─────────────────────────────────────────────────────────────
-- Budgetarko — migration 003
--   • Adds end_date to entries (for stopping subscriptions / scheduled income)
--   • Adds amount_history JSONB to entries (for price-change versioning)
-- ─────────────────────────────────────────────────────────────

-- ── 1. end_date ──────────────────────────────────────────────
-- NULL  = entry is active (no end)
-- value = entry stops generating occurrences after this date
ALTER TABLE entries ADD COLUMN IF NOT EXISTS end_date date;

-- ── 2. amount_history ────────────────────────────────────────
-- JSON array of {amount: number, from: "YYYY-MM-DD"} objects.
-- NULL = no history, always use entries.amount
-- When present, the budget engine picks the correct amount for each occurrence.
ALTER TABLE entries ADD COLUMN IF NOT EXISTS amount_history jsonb;
