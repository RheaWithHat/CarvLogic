import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameMatch3 } from "@/components/GameMatch3";
import { HPBar } from "@/components/HPBar";
import { ComboEffect } from "@/components/ComboEffect";
import { WalletConnect } from "@/components/WalletConnect";
import { NFTMint } from "@/components/NFTMint";
import { LobbyList } from "@/components/LobbyList";
import { LobbyRoom } from "@/components/LobbyRoom";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { useAIOpponent } from "@/hooks/useAIOpponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Bot } from "lucide-react";
import { toast } from "sonner";
import arenaBackground from "@/assets/arena-background.jpg";
type GameState = 'menu' | 'lobby-list' | 'lobby-room' | 'playing' | 'solo-playing';
const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [showCombo, setShowCombo] = useState(false);
  const [combo, setCombo] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [catHP, setCatHP] = useState(100);
  const [foxHP, setFoxHP] = useState(100);
  const [restartCountdown, setRestartCountdown] = useState<number | null>(null);
  const {
    catScore,
    foxScore,
    updateScore
  } = useMultiplayerGame(lobbyId, isHost);
  const {
    aiScore,
    resetAiScore
  } = useAIOpponent(gameState === 'solo-playing');

  // Winner detection
  useEffect(() => {
    if (gameState === 'playing') {
      const catHPCalc = Math.max(0, 100 - Math.min(foxScore / 10, 100));
      const foxHPCalc = Math.max(0, 100 - Math.min(catScore / 10, 100));
      setCatHP(catHPCalc);
      setFoxHP(foxHPCalc);
      if (catHPCalc <= 0 && !winner) {
        setWinner("Blue Fox");
      } else if (foxHPCalc <= 0 && !winner) {
        setWinner("Pink Cat");
      }
    }
  }, [catScore, foxScore, gameState, winner]);
  useEffect(() => {
    if (gameState === 'solo-playing') {
      const playerHP = Math.max(0, 100 - Math.min(aiScore / 10, 100));
      const aiHP = Math.max(0, 100 - Math.min(playerScore / 10, 100));
      if (playerHP <= 0 && !winner) {
        setWinner("AI Opponent");
      } else if (aiHP <= 0 && !winner) {
        setWinner("You");
      }
    }
  }, [playerScore, aiScore, gameState, winner]);
  const handleCatScore = (score: number) => {
    if (score > catScore) {
      const diff = score - catScore;
      if (diff >= 50) {
        setCombo(prev => prev + 1);
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
      }
    }
    updateScore(score);
  };
  const handleFoxScore = (score: number) => {
    if (score > foxScore) {
      const diff = score - foxScore;
      if (diff >= 30) {
        setCombo(prev => prev + 1);
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
      }
    }
    updateScore(score);
  };
  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  const createLobby = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    const code = generateLobbyCode();
    const {
      data,
      error
    } = await supabase.from('lobbies').insert({
      code,
      host_wallet: walletAddress
    }).select().single();
    if (error) {
      toast.error("Failed to create lobby");
      return;
    }
    setLobbyId(data.id);
    setLobbyCode(code);
    setIsHost(true);
    setGameState('lobby-room');
    toast.success("Lobby created!");
  };
  const joinLobbyByCode = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!joinCode.trim()) {
      toast.error("Please enter a lobby code");
      return;
    }
    const {
      data,
      error
    } = await supabase.from('lobbies').select('*').eq('code', joinCode.toUpperCase()).eq('game_started', false).single();
    if (error || !data) {
      toast.error("Lobby not found");
      return;
    }
    if (data.guest_wallet) {
      toast.error("Lobby is full");
      return;
    }
    if (data.host_wallet === walletAddress) {
      toast.error("You can't join your own lobby");
      return;
    }
    const {
      error: updateError
    } = await supabase.from('lobbies').update({
      guest_wallet: walletAddress
    }).eq('id', data.id);
    if (updateError) {
      toast.error("Failed to join lobby");
      return;
    }
    setLobbyId(data.id);
    setLobbyCode(data.code);
    setIsHost(false);
    setGameState('lobby-room');
    toast.success("Joined lobby!");
  };
  const handleJoinFromList = (id: string, code: string) => {
    setLobbyId(id);
    setLobbyCode(code);
    setIsHost(false);
    setGameState('lobby-room');
  };
  const handleStartGame = () => {
    setGameState('playing');
  };
  const handleBackToMenu = async () => {
    // If host leaves the lobby room, delete the lobby
    if (isHost && lobbyId && (gameState === 'lobby-room' || gameState === 'lobby-list')) {
      const {
        error
      } = await supabase.from('lobbies').delete().eq('id', lobbyId);
      if (error) {
        console.error('Error deleting lobby:', error);
        toast.error("Failed to delete lobby");
      }
    }
    setGameState('menu');
    setLobbyId(null);
    setLobbyCode("");
    setJoinCode("");
    setPlayerScore(0);
    setWinner(null);
    setCatHP(100);
    setFoxHP(100);
    resetAiScore();
  };
  const handleStartSolo = () => {
    setPlayerScore(0);
    setWinner(null);
    resetAiScore();
    setGameState('solo-playing');
  };
  const handlePlayerScore = (score: number) => {
    if (score > playerScore) {
      const diff = score - playerScore;
      if (diff >= 50) {
        setCombo(prev => prev + 1);
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
      }
    }
    setPlayerScore(score);
  };

  const handleRestart = () => {
    setRestartCountdown(3);
  };

  useEffect(() => {
    if (restartCountdown === null) return;

    if (restartCountdown === 0) {
      if (gameState === 'solo-playing') {
        handleStartSolo();
      } else if (gameState === 'playing') {
        setPlayerScore(0);
        setWinner(null);
        setCatHP(100);
        setFoxHP(100);
      }
      setRestartCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setRestartCountdown(restartCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [restartCountdown, gameState]);
  return <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative overflow-hidden" style={{
    backgroundImage: `url(${arenaBackground})`
  }}>
      <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {gameState !== 'menu' && gameState !== 'playing' && gameState !== 'solo-playing' && <Button variant="ghost" size="icon" onClick={handleBackToMenu}>
                <ArrowLeft className="w-5 h-5" />
              </Button>}
            <h1 className="text-4xl md:text-5xl font-black">
              <span className="text-gradient-pink text-pink-600">CARV</span>
              <span className="text-foreground"> Buddies </span>
              <span className="text-gradient-blue">Puzzle Duel</span>
            </h1>
          </div>
          
          <WalletConnect onConnect={setWalletAddress} onDisconnect={() => {
          setWalletAddress(null);
          setGameState('menu');
        }} />
        </div>

        {gameState === 'menu' && <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md w-full space-y-6">
              <h2 className="text-3xl font-bold text-center">Choose Game Mode</h2>
              
              <div className="space-y-4">
                <Button onClick={handleStartSolo} className="w-full bg-gradient-to-r from-game-purple to-game-yellow text-white h-16 text-lg">
                  <Bot className="w-6 h-6 mr-2" />
                  Play Solo vs AI
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or play multiplayer</span>
                  </div>
                </div>

                {!walletAddress ? <p className="text-center text-muted-foreground">
                    Connect your Backpack wallet for multiplayer
                  </p> : <div className="space-y-4">
                    <Button onClick={createLobby} className="w-full bg-gradient-to-r from-cat-pink to-fox-blue text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Lobby
                    </Button>

                    <div className="space-y-2">
                      <Input placeholder="Enter lobby code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="text-center font-mono text-lg" />
                      <Button onClick={joinLobbyByCode} variant="outline" className="w-full">
                        Join by Code
                      </Button>
                    </div>

                    <Button onClick={() => setGameState('lobby-list')} variant="outline" className="w-full">
                      Browse Lobbies
                    </Button>
                  </div>}
              </div>
            </Card>
          </div>}

        {gameState === 'lobby-list' && walletAddress && <LobbyList currentWallet={walletAddress} onJoinLobby={handleJoinFromList} />}

        {gameState === 'lobby-room' && lobbyId && walletAddress && <LobbyRoom lobbyId={lobbyId} lobbyCode={lobbyCode} currentWallet={walletAddress} isHost={isHost} onStartGame={handleStartGame} />}

        {gameState === 'solo-playing' && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <HPBar player="cat" score={playerScore} opponentScore={aiScore} />
              <HPBar player="fox" score={aiScore} opponentScore={playerScore} />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center">
              <div className="animate-in slide-in-from-left duration-500">
                <GameMatch3 onScoreChange={handlePlayerScore} />
              </div>
              <div className="animate-in slide-in-from-right duration-500 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Bot className="w-24 h-24 text-fox-blue animate-pulse" />
                  <p className="text-2xl font-bold text-gradient-blue">AI Opponent</p>
                  <p className="text-lg text-muted-foreground">Playing automatically...</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8 mb-4 gap-4">
              <Button onClick={handleBackToMenu} variant="outline">
                Back to Menu
              </Button>
              <Button onClick={handleRestart} className="bg-gradient-to-r from-game-purple to-game-yellow text-white">
                Restart Game
              </Button>
            </div>
          </>}

        {gameState === 'playing' && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <HPBar player="cat" score={catScore} opponentScore={foxScore} />
              <HPBar player="fox" score={foxScore} opponentScore={catScore} />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center">
              {isHost ? <>
                  <div className="animate-in slide-in-from-left duration-500">
                    <GameMatch3 onScoreChange={handleCatScore} />
                  </div>
                  <div className="animate-in slide-in-from-right duration-500">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-muted-foreground">Opponent's Game</p>
                      <p className="text-lg text-muted-foreground">Match-3</p>
                    </div>
                  </div>
                </> : <>
                  <div className="animate-in slide-in-from-left duration-500">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-muted-foreground">Opponent's Game</p>
                      <p className="text-lg text-muted-foreground">Match-3</p>
                    </div>
                  </div>
                  <div className="animate-in slide-in-from-right duration-500">
                    <GameMatch3 onScoreChange={handleFoxScore} />
                  </div>
                </>}
            </div>

            <div className="flex justify-center mt-8 mb-4 gap-4">
              <Button onClick={handleBackToMenu} variant="outline">
                Back to Menu
              </Button>
              <Button onClick={handleRestart} className="bg-gradient-to-r from-cat-pink to-fox-blue text-white">
                Restart Game
              </Button>
              <NFTMint catScore={catScore} foxScore={foxScore} />
            </div>
          </>}

        <div className="text-center text-sm text-muted-foreground mt-4">
          Connected to <span className="font-semibold text-foreground">rpc.testnet.carv.io</span>
        </div>
      </div>

      <ComboEffect show={showCombo} combo={combo} />
      
      {restartCountdown !== null && restartCountdown > 0 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="p-12 text-center space-y-6 animate-in zoom-in duration-300">
            <h2 className="text-6xl font-black text-gradient-blue">{restartCountdown}</h2>
            <p className="text-2xl font-bold">Restarting...</p>
          </Card>
        </div>
      )}

      {winner && <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="p-12 text-center space-y-6 max-w-md animate-in zoom-in duration-500">
            <h2 className="text-5xl font-black text-gradient-blue">🎉 Victory! 🎉</h2>
            <p className="text-3xl font-bold">{winner} Wins!</p>
            <Button onClick={handleBackToMenu} className="w-full bg-gradient-to-r from-cat-pink to-fox-blue text-white text-lg h-12">
              Back to Menu
            </Button>
          </Card>
        </div>}
    </div>;
};
export default Index;