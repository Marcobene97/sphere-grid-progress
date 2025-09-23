-- Drop existing tables and recreate with new schema
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.day_plan_slots CASCADE;
DROP TABLE IF EXISTS public.nodes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.reflections CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.subtasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.xp_events CASCADE;

-- Create custom types
DO $$ BEGIN
    CREATE TYPE task_category AS ENUM ('programming', 'health', 'finance', 'learning', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_difficulty AS ENUM ('basic', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subtask_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE node_status AS ENUM ('locked', 'available', 'in_progress', 'completed', 'mastered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Nodes table for skill tree
CREATE TABLE public.nodes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    parent_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT NOT NULL DEFAULT 'general',
    goal_type TEXT NOT NULL DEFAULT 'project' CHECK (goal_type IN ('habit', 'project', 'one-off')),
    status node_status NOT NULL DEFAULT 'available',
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    est_total_minutes INTEGER,
    time_spent INTEGER NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    unlocks UUID[] DEFAULT '{}',
    prerequisites UUID[] DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{"xp": 0, "color": "#22c55e"}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE
);

-- Tasks table for user tasks
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category task_category NOT NULL DEFAULT 'general',
    difficulty task_difficulty NOT NULL DEFAULT 'basic',
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    estimated_time INTEGER NOT NULL DEFAULT 30,
    actual_time INTEGER,
    xp_reward INTEGER NOT NULL DEFAULT 25,
    status task_status NOT NULL DEFAULT 'pending',
    context TEXT DEFAULT 'desk' CHECK (context IN ('desk', 'gym', 'errand', 'reading', 'quiet')),
    energy TEXT DEFAULT 'medium' CHECK (energy IN ('low', 'medium', 'high')),
    value_score INTEGER DEFAULT 3 CHECK (value_score >= 1 AND value_score <= 5),
    tags TEXT[] DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Subtasks table for granular breakdowns
CREATE TABLE public.subtasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    title TEXT NOT NULL,
    status subtask_status NOT NULL DEFAULT 'todo',
    est_minutes INTEGER NOT NULL DEFAULT 25,
    earliest_start TIMESTAMP WITH TIME ZONE,
    hard_window tstzrange,
    tags TEXT[] DEFAULT '{}',
    seq INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Day plan slots for scheduling
CREATE TABLE public.day_plan_slots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    date DATE NOT NULL,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
    subtask_id UUID REFERENCES public.subtasks(id) ON DELETE SET NULL,
    locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles for additional user info
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE DEFAULT auth.uid(),
    name TEXT NOT NULL DEFAULT 'New User',
    level INTEGER NOT NULL DEFAULT 1,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    rank TEXT NOT NULL DEFAULT 'E',
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completion_date DATE,
    resilience_pillar INTEGER NOT NULL DEFAULT 0,
    consistency_pillar INTEGER NOT NULL DEFAULT 0,
    focus_pillar INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- XP events for tracking XP gains
CREATE TABLE public.xp_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_nodes_user_id ON public.nodes(user_id);
CREATE INDEX idx_nodes_parent_id ON public.nodes(parent_id);
CREATE INDEX idx_nodes_domain ON public.nodes(domain);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_node_id ON public.tasks(node_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX idx_subtasks_status ON public.subtasks(status);
CREATE INDEX idx_day_plan_slots_date ON public.day_plan_slots(date);
CREATE INDEX idx_day_plan_slots_user_id ON public.day_plan_slots(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_xp_events_user_id ON public.xp_events(user_id);

-- Enable RLS on all tables
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for nodes
CREATE POLICY "Users can view their own nodes" ON public.nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own nodes" ON public.nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nodes" ON public.nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own nodes" ON public.nodes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for subtasks
CREATE POLICY "Users can view their own subtasks" ON public.subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subtasks" ON public.subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subtasks" ON public.subtasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subtasks" ON public.subtasks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for day_plan_slots
CREATE POLICY "Users can view their own day plan slots" ON public.day_plan_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own day plan slots" ON public.day_plan_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own day plan slots" ON public.day_plan_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own day plan slots" ON public.day_plan_slots FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for xp_events
CREATE POLICY "Users can view their own xp events" ON public.xp_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own xp events" ON public.xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_subtasks_updated_at
    BEFORE UPDATE ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_day_plan_slots_updated_at
    BEFORE UPDATE ON public.day_plan_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
    BEFORE UPDATE ON public.nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();