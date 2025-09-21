-- Extend existing nodes table with new fields for Action Counsellor system
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.nodes(id);
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS domain text DEFAULT 'general';
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'project';
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS est_total_minutes integer;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Update existing tasks table with Action Counsellor fields
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS context text DEFAULT 'desk';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS energy text DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS value_score integer DEFAULT 3;

-- Create subtasks table for granular task breakdowns
CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  est_minutes integer NOT NULL DEFAULT 25,
  earliest_start timestamp with time zone,
  hard_window tstzrange,
  tags text[] DEFAULT '{}',
  seq integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable RLS on subtasks
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subtasks
CREATE POLICY "Users can view their own subtasks" 
ON public.subtasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subtasks" 
ON public.subtasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks" 
ON public.subtasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks" 
ON public.subtasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create day_plan_slots table for daily scheduling
CREATE TABLE IF NOT EXISTS public.day_plan_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  slot_start timestamp with time zone NOT NULL,
  slot_end timestamp with time zone NOT NULL,
  subtask_id uuid REFERENCES public.subtasks(id) ON DELETE SET NULL,
  locked boolean DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on day_plan_slots
ALTER TABLE public.day_plan_slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for day_plan_slots
CREATE POLICY "Users can view their own day plan slots" 
ON public.day_plan_slots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own day plan slots" 
ON public.day_plan_slots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own day plan slots" 
ON public.day_plan_slots 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own day plan slots" 
ON public.day_plan_slots 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_subtasks_updated_at
BEFORE UPDATE ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_day_plan_slots_updated_at
BEFORE UPDATE ON public.day_plan_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON public.subtasks(status);
CREATE INDEX IF NOT EXISTS idx_day_plan_slots_date ON public.day_plan_slots(date);
CREATE INDEX IF NOT EXISTS idx_day_plan_slots_user_id ON public.day_plan_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON public.nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_domain ON public.nodes(domain);