"use client";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { inAppWallet, createWallet } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";


export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia Testnet",
  rpc: "https://rpc.sepolia.mantle.xyz",
  nativeCurrency: {
    name: "Mantle Sepolia MNT",
    symbol: "MNT",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Mantle Sepolia Explorer",
      url: "https://explorer.sepolia.mantle.xyz",
    },
  ],
  testnet: true,
});

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email", "passkey", "phone", "apple", "github"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
];

export function useWalletState() {
  const activeWallet = useActiveWallet();
  const [isConnected, setIsConnected] = useState(!!activeWallet);

  useEffect(() => {
    setIsConnected(!!activeWallet);
  }, [activeWallet]);

  return {
    isConnected,
    activeWallet,
  };
}

function ConnectWalletButton() {
  const router = useRouter();
  const { isConnected } = useWalletState();

  // Redirect to dashboard when wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push("/deposit");
    }
  }, [isConnected, router]);

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectModal={{ size: "wide" }}
      theme="dark"
      chain={mantleSepolia}
    />
  );
}

export default ConnectWalletButton;
