import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Play } from "lucide-react";
import { toast } from "sonner";

interface Lobby {
  id: string;
  code: string;
  host_wallet: string;
  guest_wallet: string | null;
  game_started: boolean;
}

interface LobbyListProps {
  currentWallet: string;
  onJoinLobby: (lobbyId: string, code: string) => void;
}

export const LobbyList = ({ currentWallet, onJoinLobby }: LobbyListProps) => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);

  useEffect(() => {
    fetchLobbies();

    const channel = supabase
      .channel('lobby-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobbies'
        },
        () => {
          fetchLobbies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLobbies = async () => {
    const { data, error } = await supabase
      .from('lobbies')
      .select('*')
      .eq('game_started', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lobbies:', error);
      return;
    }

    setLobbies(data || []);
  };

  const handleJoin = async (lobby: Lobby) => {
    if (lobby.guest_wallet) {
      toast.error("Lobby is full");
      return;
    }

    if (lobby.host_wallet === currentWallet) {
      toast.error("You can't join your own lobby");
      return;
    }

    const { error } = await supabase
      .from('lobbies')
      .update({ guest_wallet: currentWallet })
      .eq('id', lobby.id);

    if (error) {
      toast.error("Failed to join lobby");
      return;
    }

    onJoinLobby(lobby.id, lobby.code);
    toast.success("Joined lobby!");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Available Lobbies</h2>
      <div className="grid gap-4">
        {lobbies.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No lobbies available. Create one to get started!</p>
          </Card>
        ) : (
          lobbies.map((lobby) => (
            <Card key={lobby.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-mono font-bold text-lg">{lobby.code}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Host: {lobby.host_wallet.slice(0, 8)}...
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${lobby.guest_wallet ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    {lobby.guest_wallet ? '2/2' : '1/2'}
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => handleJoin(lobby)}
                disabled={!!lobby.guest_wallet || lobby.host_wallet === currentWallet}
                className="bg-gradient-to-r from-cat-pink to-fox-blue text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Join
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
