import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, Users } from "lucide-react";
import { toast } from "sonner";

interface LobbyRoomProps {
  lobbyId: string;
  lobbyCode: string;
  currentWallet: string;
  isHost: boolean;
  onStartGame: () => void;
}

export const LobbyRoom = ({ lobbyId, lobbyCode, currentWallet, isHost, onStartGame }: LobbyRoomProps) => {
  const [hostWallet, setHostWallet] = useState("");
  const [guestWallet, setGuestWallet] = useState<string | null>(null);
  const [hostReady, setHostReady] = useState(false);
  const [guestReady, setGuestReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLobbyData();

    const channel = supabase
      .channel(`lobby-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`
        },
        (payload: any) => {
          const lobby = payload.new;
          setHostWallet(lobby.host_wallet);
          setGuestWallet(lobby.guest_wallet);
          setHostReady(lobby.host_ready);
          setGuestReady(lobby.guest_ready);

          if (lobby.game_started) {
            onStartGame();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const fetchLobbyData = async () => {
    const { data, error } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', lobbyId)
      .single();

    if (error) {
      console.error('Error fetching lobby:', error);
      return;
    }

    setHostWallet(data.host_wallet);
    setGuestWallet(data.guest_wallet);
    setHostReady(data.host_ready);
    setGuestReady(data.guest_ready);
  };

  const toggleReady = async () => {
    const field = isHost ? 'host_ready' : 'guest_ready';
    const newValue = isHost ? !hostReady : !guestReady;

    const { error } = await supabase
      .from('lobbies')
      .update({ [field]: newValue })
      .eq('id', lobbyId);

    if (error) {
      toast.error("Failed to update ready status");
    }
  };

  const startGame = async () => {
    if (!guestWallet) {
      toast.error("Waiting for opponent to join");
      return;
    }

    if (!hostReady || !guestReady) {
      toast.error("Both players must be ready");
      return;
    }

    const { error: lobbyError } = await supabase
      .from('lobbies')
      .update({ game_started: true })
      .eq('id', lobbyId);

    if (lobbyError) {
      toast.error("Failed to start game");
      return;
    }

    const { error: stateError } = await supabase
      .from('game_state')
      .insert({
        lobby_id: lobbyId,
        cat_score: 0,
        fox_score: 0
      });

    if (stateError) {
      console.error('Error creating game state:', stateError);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    toast.success("Lobby code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const myReady = isHost ? hostReady : guestReady;
  const opponentReady = isHost ? guestReady : hostReady;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Lobby Room</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold text-primary">{lobbyCode}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="h-8 w-8"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Share this code with your opponent</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 border-2 ${isHost ? 'border-primary' : 'border-border'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-semibold">Host</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {hostWallet.slice(0, 8)}...{hostWallet.slice(-6)}
              </p>
              <div className={`flex items-center gap-2 text-sm ${hostReady ? 'text-green-500' : 'text-yellow-500'}`}>
                <div className={`w-2 h-2 rounded-full ${hostReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {hostReady ? 'Ready' : 'Not Ready'}
              </div>
            </div>
          </Card>

          <Card className={`p-4 border-2 ${!isHost ? 'border-primary' : 'border-border'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-semibold">Guest</span>
              </div>
              {guestWallet ? (
                <>
                  <p className="text-sm text-muted-foreground font-mono">
                    {guestWallet.slice(0, 8)}...{guestWallet.slice(-6)}
                  </p>
                  <div className={`flex items-center gap-2 text-sm ${guestReady ? 'text-green-500' : 'text-yellow-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${guestReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {guestReady ? 'Ready' : 'Not Ready'}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for opponent...</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Button
            onClick={toggleReady}
            variant={myReady ? "secondary" : "default"}
            className="w-full"
            disabled={!guestWallet}
          >
            {myReady ? 'Cancel Ready' : 'Ready Up'}
          </Button>

          {isHost && (
            <Button
              onClick={startGame}
              disabled={!guestWallet || !hostReady || !guestReady}
              className="w-full bg-gradient-to-r from-cat-pink to-fox-blue text-white"
            >
              Start Game
            </Button>
          )}

          {!isHost && (
            <div className="text-center text-sm text-muted-foreground">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
