# MantleMask

MantleMask is a privacy solution for Mantle Network that enables anonymous transfers of MNT tokens using zero-knowledge proofs. Inspired by Tornado Cash, it allows users to break the on-chain link between source and destination addresses.

## Proof of Concept

This is a proof of concept implementation that currently supports only 10 MNT denomination. The full version would support multiple denominations (10, 100, 500, 1000 MNT).

## How It Works

1. **Deposit**: A user deposits 10 MNT and receives a secret note
2. **Wait**: For better anonymity, wait for other users to make deposits
3. **Withdraw**: Using a different wallet, the user can withdraw the same amount using their secret note
4. **Privacy**: The on-chain link between the deposit and withdrawal addresses is broken

## Features

- **Zero-Knowledge Proofs**: Uses zero-knowledge proofs to validate withdrawals without revealing the link to deposits
- **Fixed Denomination**: Currently supports 10 MNT denomination for the proof of concept
- **Incremental Merkle Tree**: Efficient on-chain Merkle tree implementation
- **Poseidon Hash**: ZK-friendly hash function for commitments and nullifiers
- **Modern UI**: Clean and intuitive user interface

## Architecture

### Smart Contracts

- **MerkleTreeWithHistory.sol**: Implements an incremental Merkle tree with historical roots
- **MantleMask.sol**: Main contract handling deposits and withdrawals
- **Verifier.sol**: Verifies zero-knowledge proofs
- **PoseidonT3.sol**: Library for the Poseidon hash function

### Frontend

- Built with Next.js and React
- Uses ThirdWeb for wallet connections and contract interactions
- Implements client-side cryptography for note generation and proof verification

## Getting Started

### Prerequisites

- Node.js and npm
- A wallet with MNT on Mantle Sepolia testnet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mantlemask.git
cd mantlemask
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm run dev
```

### Deployment

See [DeploymentGuide.md](./contracts/DeploymentGuide.md) for detailed instructions on deploying the contracts.

## Usage

### Making a Deposit

1. Connect your wallet
2. Ensure you have at least 10 MNT
3. Click "Deposit" and confirm the transaction
4. Save the generated note securely

### Making a Withdrawal

1. Connect a different wallet
2. Go to the Withdraw page
3. Enter your note
4. Click "Withdraw" and confirm the transaction

## Future Enhancements

- Support for multiple denominations (100, 500, 1000 MNT)
- Integration with relayers to enhance privacy
- Real zero-knowledge circuit implementation
- Support for ERC-20 tokens

## Security Considerations

- **Note Security**: Your note is the only way to withdraw funds - keep it secure
- **Timing**: For better anonymity, wait some time between deposit and withdrawal
- **Gas**: Use a wallet with enough MNT for gas when withdrawing

## Development

### Running Tests

```bash
# Smart contract tests
cd contracts
npx hardhat test

# Frontend tests
npm test
```

### Building for Production

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Tornado Cash](https://tornado.cash/)
- Uses [circomlibjs](https://github.com/iden3/circomlibjs) for cryptographic operations
- Built on [Mantle Network](https://www.mantle.xyz/)
