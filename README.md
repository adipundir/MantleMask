# MantleMask

MantleMask is a privacy-focused application for anonymous transfers of native MNT on the Mantle Network. It uses zero-knowledge proofs and Merkle trees to ensure transaction privacy.

## Overview

MantleMask allows users to:

1. **Deposit** native MNT into the privacy pool
2. **Withdraw** MNT to any address without revealing the connection between deposit and withdrawal
3. **Maintain privacy** through zero-knowledge proofs

## How It Works

1. **Deposit**: A user deposits a fixed denomination of MNT (10, 100, 500, or 1000 MNT) along with a commitment hash.
2. **Note Generation**: The user receives a "note" (nullifier + secret) that proves ownership of the deposit.
3. **Merkle Tree**: The commitment is added to a Merkle tree.
4. **Withdrawal**: Later, the user can withdraw by providing a zero-knowledge proof that they know a note corresponding to a commitment in the tree, without revealing which one.

## Architecture

The system consists of two main components:

### Smart Contracts

1. **MantleMask.sol**: The main contract that handles deposits and withdrawals of native MNT. This contract includes the Merkle tree implementation for storing commitments.

2. **Verifier.sol**: A contract that verifies zero-knowledge proofs for private withdrawals.

3. **PoseidonT3.sol**: A library that implements the Poseidon hash function, which is efficient for ZK circuits.

### Frontend (Not Included in This Repository)

The frontend application would:

1. Generate commitment hashes and notes
2. Create zero-knowledge proofs for withdrawals
3. Provide a user interface for deposits and withdrawals

We've included a simple `frontend-example.js` file that demonstrates how to interact with the MantleMask contracts from a JavaScript application using ethers.js and circomlibjs.

## Deployment

See [Deployment Instructions](./contracts/DeploymentInstructions.md) for detailed steps on how to deploy the contracts to the Mantle Network.

## Security Considerations

Before deploying to production, ensure:

1. A proper ZK circuit is implemented and tested
2. The Verifier contract is generated from this circuit
3. The Poseidon hash implementation is secure and efficient
4. The contracts have been professionally audited

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Features

- **Zero-Knowledge Privacy**: Uses Poseidon hash functions and secure cryptographic primitives
- **Anonymous Deposits**: Generate encrypted notes for your deposits
- **Private Withdrawals**: Withdraw funds to any address without revealing the source
- **User-Friendly Interface**: Modern UI with dark mode support
- **Wallet Integration**: Connect with your preferred web3 wallet via Dynamic Labs

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Zero-Knowledge**: circomlibjs for Poseidon hashing
- **Smart Contracts**: Solidity with OpenZeppelin libraries
- **Wallet Integration**: Dynamic Labs SDK
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with next-themes for dark mode

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- MetaMask or another web3 wallet
- Access to Mantle Network (mainnet or testnet)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mantlemask.git
cd mantlemask
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Update contract addresses:
Edit the `app/lib/config.ts` file to include your deployed contract addresses:
```typescript
export const CONTRACT_ADDRESSES = {
  mantleMask: "YOUR_MANTLEMASK_CONTRACT_ADDRESS",
  token: "YOUR_TOKEN_CONTRACT_ADDRESS"
};
```

4. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Contract Deployment

1. Follow the instructions in `contracts/DeploymentInstructions.md` to deploy the contracts using Remix IDE.
2. Once deployed, update the contract addresses in `app/lib/config.ts`.

## Project Structure

```
mantlemask/
├── app/                  # Next.js app directory
│   ├── deposit/          # Deposit page
│   ├── withdraw/         # Withdrawal page
│   ├── components/       # Shared components
│   ├── lib/              # Utility libraries
│   │   ├── zk-utils.ts   # Zero-knowledge utilities
│   │   ├── contract-utils.ts # Contract interaction utilities
│   │   └── config.ts     # Configuration with contract addresses
│   └── ...
├── components/           # React components
├── contracts/            # Solidity smart contracts
│   ├── MantleMask.sol    # Main privacy contract
│   ├── MerkleTreeWithHistory.sol # Merkle tree implementation
│   └── ...
└── ...
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- The Mantle Network team
- The circomlibjs team for their excellent ZK libraries
- The shadcn/ui team for the beautiful components
- The Next.js and React teams
