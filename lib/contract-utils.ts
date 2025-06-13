/**
 * Contract utility functions for MantleMask
 * Handles interaction with the smart contracts
 */

import { ethers } from "ethers";
import { generateNote, parseNote } from "./zk-utils";
import { CONTRACT_ADDRESSES } from "./config";
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
 * Get a provider from the browser's ethereum object
 */
export function getProvider(dynamicContext: ReturnType<typeof useDynamicContext>) {
  if (!dynamicContext.primaryWallet) {
    throw new Error("No wallet connected. Please connect your wallet using Dynamic.");
  }
  
  try {
    // Use window.ethereum directly as it should be injected by the wallet
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    } else {
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
  
  // Check if we're on the correct network (Mantle)
  const network = await signer.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // Mantle Mainnet chainId is 5000, Mantle Testnet chainId is 5001
  if (chainId !== 5000 && chainId !== 5001) {
    throw new Error("Please connect to Mantle network to use MantleMask");
  }
  
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
 * @param account The thirdweb account
 * @param amount Amount to deposit in MNT
 * @returns The generated note and transaction hash
 */
export async function makeDeposit(account: any, amount: string) {
  if (!account) {
    throw new Error("No wallet connected");
  }

  // Generate a note with nullifier and secret
  const note = await generateNote(amount);
  
  // Convert the commitment to bytes32 format
  const commitmentHex = BigInt(note.commitment).toString(16).padStart(64, '0');
  const commitmentBytes32 = `0x${commitmentHex}`;
  
  try {
    // Create the transaction data for the deposit function
    const iface = new ethers.Interface(MANTLEMASK_ABI);
    const data = iface.encodeFunctionData("deposit", [commitmentBytes32]);
    
    // Convert amount to wei (with 18 decimals)
    const amountInWei = ethers.parseEther(amount);
    
    // Get the wallet client from the account
    const walletClient = await account.getWalletClient();
    
    // Send the transaction using the thirdweb wallet
    const hash = await walletClient.sendTransaction({
      to: CONTRACT_ADDRESSES.mantleMask,
      value: BigInt(amountInWei.toString()),
      data: data,
    });
    
    return {
      note: note.noteString,
      txHash: hash
    };
  } catch (error) {
    console.error("Error making deposit:", error);
    throw error;
  }
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
  console.log('getNativeBalance called with address:', address);
  
  if (!address) {
    console.log('No address provided, returning 0.0');
    return "0.0";
  }
  
  try {
    console.log('Getting provider...');
    const provider = getProvider(dynamicContext);
    
    console.log('Fetching balance for address:', address);
    const balance = await provider.getBalance(address);
    console.log('Raw balance:', balance.toString());
    
    // Format the balance
    const formattedBalance = ethers.formatEther(balance);
    console.log('Formatted balance:', formattedBalance);
    
    return formattedBalance;
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

/**
 * Switch to Mantle network if not already connected
 * @param dynamicContext The Dynamic context from useDynamicContext()
 * @param testnet Whether to use testnet or mainnet
 */
export async function switchToMantleNetwork(dynamicContext: ReturnType<typeof useDynamicContext>, testnet = false) {
  if (!dynamicContext.primaryWallet) {
    throw new Error("No wallet connected. Please connect your wallet using Dynamic.");
  }
  
  if (!window.ethereum) {
    throw new Error("No Ethereum provider found. Please ensure your wallet is properly connected.");
  }
  
  try {
    const provider = getProvider(dynamicContext);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    // Check if already on Mantle
    const targetChainId = testnet ? 5001 : 5000;
    if (chainId === targetChainId) {
      return; // Already on the right network
    }
    
    // Request network switch
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      const testnet = Number(switchError.data?.originalError?.code) === 5001;
      
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found. Please ensure your wallet is properly connected.");
      }
      
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: testnet ? '0x1389' : '0x1388', // 5001 or 5000
              chainName: testnet ? 'Mantle Testnet' : 'Mantle',
              nativeCurrency: {
                name: 'MNT',
                symbol: 'MNT',
                decimals: 18
              },
              rpcUrls: [testnet ? 'https://rpc.testnet.mantle.xyz' : 'https://rpc.mantle.xyz'],
              blockExplorerUrls: [testnet ? 'https://explorer.testnet.mantle.xyz' : 'https://explorer.mantle.xyz']
            },
          ],
        });
      } catch (addError) {
        console.error("Error adding Mantle network:", addError);
        throw new Error("Could not add Mantle network to your wallet");
      }
    } else {
      console.error("Error switching to Mantle network:", switchError);
      throw new Error("Failed to switch to Mantle network");
    }
  }
} 