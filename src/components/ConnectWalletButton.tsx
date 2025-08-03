
import React from "react";
import { Button } from "@/components/ui/button";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { Wallet } from "lucide-react";

const ConnectWalletButton: React.FC = () => {
  const { connected, connecting, connect, account } = useBlockchain();

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    console.log("🔘 Button clicked");
    console.log("📊 Button state:", { connected, connecting, account });
    
    if (connecting) {
      console.log("⏳ Button disabled - connecting");
      return;
    }
    
    if (connected) {
      console.log("✅ Already connected");
      return;
    }
    
    console.log("🚀 Calling connect function...");
    try {
      await connect();
    } catch (error) {
      console.error("🔴 Button handler error:", error);
    }
  };

  console.log("🔄 Button render:", { connected, connecting, account });

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      variant={connected ? "outline" : "default"}
      className={`flex items-center justify-center gap-2 ${
        connected ? "text-green-600 border-green-600" : ""
      }`}
    >
      <Wallet size={18} />
      {connecting
        ? "Connecting..."
        : connected && account
        ? formatAddress(account)
        : "Connect Wallet"}
    </Button>
  );
};

export default ConnectWalletButton;
