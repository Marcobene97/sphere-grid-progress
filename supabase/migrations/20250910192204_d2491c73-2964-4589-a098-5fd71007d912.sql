-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.task_category AS ENUM ('programming', 'finance', 'music', 'general');
CREATE TYPE public.task_difficulty AS ENUM ('basic', 'intermediate', 'advanced');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.node_category AS ENUM ('skill', 'habit', 'milestone', 'project');
CREATE TYPE public.node_branch AS ENUM ('programming', 'finance', 'music');
CREATE TYPE public.node_type AS ENUM ('basic', 'intermediate', 'advanced', 'master');
CREATE TYPE public.node_status AS ENUM ('locked', 'available', 'in_progress', 'completed', 'mastered');
CREATE TYPE public.session_type AS ENUM ('deep_work', 'practice', 'learning', 'review');
CREATE TYPE public.achievement_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Create users profile table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create nodes table (sphere grid nodes)
CREATE TABLE public.nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category public.node_category NOT NULL,
    branch public.node_branch NOT NULL,
    type public.node_type NOT NULL,
    status public.node_status NOT NULL DEFAULT 'locked',
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    prerequisites UUID[] DEFAULT '{}',
    unlocks UUID[] DEFAULT '{}',
    reward_xp INTEGER NOT NULL DEFAULT 0,
    reward_skills TEXT[] DEFAULT '{}',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    time_spent INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create tasks table  
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category public.task_category NOT NULL,
    difficulty public.task_difficulty NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    xp_reward INTEGER NOT NULL DEFAULT 25,
    estimated_time INTEGER NOT NULL DEFAULT 30,
    actual_time INTEGER,
    status public.task_status NOT NULL DEFAULT 'pending',
    tags TEXT[] DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create work sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    category public.task_category NOT NULL,
    type public.session_type NOT NULL DEFAULT 'deep_work',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER NOT NULL DEFAULT 0,
    focus_score INTEGER NOT NULL DEFAULT 8 CHECK (focus_score >= 1 AND focus_score <= 10),
    xp_earned INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    rarity public.achievement_rarity NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    conditions JSONB NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create settings table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    daily_xp_goal INTEGER NOT NULL DEFAULT 200,
    work_session_length INTEGER NOT NULL DEFAULT 25,
    reminder_time TIME NOT NULL DEFAULT '09:00:00',
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    theme TEXT NOT NULL DEFAULT 'dark',
    dungeon_bonus BOOLEAN NOT NULL DEFAULT false,
    streak_cap INTEGER NOT NULL DEFAULT 30,
    min_focus_minutes INTEGER NOT NULL DEFAULT 5,
    idle_timeout INTEGER NOT NULL DEFAULT 300,
    efficiency_slope NUMERIC(3,2) NOT NULL DEFAULT 1.20,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create reflections table for AI analysis storage
CREATE TABLE public.reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    reflection TEXT NOT NULL,
    next_suggestions TEXT[] DEFAULT '{}',
    focus_insights TEXT,
    bonus_xp INTEGER NOT NULL DEFAULT 0,
    xp_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for nodes
CREATE POLICY "Users can view their own nodes" ON public.nodes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own nodes" ON public.nodes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nodes" ON public.nodes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own nodes" ON public.nodes
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for achievements
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own achievements" ON public.achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for settings
CREATE POLICY "Users can view their own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for reflections
CREATE POLICY "Users can view their own reflections" ON public.reflections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reflections" ON public.reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON public.nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_nodes_user_id ON public.nodes(user_id);
CREATE INDEX idx_nodes_status ON public.nodes(status);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_node_id ON public.tasks(node_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_settings_user_id ON public.settings(user_id);
CREATE INDEX idx_reflections_user_id ON public.reflections(user_id);