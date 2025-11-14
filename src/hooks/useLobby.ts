import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lobby {
  id: string;
  code: string;
  host_wallet: string;
  host_ready: boolean;
  guest_wallet: string | null;
  guest_ready: boolean;
  game_started: boolean;
  game_ended: boolean;
  winner: string | null;
}

interface GameState {
  id: string;
  lobby_id: string;
  cat_score: number;
  fox_score: number;
}

export const useLobby = (walletAddress: string | null) => {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isHost, setIsHost] = useState(false);

  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createLobby = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const code = generateLobbyCode();
    const { data, error } = await supabase
      .from("lobbies")
      .insert({
        code,
        host_wallet: walletAddress,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create lobby");
      console.error(error);
      return;
    }

    // Create game state
    await supabase.from("game_state").insert({
      lobby_id: data.id,
    });

    setLobby(data);
    setIsHost(true);
    toast.success(`Lobby created! Code: ${code}`);
  };

  const joinLobby = async (code: string) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const { data, error } = await supabase
      .from("lobbies")
      .select()
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      toast.error("Lobby not found");
      return;
    }

    if (data.guest_wallet) {
      toast.error("Lobby is full");
      return;
    }

    const { error: updateError } = await supabase
      .from("lobbies")
      .update({ guest_wallet: walletAddress })
      .eq("id", data.id);

    if (updateError) {
      toast.error("Failed to join lobby");
      return;
    }

    setLobby({ ...data, guest_wallet: walletAddress });
    setIsHost(false);
    toast.success("Joined lobby!");
  };

  const toggleReady = async () => {
    if (!lobby) return;

    const updateField = isHost ? "host_ready" : "guest_ready";
    const currentReady = isHost ? lobby.host_ready : lobby.guest_ready;

    const { error } = await supabase
      .from("lobbies")
      .update({ [updateField]: !currentReady })
      .eq("id", lobby.id);

    if (error) {
      toast.error("Failed to update ready status");
      return;
    }
  };

  const updateScore = async (catScore: number, foxScore: number) => {
    if (!gameState) return;

    const { error } = await supabase
      .from("game_state")
      .update({ cat_score: catScore, fox_score: foxScore })
      .eq("lobby_id", lobby?.id);

    if (error) {
      console.error("Failed to update score:", error);
    }
  };

  const leaveLobby = async () => {
    if (!lobby) return;

    if (isHost) {
      await supabase.from("lobbies").delete().eq("id", lobby.id);
    } else {
      await supabase
        .from("lobbies")
        .update({ guest_wallet: null, guest_ready: false })
        .eq("id", lobby.id);
    }

    setLobby(null);
    setGameState(null);
    setIsHost(false);
  };

  // Subscribe to lobby updates
  useEffect(() => {
    if (!lobby) return;

    const channel = supabase
      .channel(`lobby:${lobby.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${lobby.id}`,
        },
        (payload) => {
          setLobby(payload.new as Lobby);
        }
      )
      .subscribe();

    const gameChannel = supabase
      .channel(`game:${lobby.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          setGameState(payload.new as GameState);
        }
      )
      .subscribe();

    // Fetch initial game state
    supabase
      .from("game_state")
      .select()
      .eq("lobby_id", lobby.id)
      .single()
      .then(({ data }) => {
        if (data) setGameState(data);
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(gameChannel);
    };
  }, [lobby?.id]);

  // Start game when both players are ready
  useEffect(() => {
    if (
      lobby &&
      lobby.host_ready &&
      lobby.guest_ready &&
      !lobby.game_started &&
      isHost
    ) {
      supabase
        .from("lobbies")
        .update({ game_started: true })
        .eq("id", lobby.id);
    }
  }, [lobby, isHost]);

  return {
    lobby,
    gameState,
    isHost,
    createLobby,
    joinLobby,
    toggleReady,
    updateScore,
    leaveLobby,
  };
};
