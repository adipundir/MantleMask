# MantleMask Deployment Guide

This guide provides step-by-step instructions for deploying the MantleMask contracts, a privacy solution for Mantle Network inspired by Tornado Cash.

## Proof of Concept

This is a proof of concept implementation that currently supports only 10 MNT denomination. The full version would support multiple denominations.

## Prerequisites

1. Node.js and npm installed
2. Hardhat or Foundry installed
3. A wallet with MNT on Mantle Sepolia testnet
4. An RPC endpoint for Mantle Sepolia

## Contract Architecture

MantleMask consists of the following contracts:

1. **MerkleTreeWithHistory.sol**: Base contract that implements the incremental Merkle tree
2. **MantleMask.sol**: Main contract that handles deposits and withdrawals
3. **Verifier.sol**: Contract that verifies zero-knowledge proofs
4. **PoseidonT3.sol**: Library for the Poseidon hash function

## Deployment Steps

### 1. Deploy the Verifier Contract

First, deploy the Verifier contract:

```bash
# Using Hardhat
npx hardhat run scripts/deploy-verifier.js --network mantleSepolia

# Using Foundry
forge create --rpc-url https://rpc.sepolia.mantle.xyz \
  --private-key YOUR_PRIVATE_KEY \
  src/Verifier.sol:Verifier
```

Save the deployed Verifier contract address.

### 2. Deploy MantleMask Instance

Deploy a single MantleMask instance for 10 MNT denomination:

```bash
# Using Hardhat
npx hardhat run scripts/deploy-mantlemask.js --network mantleSepolia \
  --denomination 10000000000000000000 \
  --verifier VERIFIER_ADDRESS \
  --merkle-height 20

# Using Foundry
forge create --rpc-url https://rpc.sepolia.mantle.xyz \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args 10000000000000000000 20 VERIFIER_ADDRESS \
  src/MantleMask.sol:MantleMask
```

### 3. Update Frontend Configuration

After deployment, update the `lib/config.ts` file with the deployed contract addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  mantleMask: "0x...", // 10 MNT instance
  verifier: "0x..." // Verifier contract address
};
```

## Testing the Deployment

### 1. Test a Deposit

1. Connect your wallet to the MantleMask frontend
2. Click "Deposit" and confirm the transaction
3. Save the generated note securely

### 2. Test a Withdrawal

1. Connect a different wallet to the MantleMask frontend
2. Go to the Withdraw page
3. Enter the note from the deposit
4. Click "Withdraw" and confirm the transaction
5. Verify that the funds are received in the new wallet

## Security Considerations

1. **ZK Proofs**: In a production environment, you would need to generate real zero-knowledge proofs using a circuit compiler like circom
2. **Merkle Tree**: The Merkle tree height determines the maximum number of deposits. Choose a value that balances gas costs with capacity
3. **Auditing**: Before deploying to mainnet, ensure the contracts are professionally audited
4. **Frontend Security**: Ensure the frontend generates notes and proofs securely, and never sends private data to servers

## Advanced Configuration

### Customizing Merkle Tree Height

The Merkle tree height determines the maximum number of deposits:
- Height 20: ~1 million deposits
- Height 16: ~65,000 deposits
- Height 10: ~1,000 deposits

For testing, a smaller height (e.g., 10) is recommended to save gas.

### Gas Optimization

The contracts use the Poseidon hash function which is optimized for zero-knowledge proofs. However, if gas costs are a concern, you can further optimize:

1. Use a smaller Merkle tree height
2. Deploy the Poseidon hash function as a precompiled contract if supported by the chain

## Future Enhancements

To extend this proof of concept to support multiple denominations:

1. Deploy separate MantleMask instances for each denomination (100, 500, 1000 MNT)
2. Update the frontend config to include all contract addresses
3. Modify the UI to allow selection of different denominations

## Troubleshooting

### Common Issues

1. **Out of Gas**: If transactions fail with "out of gas" errors, try increasing the gas limit or reducing the Merkle tree height
2. **Invalid Proof**: If withdrawals fail with "Invalid proof" errors, ensure the ZK proof generation is working correctly
3. **Contract Verification**: To verify contracts on block explorers, flatten the contracts before deployment

For additional help, refer to the source code comments or open an issue in the repository. 