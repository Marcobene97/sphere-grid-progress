-- Remove the insecure view
DROP VIEW IF EXISTS user_xp;

-- Create secure function to get user XP
CREATE OR REPLACE FUNCTION public.get_user_total_xp(user_uuid uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(sum(amount), 0)::integer 
  FROM xp_events 
  WHERE user_id = user_uuid;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_total_xp TO authenticated, anon;