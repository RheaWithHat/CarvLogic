import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMultiplayerGame = (lobbyId: string | null, isHost: boolean) => {
  const [catScore, setCatScore] = useState(0);
  const [foxScore, setFoxScore] = useState(0);

  useEffect(() => {
    if (!lobbyId) return;

    const channel = supabase
      .channel(`game-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_state',
          filter: `lobby_id=eq.${lobbyId}`
        },
        (payload: any) => {
          setCatScore(payload.new.cat_score);
          setFoxScore(payload.new.fox_score);
        }
      )
      .subscribe();

    fetchGameState();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const fetchGameState = async () => {
    if (!lobbyId) return;

    const { data, error } = await supabase
      .from('game_state')
      .select('*')
      .eq('lobby_id', lobbyId)
      .single();

    if (error) {
      console.error('Error fetching game state:', error);
      return;
    }

    if (data) {
      setCatScore(data.cat_score);
      setFoxScore(data.fox_score);
    }
  };

  const updateScore = async (score: number) => {
    if (!lobbyId) return;

    const field = isHost ? 'cat_score' : 'fox_score';
    
    const { error } = await supabase
      .from('game_state')
      .update({ [field]: score })
      .eq('lobby_id', lobbyId);

    if (error) {
      console.error('Error updating score:', error);
      toast.error("Failed to sync score");
    }
  };

  return {
    catScore,
    foxScore,
    updateScore
  };
};
