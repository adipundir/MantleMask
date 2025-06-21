#!/bin/bash

# MantleMask Setup Script
# This script sets up the necessary files for MantleMask by copying from Tornado Cash repo

echo "Setting up MantleMask..."

# Create necessary directories
mkdir -p contracts/build
mkdir -p circuits/build
mkdir -p lib

# Copy Tornado Cash contracts
echo "Copying contracts from Tornado Cash repo..."
cp tornado-core-repo/contracts/MerkleTreeWithHistory.sol contracts/
cp tornado-core-repo/contracts/Tornado.sol contracts/
cp tornado-core-repo/contracts/Verifier.sol contracts/

# Copy circuit files
echo "Copying circuit files from Tornado Cash repo..."
cp tornado-core-repo/circuits/merkleTree.circom circuits/
cp tornado-core-repo/circuits/withdraw.circom circuits/

# Create a directory for circuit compilation results (will be filled later)
mkdir -p circuits/build

# Download the Tornado Cash circuit artifacts if they don't exist
if [ ! -f "circuits/build/withdraw.wasm" ] || [ ! -f "circuits/build/withdraw_proving_key.bin" ]; then
  echo "Downloading Tornado Cash circuit artifacts..."
  mkdir -p circuits/build
  
  # You would need to implement this part to download from a trusted source
  echo "NOTE: You need to obtain the circuit artifacts from a trusted source"
  echo "      and place them in the circuits/build directory:"
  echo "      - withdraw.wasm"
  echo "      - withdraw_proving_key.bin"
  echo "      - withdraw_verification_key.json"
fi

echo "✅ Setup complete!"
echo "NOTE: For full functionality, you need to:"
echo "1. Implement or obtain a proper Poseidon hash contract"
echo "2. Obtain the compiled circuit artifacts from a trusted source"
echo "3. Ensure your frontend is using the correct hash function (Poseidon) for commitments" 