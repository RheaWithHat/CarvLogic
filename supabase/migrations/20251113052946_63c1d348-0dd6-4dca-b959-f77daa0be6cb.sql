-- Add last_activity column to track lobby activity
ALTER TABLE public.lobbies 
ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing lobbies to have last_activity set
UPDATE public.lobbies 
SET last_activity = updated_at 
WHERE last_activity IS NULL;

-- Create trigger to automatically update last_activity on any lobby update
CREATE OR REPLACE FUNCTION public.update_lobby_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lobby_activity
BEFORE UPDATE ON public.lobbies
FOR EACH ROW
EXECUTE FUNCTION public.update_lobby_activity();

-- Create function to delete inactive lobbies (older than 30 minutes)
CREATE OR REPLACE FUNCTION public.delete_inactive_lobbies()
RETURNS void AS $$
BEGIN
  DELETE FROM public.lobbies
  WHERE last_activity < (now() - INTERVAL '30 minutes')
    AND game_ended = false;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run every 5 minutes
SELECT cron.schedule(
  'delete-inactive-lobbies',
  '*/5 * * * *',
  $$SELECT public.delete_inactive_lobbies();$$
);