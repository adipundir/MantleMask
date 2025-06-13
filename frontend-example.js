/**
 * MantleMask Frontend Example
 * 
 * This file demonstrates how to interact with the MantleMask contracts
 * from a frontend application using ethers.js and circomlibjs.
 */

// Import required libraries
// npm install ethers circomlibjs

const { ethers } = require('ethers');
const circomlibjs = require('circomlibjs');

// Contract ABIs (simplified for this example)
const MantleMaskABI = [
  "function deposit(bytes32 _commitment) external payable",
  "function withdraw(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address payable _recipient, address payable _relayer, uint256 _fee, uint256 _denomination) external",
  "function getLastRoot() external view returns (bytes32)",
  "function isKnownRoot(bytes32 _root) external view returns (bool)",
  "function isSpent(bytes32 _nullifierHash) external view returns (bool)",
  "function getAllowedDenominations() external view returns (uint256[] memory)"
];

// Contract addresses (to be filled after deployment)
const MantleMaskAddress = "0x..."; // Replace with actual address after deployment

// Provider and signer setup
let provider;
let signer;
let mantleMaskContract;

/**
 * Initialize the application
 */
async function initialize() {
  // Connect to the provider (Metamask or other wallet)
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  
  // Initialize contract instances
  mantleMaskContract = new ethers.Contract(MantleMaskAddress, MantleMaskABI, signer);
  
  console.log("MantleMask frontend initialized");
  
  // Get allowed denominations
  const denominations = await mantleMaskContract.getAllowedDenominations();
  console.log("Allowed denominations:", denominations.map(d => ethers.utils.formatEther(d)).join(", ") + " MNT");
}

/**
 * Generate a random field element for the nullifier or secret
 */
function generateSecureRandomField() {
  // Generate a random 31-byte value (to ensure it's less than the snark field size)
  const randomBytes = ethers.utils.randomBytes(31);
  return ethers.BigNumber.from(randomBytes);
}

/**
 * Generate a commitment from nullifier and secret
 */
async function generateCommitment() {
  // Generate random nullifier and secret
  const nullifier = generateSecureRandomField();
  const secret = generateSecureRandomField();
  
  // Initialize Poseidon
  const poseidon = await circomlibjs.buildPoseidon();
  
  // Compute commitment using Poseidon hash
  const commitment = poseidon([nullifier.toBigInt(), secret.toBigInt()]);
  const commitmentHex = ethers.utils.hexlify(poseidon.F.toObject(commitment));
  
  // Create a note to save
  const note = {
    nullifier: nullifier.toHexString(),
    secret: secret.toHexString(),
    commitment: commitmentHex
  };
  
  console.log("Generated note:", note);
  return note;
}

/**
 * Deposit MNT into MantleMask
 */
async function deposit(denomination) {
  try {
    // Generate commitment
    const note = await generateCommitment();
    
    // Convert denomination to wei
    const amount = ethers.utils.parseEther(denomination.toString());
    
    // Make deposit transaction
    const tx = await mantleMaskContract.deposit(note.commitment, {
      value: amount
    });
    
    console.log("Deposit transaction sent:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Deposit confirmed in block:", receipt.blockNumber);
    
    // Save the note securely (in this example, we just return it)
    // In a real application, you would encrypt it or store it securely
    return note;
  } catch (error) {
    console.error("Error during deposit:", error);
    throw error;
  }
}

/**
 * Generate a proof for withdrawal
 * In a real application, this would use a ZK circuit to generate the proof
 */
async function generateProof(note, recipient, fee = 0) {
  // This is a simplified placeholder
  // In a real implementation, you would:
  // 1. Get the Merkle path for the commitment
  // 2. Generate a ZK proof using a circuit (e.g., with snarkjs)
  
  // For this example, we'll just create a dummy proof structure
  const nullifierHash = ethers.utils.keccak256(note.nullifier);
  
  // Get the current root
  const root = await mantleMaskContract.getLastRoot();
  
  // In a real application, this would be the actual ZK proof
  // Here we just create a placeholder bytes value
  const proof = ethers.utils.hexlify(ethers.utils.randomBytes(192));
  
  return {
    proof,
    root,
    nullifierHash,
    recipient,
    fee
  };
}

/**
 * Withdraw MNT from MantleMask
 */
async function withdraw(note, recipient, fee = 0) {
  try {
    // Parse the note
    const parsedNote = typeof note === 'string' ? JSON.parse(note) : note;
    
    // Check if nullifier has been spent
    const nullifierHash = ethers.utils.keccak256(parsedNote.nullifier);
    const isSpent = await mantleMaskContract.isSpent(nullifierHash);
    
    if (isSpent) {
      throw new Error("This note has already been spent");
    }
    
    // Generate proof for withdrawal
    const withdrawData = await generateProof(parsedNote, recipient, fee);
    
    // Get denomination from the note (in a real app, this would be stored with the note)
    // For this example, we'll use the smallest allowed denomination
    const denominations = await mantleMaskContract.getAllowedDenominations();
    const denomination = denominations[0];
    
    // Make withdrawal transaction
    const relayer = fee > 0 ? await signer.getAddress() : ethers.constants.AddressZero;
    
    const tx = await mantleMaskContract.withdraw(
      withdrawData.proof,
      withdrawData.root,
      withdrawData.nullifierHash,
      recipient,
      relayer,
      fee,
      denomination
    );
    
    console.log("Withdrawal transaction sent:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Withdrawal confirmed in block:", receipt.blockNumber);
    
    return receipt;
  } catch (error) {
    console.error("Error during withdrawal:", error);
    throw error;
  }
}

// Example usage
async function runExample() {
  await initialize();
  
  // Deposit 10 MNT
  const note = await deposit(10);
  console.log("Deposit successful! Save this note:", JSON.stringify(note));
  
  // Wait for a while (in a real app, this could be days or weeks later)
  console.log("Waiting for 10 seconds to simulate time passing...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Withdraw to a different address
  const recipientAddress = "0x..."; // Replace with recipient address
  await withdraw(note, recipientAddress);
  console.log("Withdrawal successful!");
}

// Export functions for use in a web application
module.exports = {
  initialize,
  generateCommitment,
  deposit,
  withdraw
};

// Uncomment to run the example
// runExample().catch(console.error); 