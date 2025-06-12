# MantleMask

MantleMask is a privacy-focused application built on the Mantle Network that enables anonymous token transfers using zero-knowledge proofs. It allows users to make deposits and withdrawals without revealing the connection between their addresses.

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

## How It Works

### Deposit Flow

1. Connect your wallet
2. Enter the amount you want to deposit
3. Click "Deposit Privately"
4. The app generates a cryptographic note using zero-knowledge primitives
5. Save this note securely - you'll need it to withdraw funds

### Withdrawal Flow

1. Connect your wallet
2. Enter the secret note from your deposit
3. Click "Withdraw Tokens"
4. The app verifies the note's validity using ZK verification
5. Funds are transferred to your wallet anonymously

## Security Considerations

- **Note Security**: The secret note is the only way to recover your funds. Keep it secure.
- **Zero-Knowledge**: The application uses industry-standard cryptographic primitives (Poseidon hash) for commitment generation.
- **Browser Security**: All cryptographic operations happen client-side. Your keys never leave your browser.
- **Smart Contracts**: The contracts implement a Merkle tree for privacy and include safeguards against double-spending.

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Mantle Network team
- The circomlibjs team for their excellent ZK libraries
- The shadcn/ui team for the beautiful components
- The Next.js and React teams
