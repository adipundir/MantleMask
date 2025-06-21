const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

/**
 * Verify a zkSNARK proof for the MantleMask privacy protocol
 * @param {Object} proofData - The proof data containing proof, public signals, etc.
 * @returns {boolean} - True if proof is valid, false otherwise
 */
async function verifyWithdrawalProof(proofData) {
    console.log("🔍 Verifying zkSNARK proof for privacy withdrawal...");
    
    try {
        // Load verification key
        if (!fs.existsSync("./build/verification_key.json")) {
            throw new Error("Verification key not found. Run setup first.");
        }
        
        const vKey = JSON.parse(fs.readFileSync("./build/verification_key.json"));
        
        // Verify the proof
        const isValid = await snarkjs.groth16.verify(
            vKey, 
            proofData.publicSignals, 
            proofData.proof
        );
        
        if (isValid) {
            console.log("✅ Proof verification successful!");
            console.log("🔐 Withdrawal proof is cryptographically valid");
            console.log("📊 Public inputs verified:");
            console.log(`   Root: ${proofData.publicSignals[0]}`);
            console.log(`   Nullifier Hash: ${proofData.publicSignals[1]}`);
            console.log(`   Recipient: ${proofData.publicSignals[2]}`);
        } else {
            console.log("❌ Proof verification failed!");
            console.log("⚠️  Invalid proof detected - transaction should be rejected");
        }
        
        return isValid;
        
    } catch (error) {
        console.error("❌ Verification error:", error.message);
        return false;
    }
}

/**
 * Batch verify multiple proofs for efficiency
 * @param {Array} proofDataArray - Array of proof data objects
 * @returns {Array} - Array of boolean results
 */
async function batchVerifyProofs(proofDataArray) {
    console.log(`🔍 Batch verifying ${proofDataArray.length} zkSNARK proofs...`);
    
    const results = [];
    for (let i = 0; i < proofDataArray.length; i++) {
        console.log(`Verifying proof ${i + 1}/${proofDataArray.length}...`);
        const result = await verifyWithdrawalProof(proofDataArray[i]);
        results.push(result);
    }
    
    const validCount = results.filter(r => r).length;
    console.log(`✅ Batch verification complete: ${validCount}/${proofDataArray.length} proofs valid`);
    
    return results;
}

// Example verification if called directly
async function example() {
    try {
        // Load a generated proof if available
        const proofPath = path.join(__dirname, "../proofs/proof.json");
        
        if (!fs.existsSync(proofPath)) {
            console.log("No proof found. Generate a proof first with: npm run generate-proof");
            return;
        }
        
        const proofData = JSON.parse(fs.readFileSync(proofPath));
        await verifyWithdrawalProof(proofData);
    } catch (error) {
        console.error("Example verification failed:", error.message);
    }
}

// Run example if called directly
if (require.main === module) {
    example().catch(console.error);
}

module.exports = { 
    verifyWithdrawalProof, 
    batchVerifyProofs 
}; 