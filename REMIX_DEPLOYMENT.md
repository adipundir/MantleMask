# Deploying MantleMask with Remix IDE

This guide explains how to deploy the MantleMask privacy protocol contract using Remix IDE.

## Prerequisites

- A web browser with MetaMask or another web3 wallet installed
- Some MNT for gas fees

## Deployment Steps

### 1. Open Remix IDE

Navigate to [Remix IDE](https://remix.ethereum.org) in your browser.

### 2. Create Contract File

Create the following file in the Remix file explorer:

- `MantleMask.sol`

Copy the code from the MantleMask.sol file in this repository to the file in Remix.

### 3. Compile the Contract

1. Go to the "Solidity Compiler" tab in Remix
2. Set the compiler version to 0.8.24
3. Enable optimization (recommended: 200 runs)
4. Compile the contract

### 4. Deploy the Contract

1. Go to the "Deploy & Run Transactions" tab
2. Select "MantleMask" from the contract dropdown
3. Enter the following parameters:
   - `_denomination`: The denomination in wei (e.g., "100000000000000000" for 0.1 MNT)
   - `_merkleTreeHeight`: 20 (recommended)
4. Click "Deploy"
5. Save the deployed contract address

### 5. Verify Deployment

After deployment, you can interact with your contract:

1. Go to the "Deploy & Run Transactions" tab
2. Find your deployed contract under "Deployed Contracts"
3. Test basic functions like checking the denomination

## Important Notes

- The contract contains hardcoded verification keys that should be replaced with your own generated keys for production use
- Make sure to test thoroughly on a testnet before deploying to mainnet
- The Poseidon hasher implementation provides enhanced privacy and zero-knowledge compatibility 