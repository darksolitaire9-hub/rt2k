-- Supabase Schema for rt2k

-- 1. Analyses table
-- Stores the high-level metadata and result of an analysis run.
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    game_count INTEGER NOT NULL,
    summary JSONB NOT NULL,
    games JSONB NOT NULL, -- Storing as JSONB for v1 simplicity
    leaks JSONB NOT NULL  -- Storing as JSONB for v1 simplicity
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own analyses"
    ON public.analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
    ON public.analyses FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Puzzles table
-- Stores personalized puzzles generated from analysis.
-- Mirrors the UserPuzzle domain entity.
CREATE TABLE IF NOT EXISTS public.puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    source_game_id TEXT NOT NULL,
    source_move_number INTEGER NOT NULL,
    fen TEXT NOT NULL,
    best_move TEXT NOT NULL,
    played_move TEXT NOT NULL,
    leak_type TEXT NOT NULL,
    theme TEXT,
    rating_hint INTEGER,
    solved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own puzzles"
    ON public.puzzles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own puzzles"
    ON public.puzzles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own puzzles"
    ON public.puzzles FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_user_id ON public.puzzles(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_source_game_id ON public.puzzles(source_game_id);
