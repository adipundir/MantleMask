# MantleMask Deployment Instructions

This document provides step-by-step instructions for deploying the MantleMask contracts using Remix IDE.

## Prerequisites

1. Access to [Remix IDE](https://remix.ethereum.org/)
2. MetaMask or another web3 wallet connected to Mantle Network
3. Some ETH on Mantle Network for gas fees

## Deployment Steps

### Step 1: Import Contracts to Remix

Upload all the contract files to Remix:
- `MantleToken.sol`
- `MantleMask.sol`
- `MerkleTreeWithHistory.sol`
- `Verifier.sol`
- `interfaces/IMerkleTreeWithHistory.sol`
- `libraries/PoseidonT3.sol`

### Step 2: Install OpenZeppelin Contracts

In Remix, go to the "Plugin Manager" tab and activate the "Remixd" plugin. Then use the "File Explorers" tab to install OpenZeppelin contracts:

```bash
npm install @openzeppelin/contracts
```

### Step 3: Compile Contracts

1. Go to the "Solidity Compiler" tab
2. Select compiler version 0.8.20
3. Enable optimization with 200 runs
4. Compile each contract in the following order:
   - `PoseidonT3.sol`
   - `IMerkleTreeWithHistory.sol`
   - `MerkleTreeWithHistory.sol`
   - `Verifier.sol`
   - `MantleToken.sol`
   - `MantleMask.sol`

### Step 4: Deploy Contracts

Deploy the contracts in the following order:

#### 1. Deploy MantleToken

1. Select `MantleToken.sol` from the dropdown
2. Click "Deploy"
3. Save the deployed token address: `TOKEN_ADDRESS`

#### 2. Deploy Verifier

1. Select `Verifier.sol` from the dropdown
2. Click "Deploy"
3. Save the deployed verifier address: `VERIFIER_ADDRESS`

#### 3. Deploy MantleMask

1. Select `MantleMask.sol` from the dropdown
2. Enter the following constructor parameters:
   - `_token`: `TOKEN_ADDRESS` (from step 1)
   - `_merkleTreeHeight`: `20` (recommended for production, use smaller values like 10 for testing)
   - `_denomination`: `1000000000000000000` (1 token with 18 decimals)
   - `_verifier`: `VERIFIER_ADDRESS` (from step 2)
3. Click "Deploy"
4. Save the deployed MantleMask address: `MANTLEMASK_ADDRESS`

### Step 5: Verify Deployment

1. Interact with the MantleToken contract:
   - Call `mintTestTokens` with an amount (e.g., `1000000000000000000` for 1 token)
   - Call `approve` with parameters:
     - `spender`: `MANTLEMASK_ADDRESS`
     - `amount`: `1000000000000000000` (or more, depending on how many deposits you want to make)

2. Interact with the MantleMask contract:
   - Call `deposit` with a commitment hash generated from your frontend
   - Verify the deposit was successful by checking the emitted events

## Notes on ZK Proofs

For a production deployment, you would need:

1. A proper ZK circuit implementation (using circom or another ZK framework)
2. A properly generated verifier contract from the circuit
3. A more efficient Poseidon hash implementation

This implementation uses simplified placeholders for these components to demonstrate the contract structure.

## Frontend Integration

To integrate with your frontend:

1. Update the frontend to use the deployed contract addresses
2. Generate commitments using the Poseidon hash function
3. Generate ZK proofs for withdrawals
4. Handle the note format properly

For example, to create a commitment:
```javascript
import { buildPoseidon } from "circomlibjs";

async function generateCommitment() {
  const poseidon = await buildPoseidon();
  const nullifier = generateSecureRandomField();
  const secret = generateSecureRandomField();
  const commitment = poseidon([nullifier, secret]);
  
  return {
    nullifier,
    secret,
    commitment: poseidon.F.toString(commitment)
  };
}
``` 