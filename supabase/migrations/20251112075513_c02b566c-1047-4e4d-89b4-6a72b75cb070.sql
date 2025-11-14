-- Create lobbies table
CREATE TABLE public.lobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_wallet TEXT NOT NULL,
  host_ready BOOLEAN DEFAULT false,
  guest_wallet TEXT,
  guest_ready BOOLEAN DEFAULT false,
  game_started BOOLEAN DEFAULT false,
  game_ended BOOLEAN DEFAULT false,
  winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_state table for real-time score syncing
CREATE TABLE public.game_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE CASCADE NOT NULL,
  cat_score INTEGER DEFAULT 0,
  fox_score INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

-- Create policies - lobbies are public for joining
CREATE POLICY "Anyone can view lobbies"
ON public.lobbies
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create lobbies"
ON public.lobbies
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update lobbies"
ON public.lobbies
FOR UPDATE
USING (true);

-- Game state policies
CREATE POLICY "Anyone can view game state"
ON public.game_state
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert game state"
ON public.game_state
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update game state"
ON public.game_state
FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lobbies_updated_at
BEFORE UPDATE ON public.lobbies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at
BEFORE UPDATE ON public.game_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for lobbies and game_state
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;