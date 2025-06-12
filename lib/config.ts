/**
 * MantleMask Configuration
 */

// Contract address (hardcoded for production use)
export const CONTRACT_ADDRESSES = {
  // Replace this with your actual deployed contract address after deployment
  mantleMask: "0x1234567890123456789012345678901234567890" // Example address
};

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 5003, // Mantle Sepolia testnet
  chainName: "Mantle Sepolia Testnet",
  nativeCurrency: {
    name: "Mantle",
    symbol: "MNT",
    decimals: 18
  },
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"]
};

// ZK Configuration
export const ZK_CONFIG = {
  merkleTreeHeight: 20, // Should match the contract's merkleTreeHeight
  allowedDenominations: [
    "10",    // 10 MNT
    "100",   // 100 MNT
    "500",   // 500 MNT
    "1000"   // 1000 MNT
  ]
};

/**
 * Set contract address (call this after deployment)
 * @param mantleMaskAddress Address of the MantleMask contract
 */
export function setContractAddress(mantleMaskAddress: string) {
  CONTRACT_ADDRESSES.mantleMask = mantleMaskAddress;
} 