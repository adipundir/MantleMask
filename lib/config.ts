// Contract addresses for MantleMask on Mantle Sepolia testnet
export const CONTRACT_ADDRESSES = {
  // Single MantleMask instance for 10 MNT denomination (proof of concept)
  mantleMask: "0x1234567890123456789012345678901234567890", // Replace with actual deployed address
  verifier: "0x0987654321098765432109876543210987654321" // Verifier contract address
};

// ZK Configuration
export const ZK_CONFIG = {
  merkleTreeHeight: 20, // Should match the contract's merkleTreeHeight
  // Only support 10 MNT for the proof of concept
  allowedDenominations: [
    "10"    // 10 MNT
  ],
  // Field size for the Poseidon hash function
  fieldSize: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
  // Number of historical roots stored in the contract
  merkleTreeHistorySize: 100,
  // Network information
  network: {
    name: "Mantle Sepolia",
    chainId: 5003,
    rpcUrl: "https://rpc.sepolia.mantle.xyz"
  }
};

// Contract ABIs
export const CONTRACT_ABIS = {
  mantleMask: [
    "function deposit(bytes32 commitment) external payable",
    "function withdraw(bytes calldata proof, bytes32 root, bytes32 nullifierHash, address payable recipient, address payable relayer, uint256 fee) external",
    "function getLastRoot() external view returns (bytes32)",
    "function isKnownRoot(bytes32 root) external view returns (bool)",
    "function isSpent(bytes32 nullifierHash) external view returns (bool)"
  ],
  verifier: [
    "function verifyProof(bytes calldata proof, bytes32 root, bytes32 nullifierHash, address recipient, address relayer, uint256 fee, uint256 denomination) external view returns (bool)"
  ]
};