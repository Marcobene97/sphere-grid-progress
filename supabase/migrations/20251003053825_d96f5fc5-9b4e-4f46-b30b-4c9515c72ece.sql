-- Create sessions table for focus sessions
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  node_id uuid REFERENCES public.nodes(id) ON DELETE SET NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_minutes integer,
  notes text,
  reflection jsonb DEFAULT '{}'::jsonb,
  xp_earned integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create daily_reviews table
CREATE TABLE public.daily_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  review_date date NOT NULL,
  xp_earned integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  tasks_planned integer DEFAULT 0,
  wins text,
  blockers text,
  lessons text,
  top_three_tomorrow text[] DEFAULT '{}'::text[],
  markdown_export text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_date)
);

ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily reviews"
  ON public.daily_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily reviews"
  ON public.daily_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily reviews"
  ON public.daily_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Create inbox_items table for raw capture
CREATE TABLE public.inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  content text NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inbox items"
  ON public.inbox_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inbox items"
  ON public.inbox_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inbox items"
  ON public.inbox_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inbox items"
  ON public.inbox_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reviews_updated_at
  BEFORE UPDATE ON public.daily_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inbox_items_updated_at
  BEFORE UPDATE ON public.inbox_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();