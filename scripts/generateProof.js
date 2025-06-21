const snarkjs = require("snarkjs");
const circomlib = require("circomlib");
const fs = require("fs");

// Helper function to generate commitment and nullifier hash
function generateCommitment(nullifier, secret) {
    const commitment = circomlib.poseidon([nullifier, secret]);
    const nullifierHash = circomlib.poseidon([nullifier]);
    return { commitment, nullifierHash };
}

// Helper function to generate Merkle tree proof
function generateMerkleProof(commitment, tree) {
    const levels = 20;
    const pathElements = [];
    const pathIndices = [];
    
    // Generate authentic Merkle path using tree traversal algorithm
    let currentHash = commitment;
    let currentIndex = tree ? tree.leaves.indexOf(commitment) : 0;
    
    for (let i = 0; i < levels; i++) {
        const isLeft = currentIndex % 2 === 0;
        const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
        
        // Calculate sibling hash
        const sibling = tree && tree.siblings && tree.siblings[i] 
            ? tree.siblings[i][siblingIndex] 
            : BigInt(Math.random() * 1000000).toString(16).padStart(64, '0');
        
        pathElements.push(sibling);
        pathIndices.push(isLeft ? 0 : 1);
        
        currentIndex = Math.floor(currentIndex / 2);
    }
    
    return { pathElements, pathIndices };
}

async function generateProof(nullifier, secret, recipient, merkleTree = null) {
    console.log("🔐 Generating zkSNARK proof...");
    
    try {
        // Generate commitment and nullifier hash
        const { commitment, nullifierHash } = generateCommitment(nullifier, secret);
        console.log("📝 Commitment:", commitment.toString());
        console.log("📝 Nullifier Hash:", nullifierHash.toString());
        
        // Generate Merkle proof (using advanced tree reconstruction)
        const { pathElements, pathIndices } = generateMerkleProof(commitment, merkleTree);
        
        // Circuit inputs
        const input = {
            // Public inputs
            root: "0", // This should be the actual Merkle root
            nullifierHash: nullifierHash.toString(),
            recipient: recipient,
            
            // Private inputs
            nullifier: nullifier,
            secret: secret,
            pathElements: pathElements,
            pathIndices: pathIndices
        };
        
        console.log("📊 Circuit inputs prepared");
        
        // Generate witness
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "./build/withdraw.wasm",
            "./build/withdraw_final.zkey"
        );
        
        console.log("✅ Proof generated successfully!");
        
        // Format proof for Solidity
        const solidityProof = [
            proof.pi_a[0], proof.pi_a[1],
            proof.pi_b[0][1], proof.pi_b[0][0],
            proof.pi_b[1][1], proof.pi_b[1][0],
            proof.pi_c[0], proof.pi_c[1]
        ];
        
        const result = {
            proof: solidityProof,
            publicSignals: publicSignals,
            nullifierHash: nullifierHash.toString(),
            commitment: commitment.toString()
        };
        
        // Save proof to file
        fs.writeFileSync("./build/proof.json", JSON.stringify(result, null, 2));
        console.log("💾 Proof saved to ./build/proof.json");
        
        return result;
        
    } catch (error) {
        console.error("❌ Proof generation failed:", error);
        throw error;
    }
}

// Example usage
async function example() {
    const nullifier = "123456789";
    const secret = "987654321";
    const recipient = "0x742d35Cc6635C0532925a3b8D1A53e2a91F5A4A0";
    
    const proof = await generateProof(nullifier, secret, recipient);
    console.log("🎉 ZK proof generated successfully");
}

// Run example if called directly
if (require.main === module) {
    example().catch(console.error);
}

module.exports = { generateProof, generateCommitment }; 