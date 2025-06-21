# MantleMask - zkSNARK Privacy Mixer

A privacy-preserving cryptocurrency mixer using zero-knowledge proofs on the Mantle Network.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Circom compiler

### Step 1: Install Dependencies
```bash
npm install

# Install Circom globally
npm install -g circom
```

### Step 2: Compile Circuit
```bash
npm run build
```
This generates:
- `build/withdraw.wasm` - WebAssembly for proof generation
- `build/withdraw.r1cs` - R1CS constraint system

### Step 3: Setup Trusted Setup
```bash
npm run setup
```
This:
- Downloads Powers of Tau ceremony file
- Generates proving key (`withdraw_final.zkey`)
- Generates verification key (`verification_key.json`)
- Creates Solidity verifier (`contracts/Verifier.sol`)

### Step 4: Generate Proof
```bash
npm run generate-proof
```
Creates a zkSNARK proof in `build/proof.json`

### Step 5: Verify Proof
```bash
npm run verify-proof
```
Verifies the generated proof off-chain

## 🔧 Usage

### 1. Deploy Contracts
```solidity
// Deploy MantleMask
MantleMask mixer = new MantleMask(1 ether, 20);
```

### 2. Make Deposit
```javascript
const { generateCommitment } = require('./scripts/generateProof');

const nullifier = "123456789";
const secret = "987654321";
const { commitment } = generateCommitment(nullifier, secret);

// Deposit on-chain
await mixer.deposit(commitment, { value: ethers.utils.parseEther("1") });
```

### 3. Generate Withdrawal Proof
```javascript
const { generateProof } = require('./scripts/generateProof');

const proof = await generateProof(
    nullifier,
    secret,
    recipientAddress
);
```

### 4. Withdraw
```javascript
// Use the generated proof to withdraw
await mixer.withdraw(
    proof.proof,           // zkSNARK proof
    proof.publicSignals[0], // Merkle root  
    proof.nullifierHash,   // Nullifier hash
    recipientAddress       // Recipient
);
```

## 📁 File Structure

```
├── circuits/
│   ├── withdraw.circom      # Main withdrawal circuit
│   └── merkleTree.circom    # Merkle tree verification
├── contracts/
│   ├── MantleMask.sol       # Main privacy mixer contract
│   └── Verifier.sol         # Generated zkSNARK verifier
├── scripts/
│   ├── setup.js             # Trusted setup generation
│   ├── generateProof.js     # Proof generation
│   └── verifyProof.js       # Proof verification
└── build/                   # Generated files
    ├── withdraw.wasm
    ├── withdraw.r1cs
    ├── withdraw_final.zkey
    ├── verification_key.json
    └── proof.json
```

## 🔐 How It Works

### Circuit Logic
1. **Input Validation**: Verifies knowledge of nullifier and secret
2. **Commitment Generation**: `commitment = Poseidon(nullifier, secret)`
3. **Nullifier Hash**: `nullifierHash = Poseidon(nullifier)`
4. **Merkle Proof**: Proves commitment is in the deposit tree
5. **Output**: Generates zkSNARK proof without revealing secrets

### Privacy Guarantees
- ✅ **Anonymity**: No link between deposit and withdrawal addresses
- ✅ **Untraceability**: Nullifier and secret never revealed
- ✅ **Double-spend Protection**: Nullifier hash prevents reuse
- ✅ **Merkle Tree Inclusion**: Proves legitimate deposit

## 🛠️ Development

### Circuit Modification
Edit `circuits/withdraw.circom` and recompile:
```bash
npm run build
npm run setup
```

### Testing
```bash
# Generate and verify a proof
npm run generate-proof
npm run verify-proof
```

## 🚨 Security Notes

⚠️ **For Production Use:**
- Use a proper Powers of Tau ceremony
- Implement ceremony verification
- Add circuit auditing
- Use hardware for key generation

## 📊 Circuit Constraints

- **Total Constraints**: ~2,500 (for 20-level Merkle tree)
- **Public Inputs**: 3 (root, nullifierHash, recipient)
- **Private Inputs**: 42 (nullifier, secret, pathElements[20], pathIndices[20])

## 🎯 Integration Example

```javascript
// Complete workflow example
const MantleMask = require('./scripts/generateProof');

async function privateTransfer() {
    // 1. Generate secrets
    const nullifier = Math.random().toString();
    const secret = Math.random().toString();
    
    // 2. Create commitment and deposit
    const { commitment } = MantleMask.generateCommitment(nullifier, secret);
    await mixer.deposit(commitment, { value: ethers.utils.parseEther("1") });
    
    // 3. Generate proof and withdraw
    const proof = await MantleMask.generateProof(nullifier, secret, recipient);
    await mixer.withdraw(proof.proof, proof.publicSignals[0], proof.nullifierHash, recipient);
    
    console.log("✅ Private transfer complete!");
}
```

## 📄 License
MIT License
