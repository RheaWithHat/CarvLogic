import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if ((window as any).backpack) {
        const isConnected = await (window as any).backpack.isConnected();
        if (isConnected) {
          const response = await (window as any).backpack.connect();
          if (response.publicKey) {
            const fullAddr = response.publicKey.toString();
            setFullAddress(fullAddr);
            setAddress(fullAddr.slice(0, 8) + "..." + fullAddr.slice(-6));
            setConnected(true);
            onConnect?.(fullAddr);
          }
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!(window as any).backpack) {
        toast.error("Backpack wallet not found! Please install Backpack extension.");
        return;
      }

      const response = await (window as any).backpack.connect();
      
      if (response.publicKey) {
        const fullAddr = response.publicKey.toString();
        setFullAddress(fullAddr);
        setConnected(true);
        setAddress(fullAddr.slice(0, 8) + "..." + fullAddr.slice(-6));
        onConnect?.(fullAddr);
        toast.success("Wallet connected successfully!", {
          description: `Connected to ${fullAddr.slice(0, 8)}...`,
        });
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAddress("");
    setFullAddress("");
    onDisconnect?.();
    toast.success("Wallet disconnected");
  };

  return (
    <div className="flex items-center gap-2">
      {!connected ? (
        <Button
          onClick={connectWallet}
          className="bg-gradient-to-r from-cat-pink to-fox-blue text-white font-semibold hover:scale-105 transition-transform"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Backpack
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-card border-2 border-primary text-sm font-semibold">
            {address}
          </div>
          <Button
            variant="outline"
            onClick={disconnectWallet}
            className="hover:scale-105 transition-transform"
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
};
