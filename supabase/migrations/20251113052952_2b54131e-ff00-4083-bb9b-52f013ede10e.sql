-- Fix search_path for update_lobby_activity function
CREATE OR REPLACE FUNCTION public.update_lobby_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix search_path for delete_inactive_lobbies function
CREATE OR REPLACE FUNCTION public.delete_inactive_lobbies()
RETURNS void AS $$
BEGIN
  DELETE FROM public.lobbies
  WHERE last_activity < (now() - INTERVAL '30 minutes')
    AND game_ended = false;
END;
$$ LANGUAGE plpgsql SET search_path = public;