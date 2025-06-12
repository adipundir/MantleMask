/**
 * Zero-knowledge utility functions for MantleMask
 * Handles cryptographic operations for private transactions
 */

import { ethers } from "ethers";
// Import circomlibjs for poseidon hash function
import circomlibjs from "circomlibjs";

// Global reference to poseidon function
let poseidonFn: any = null;

/**
 * Initialize the Poseidon hash function
 * Must be called before using other functions
 */
export async function initPoseidon() {
  if (!poseidonFn) {
    try {
      // Load the circomlibjs library and initialize poseidon
      const poseidon = await circomlibjs.buildPoseidon();
      poseidonFn = poseidon;
      return true;
    } catch (error) {
      console.error("Error initializing Poseidon:", error);
      throw new Error("Failed to initialize cryptographic components");
    }
  }
  return true;
}

/**
 * Generate a random field element for use as a secret or nullifier
 */
function generateRandomFieldElement(): string {
  // Generate a random 31-byte value
  const randomBytes = new Uint8Array(31);
  crypto.getRandomValues(randomBytes);
  
  // Convert to BigInt and ensure it's within the field size
  let randomBigInt = BigInt("0x" + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join(""));
  
  // Return as a decimal string
  return randomBigInt.toString();
}

/**
 * Hash two field elements using Poseidon
 * @param left First field element
 * @param right Second field element
 * @returns Poseidon hash as a decimal string
 */
function poseidonHash(left: string, right: string): string {
  if (!poseidonFn) {
    throw new Error("Poseidon not initialized. Call initPoseidon() first.");
  }
  
  // Convert decimal strings to BigInts
  const leftBigInt = BigInt(left);
  const rightBigInt = BigInt(right);
  
  // Hash the values
  const hash = poseidonFn([leftBigInt, rightBigInt]);
  
  // Convert the result to a decimal string
  return poseidonFn.F.toString(hash);
}

/**
 * Generate a note for depositing
 * @param amount Amount being deposited in MNT
 * @returns Object containing note data and string representation
 */
export async function generateNote(amount: string): Promise<{
  amount: string;
  nullifier: string;
  secret: string;
  commitment: string;
  noteString: string;
}> {
  // Ensure poseidon is initialized
  await initPoseidon();
  
  // Generate random nullifier and secret
  const nullifier = generateRandomFieldElement();
  const secret = generateRandomFieldElement();
  
  // Compute the commitment = poseidon(nullifier, secret)
  const commitment = poseidonHash(nullifier, secret);
  
  // Create the note string format: mantle_<amount>_<nullifier>_<secret>
  const noteString = `mantle_${amount}_${nullifier}_${secret}`;
  
  return {
    amount,
    nullifier,
    secret,
    commitment,
    noteString
  };
}

/**
 * Parse a note string and extract its components
 * @param noteString Note string in the format mantle_<amount>_<nullifier>_<secret>
 * @returns Object with the note data or null if invalid
 */
export function parseNote(noteString: string): {
  amount: string;
  nullifier: string;
  secret: string;
  commitment: string;
  noteString: string;
} | null {
  // Check if poseidon is initialized
  if (!poseidonFn) {
    console.warn("Poseidon not initialized. Some functions may not work correctly.");
  }
  
  // Validate and parse the note string
  const parts = noteString.split('_');
  if (parts.length !== 4 || parts[0] !== 'mantle') {
    return null;
  }
  
  const [_, amount, nullifier, secret] = parts;
  
  // Validate amount is a valid number
  if (isNaN(parseFloat(amount))) {
    return null;
  }
  
  // Validate nullifier and secret are valid field elements
  try {
    BigInt(nullifier);
    BigInt(secret);
  } catch (e) {
    return null;
  }
  
  // Compute the commitment
  let commitment = "";
  if (poseidonFn) {
    commitment = poseidonHash(nullifier, secret);
  } else {
    // If poseidon not initialized, use a placeholder
    // This is not secure and should only be used for UI validation
    commitment = "0";
  }
  
  return {
    amount,
    nullifier,
    secret,
    commitment,
    noteString
  };
}

/**
 * Generate a proof for withdrawal
 * This is a placeholder - in a real implementation, this would use a ZK prover
 * @param amount Amount of the note
 * @param nullifier Nullifier from the note
 * @param secret Secret from the note
 * @param merkleProof Merkle proof of inclusion
 * @returns Simulated proof data
 */
export async function generateProof(
  amount: string,
  nullifier: string,
  secret: string,
  merkleProof: any
): Promise<{
  proof: string;
  publicSignals: {
    root: string;
    nullifierHash: string;
    recipient: string;
    denomination: string;
  };
}> {
  // Ensure poseidon is initialized
  await initPoseidon();
  
  // This is a mock implementation
  // In a real application, this would use a ZK circuit to generate a proof
  
  // Mock nullifier hash (in a real implementation, this would be a hash of the nullifier)
  const nullifierHash = poseidonHash(nullifier, "1");
  
  return {
    proof: "0x00", // Mock proof
    publicSignals: {
      root: "0x00", // Mock root
      nullifierHash,
      recipient: ethers.ZeroAddress,
      denomination: ethers.parseEther(amount).toString()
    }
  };
}

/**
 * Calculate the nullifier hash from a nullifier
 * @param nullifier The nullifier value
 * @returns Nullifier hash as a string
 */
export function calculateNullifierHash(nullifier: string): string {
  if (!poseidonFn) {
    throw new Error("Poseidon not initialized. Call initPoseidon() first.");
  }
  
  return poseidonHash(nullifier, "1");
} 