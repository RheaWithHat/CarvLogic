import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Users, Crown } from "lucide-react";
import { toast } from "sonner";

interface LobbyScreenProps {
  lobby: any;
  isHost: boolean;
  onToggleReady: () => void;
  onLeaveLobby: () => void;
  onJoinLobby: (code: string) => void;
  onCreateLobby: () => void;
  walletAddress: string | null;
}

export const LobbyScreen = ({
  lobby,
  isHost,
  onToggleReady,
  onLeaveLobby,
  onJoinLobby,
  onCreateLobby,
  walletAddress,
}: LobbyScreenProps) => {
  const [joinCode, setJoinCode] = useState("");

  const copyLobbyCode = () => {
    if (lobby?.code) {
      navigator.clipboard.writeText(lobby.code);
      toast.success("Lobby code copied!");
    }
  };

  if (!lobby) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-cat-pink/20 via-background to-fox-blue/20">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-3xl">
              <span className="text-gradient-pink">CARV</span>
              <span> Buddies </span>
              <span className="text-gradient-blue">Multiplayer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!walletAddress ? (
              <div className="text-center text-muted-foreground">
                Please connect your Backpack wallet to continue
              </div>
            ) : (
              <>
                <Button
                  onClick={onCreateLobby}
                  className="w-full h-12 bg-gradient-to-r from-cat-pink to-fox-blue hover:scale-105 transition-transform"
                  size="lg"
                >
                  <Crown className="mr-2" />
                  Create Lobby
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Enter lobby code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="h-12 text-center text-lg font-semibold"
                    maxLength={6}
                  />
                  <Button
                    onClick={() => onJoinLobby(joinCode)}
                    className="w-full h-12"
                    variant="outline"
                    disabled={joinCode.length !== 6}
                  >
                    <Users className="mr-2" />
                    Join Lobby
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isReady = isHost ? lobby.host_ready : lobby.guest_ready;
  const opponentReady = isHost ? lobby.guest_ready : lobby.host_ready;
  const waitingForOpponent = !lobby.guest_wallet;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-cat-pink/20 via-background to-fox-blue/20">
      <Card className="w-full max-w-2xl border-2 border-primary/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl space-y-2">
            <div>
              <span className="text-gradient-pink">Lobby</span>
              <span> Code: </span>
              <span className="text-gradient-blue">{lobby.code}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyLobbyCode}
              className="ml-2"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Host */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-cat-pink font-semibold">
                <Crown className="w-4 h-4" />
                Host
              </div>
              <Card className={`p-4 ${lobby.host_ready ? "border-green-500 border-2" : ""}`}>
                <div className="text-sm text-center truncate">
                  {lobby.host_wallet.slice(0, 6)}...{lobby.host_wallet.slice(-4)}
                </div>
                <div className="text-xs text-center mt-2">
                  {lobby.host_ready ? (
                    <span className="text-green-500 font-semibold">✓ Ready</span>
                  ) : (
                    <span className="text-muted-foreground">Waiting...</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Guest */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-fox-blue font-semibold">
                <Users className="w-4 h-4" />
                Guest
              </div>
              <Card className={`p-4 ${lobby.guest_ready ? "border-green-500 border-2" : ""}`}>
                {lobby.guest_wallet ? (
                  <>
                    <div className="text-sm text-center truncate">
                      {lobby.guest_wallet.slice(0, 6)}...{lobby.guest_wallet.slice(-4)}
                    </div>
                    <div className="text-xs text-center mt-2">
                      {lobby.guest_ready ? (
                        <span className="text-green-500 font-semibold">✓ Ready</span>
                      ) : (
                        <span className="text-muted-foreground">Waiting...</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-center text-muted-foreground">
                    Waiting for player...
                  </div>
                )}
              </Card>
            </div>
          </div>

          {waitingForOpponent ? (
            <div className="text-center text-sm text-muted-foreground">
              Share the lobby code with your friend to start playing!
            </div>
          ) : (
            <>
              <Button
                onClick={onToggleReady}
                className={`w-full h-12 ${
                  isReady
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {isReady ? "Not Ready" : "Ready to Play"}
              </Button>

              {lobby.host_ready && lobby.guest_ready && (
                <div className="text-center text-green-500 font-semibold animate-pulse">
                  Starting game...
                </div>
              )}
            </>
          )}

          <Button
            onClick={onLeaveLobby}
            variant="outline"
            className="w-full"
          >
            Leave Lobby
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
