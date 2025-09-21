-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create XP events table for append-only XP tracking
CREATE TABLE IF NOT EXISTS xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  source text NOT NULL,   -- 'session' | 'task' | 'review' | etc
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- Sum view (RLS enforced through base table)
CREATE OR REPLACE VIEW user_xp AS
SELECT user_id, COALESCE(sum(amount), 0)::integer AS total_xp
FROM xp_events
GROUP BY user_id;

-- Enable RLS
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "xp_select_own" ON xp_events
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "xp_insert_own" ON xp_events
FOR INSERT WITH CHECK (auth.uid() = user_id);