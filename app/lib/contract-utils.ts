/**
 * Contract utility functions for MantleMask
 * Handles interaction with the smart contracts
 */

import { ethers } from "ethers";
import { generateNote, parseNote } from "./zk-utils";
import { CONTRACT_ADDRESSES } from "../../lib/config";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

// Contract ABIs (hardcoded for production use)
const MANTLEMASK_ABI = [
  "function deposit(bytes32 commitment) external payable",
  "function withdraw(bytes calldata proof, bytes32 root, bytes32 nullifierHash, address recipient, address relayer, uint256 fee, uint256 denomination) external",
  "function getLastRoot() external view returns (bytes32)",
  "function isKnownRoot(bytes32 root) external view returns (bool)",
  "function isSpent(bytes32 nullifierHash) external view returns (bool)",
  "function getAllowedDenominations() external view returns (uint256[])",
  "function isDenominationAllowed(uint256 denomination) external view returns (bool)",
  "event Deposit(bytes32 indexed commitment, uint256 denomination, uint256 leafIndex, uint256 timestamp)",
  "event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee, uint256 denomination)"
];

/**
 * Get a provider from Dynamic's connected wallet
 */
export function getProvider(dynamicContext: ReturnType<typeof useDynamicContext>) {
  if (!dynamicContext.primaryWallet) {
    throw new Error("No wallet connected. Please connect your wallet using Dynamic.");
  }
  
  try {
    // Use window.ethereum as the provider source
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    } else {
      // Fallback for when window.ethereum is not available
      throw new Error("No Ethereum provider found. Please ensure your wallet is properly connected.");
    }
  } catch (error) {
    console.error("Error creating provider:", error);
    throw new Error("Failed to connect to wallet provider");
  }
}

/**
 * Get a signer from the provider
 */
export async function getSigner(dynamicContext: ReturnType<typeof useDynamicContext>) {
  const provider = getProvider(dynamicContext);
  return provider.getSigner();
}

/**
 * Get the MantleMask contract instance with the connected wallet
 */
export async function getMantleMaskContract(dynamicContext: ReturnType<typeof useDynamicContext>) {
  const signer = await getSigner(dynamicContext);
  return new ethers.Contract(CONTRACT_ADDRESSES.mantleMask, MANTLEMASK_ABI, signer);
}

/**
 * Get available denominations from the contract
 */
export async function getAllowedDenominations(dynamicContext: ReturnType<typeof useDynamicContext>) {
  const mantleMaskContract = await getMantleMaskContract(dynamicContext);
  const denominations = await mantleMaskContract.getAllowedDenominations();
  return denominations.map((d: bigint) => ethers.formatEther(d));
}

/**
 * Make a deposit to the MantleMask contract
 * @param dynamicContext The Dynamic context from useDynamicContext()
 * @param amount Amount to deposit in MNT
 * @returns The generated note and transaction hash
 */
export async function makeDeposit(dynamicContext: ReturnType<typeof useDynamicContext>, amount: string) {
  // Generate a note with nullifier and secret
  const note = await generateNote(amount);
  
  // Convert the commitment to bytes32 format
  const commitmentHex = BigInt(note.commitment).toString(16).padStart(64, '0');
  const commitmentBytes32 = `0x${commitmentHex}`;
  
  // Convert amount to wei (with 18 decimals)
  const amountInWei = ethers.parseEther(amount);
  
  // Make the deposit with native MNT
  const mantleMaskContract = await getMantleMaskContract(dynamicContext);
  const tx = await mantleMaskContract.deposit(commitmentBytes32, { value: amountInWei });
  await tx.wait();
  
  return {
    note: note.noteString,
    txHash: tx.hash
  };
}

/**
 * Withdraw MNT from MantleMask
 * @param dynamicContext The Dynamic context from useDynamicContext()
 * @param noteString The note string from the deposit
 * @param recipient Address to receive the MNT
 * @returns Transaction hash
 */
export async function makeWithdrawal(dynamicContext: ReturnType<typeof useDynamicContext>, noteString: string, recipient: string) {
  // Parse the note
  const note = parseNote(noteString);
  if (!note) {
    throw new Error("Invalid note format");
  }
  
  // In a real implementation, you would:
  // 1. Get the Merkle proof for the commitment
  // 2. Generate a ZK proof
  // Here we're using placeholder values for demonstration
  
  const mantleMaskContract = await getMantleMaskContract(dynamicContext);
  
  // Get the current root
  const root = await mantleMaskContract.getLastRoot();
  
  // Convert nullifier to bytes32
  const nullifierHex = BigInt(note.nullifier).toString(16).padStart(64, '0');
  const nullifierBytes32 = `0x${nullifierHex}`;
  
  // Check if the note has already been spent
  const isSpent = await mantleMaskContract.isSpent(nullifierBytes32);
  if (isSpent) {
    throw new Error("This note has already been spent");
  }
  
  // In a real implementation, you would generate a ZK proof here
  // For this example, we're using an empty proof (which won't work in production)
  const proof = "0x00";
  
  // Convert denomination to wei
  const denominationInWei = ethers.parseEther(note.amount);
  
  // Make the withdrawal with no relayer fee
  const tx = await mantleMaskContract.withdraw(
    proof,
    root,
    nullifierBytes32,
    recipient,
    ethers.ZeroAddress,
    0,
    denominationInWei
  );
  
  await tx.wait();
  return tx.hash;
}

/**
 * Get native MNT balance for an address
 * @param dynamicContext The Dynamic context from useDynamicContext()
 * @param address Address to check balance for
 * @returns Balance as a formatted string
 */
export async function getNativeBalance(dynamicContext: ReturnType<typeof useDynamicContext>, address: string) {
  if (!address) {
    return "0.0";
  }
  
  try {
    const provider = getProvider(dynamicContext);
    const balance = await provider.getBalance(address);
    
    // Format the balance
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting native balance:", error);
    return "0.0";
  }
}

/**
 * Set contract address (call this after deployment)
 * @param mantleMaskAddress Address of the MantleMask contract
 */
export function setContractAddress(mantleMaskAddress: string) {
  CONTRACT_ADDRESSES.mantleMask = mantleMaskAddress;
} 