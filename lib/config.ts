/**
 * MantleMask Configuration
 */

export const NETWORK_CONFIG = {
  // Mantle Mainnet
  5000: {
    name: 'Mantle Mainnet',
    rpcUrl: 'https://rpc.mantle.xyz',
    explorer: 'https://explorer.mantle.xyz',
    deployments: {
      // These would be filled in after deployment
      mantleMask: '',
      hasher: '',
      verifier: ''
    }
  },
  // Mantle Testnet
  5003: {
    name: 'Mantle Sepolia',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    explorer: 'https://explorer.sepolia.mantle.xyz',
    deployments: {
      // These would be filled in after deployment
      mantleMask: '',
      hasher: '',
      verifier: ''
    }
  }
};

// Contract addresses - loaded from environment variables
export const CONTRACT_ADDRESSES = {
  mantleMask: process.env.NEXT_PUBLIC_MANTLEMASK_ADDRESS || "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"
};

// ZK Circuit Configuration
export const CIRCUIT_CONFIG = {
  // Merkle tree height
  merkleTreeHeight: 20,
  
  // Circuit artifacts paths
  circuitFiles: {
    wasmFile: '/circuits/build/withdraw.wasm',
    provingKeyFile: '/circuits/build/withdraw_proving_key.bin',
    verificationKeyFile: '/circuits/build/withdraw_verification_key.json'
  }
};

// Available denominations (in ETH)
export const DENOMINATIONS = [
  '0.1',
  '1',
  '10',
  '100'
];

// Hash function constants
export const HASH_CONFIG = {
  // Field size for BN254 curve used in the circuit
  FIELD_SIZE: BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'),
  
  // Zero value for the Merkle tree (same as in MerkleTreeWithHistory.sol)
  ZERO_VALUE: BigInt('21663839004416932945382355908790599225266501822907911457504978515578255421292')
};

// Note format configuration
export const NOTE_PREFIX = 'mantle';

// Default gas settings
export const GAS_CONFIG = {
  deposit: {
    gasLimit: 2000000
  },
  withdraw: {
    gasLimit: 1000000
  }
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

// Contract ABIs - MantleMask privacy mixer
export const CONTRACT_ABIS = {
  mantleMask: [
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_commitment",
          "type": "bytes32"
        }
      ],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "commitment",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "leafIndex",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "Deposit",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        },
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "_nullifierHash",
          "type": "bytes32"
        },
        {
          "internalType": "address payable",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "nullifierHash",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "relayer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fee",
          "type": "uint256"
        }
      ],
      "name": "Withdrawal",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "DENOMINATION",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLastRoot",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_note",
          "type": "bytes32"
        }
      ],
      "name": "isNoteUsed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_note",
          "type": "bytes32"
        }
      ],
      "name": "isValidNote",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lastRoot",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextIndex",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "usedNotes",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "validNotes",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};