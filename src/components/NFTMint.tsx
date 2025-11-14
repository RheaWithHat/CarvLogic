import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, Sparkles } from "lucide-react";

interface NFTMintProps {
  catScore: number;
  foxScore: number;
}

export const NFTMint = ({ catScore, foxScore }: NFTMintProps) => {
  const [minting, setMinting] = useState(false);

  const mintNFT = async () => {
    setMinting(true);
    
    try {
      // Simulate CARV testnet transaction
      const tx = {
        type: "Heart NFT Mint",
        scores: { cat: catScore, fox: foxScore },
        winner: catScore > foxScore ? "Pink Cat" : "Blue Fox",
        timestamp: new Date().toISOString(),
      };

      // Simulate transaction to rpc.testnet.carv.io
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success("Heart NFT Minted!", {
        description: `Winner: ${tx.winner} | Tx sent to rpc.testnet.carv.io`,
        icon: <Heart className="text-destructive" />,
      });
      
      console.log("NFT Mint Transaction:", tx);
    } catch (error) {
      toast.error("Failed to mint NFT");
      console.error("Minting error:", error);
    } finally {
      setMinting(false);
    }
  };

  const canMint = catScore > 100 || foxScore > 100;

  return (
    <Button
      onClick={mintNFT}
      disabled={!canMint || minting}
      className="bg-destructive text-white font-bold text-lg px-8 py-6 rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
    >
      <Heart className="w-6 h-6 mr-2 fill-current" />
      {minting ? "Minting..." : "Mint Heart NFT"}
      <Sparkles className="w-5 h-5 ml-2" />
    </Button>
  );
};
