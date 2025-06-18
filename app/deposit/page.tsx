"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Copy, CheckCircle2, AlertCircle, ShieldCheck, Lock } from "lucide-react"
import { initPoseidon, generateNote } from "@/lib/zk-utils"
import { ZK_CONFIG, CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/config"
import { useWalletState } from "@/components/ConnectButton"
import { useActiveAccount, useWalletBalance, useSendTransaction } from "thirdweb/react"
import { client, mantleSepolia } from "@/components/ConnectButton"
import { getContract, prepareContractCall } from "thirdweb"
import { ethers } from "ethers"

// Define the type for the note returned by generateNote
interface NoteData {
  amount: string;
  nullifier: string;
  secret: string;
  commitment: string;
  noteString: string;
  commitmentHex: string;
}

// All available denominations (for UI display)
const ALL_DENOMINATIONS = ["10", "100", "500", "1000"];

export default function DepositPage() {
  // Fixed amount to 10 MNT for proof of concept
  const [amount, setAmount] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [secretNote, setSecretNote] = useState("")
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState(false)
  const { isConnected } = useWalletState()
  
  // Get account and balance using thirdweb hooks
  const account = useActiveAccount()
  const { data: balance, isLoading: isBalanceLoading } = useWalletBalance({
    client,
    chain: mantleSepolia,
    address: account?.address,
  })

  // Use thirdweb's transaction hook
  const { mutate: sendTransaction } = useSendTransaction()
  
  // Initialize Poseidon when component mounts
  useEffect(() => {
    const init = async () => {
      try {
        await initPoseidon();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize cryptographic components:", error);
        toast.error("Failed to initialize cryptographic components", {
          description: "Please reload the page and try again",
        });
      }
    };
    
    init();
  }, []);
  
  const handleDeposit = async () => {
    if (!isConnected || !account) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to deposit tokens",
      })
      return
    }

    if (!isInitialized) {
      toast.error("Cryptographic components not initialized", {
        description: "Please wait for initialization to complete or reload the page",
      })
      return
    }

    // Check if the user has enough balance
    if (balance && parseFloat(balance.displayValue) < parseFloat(amount)) {
      toast.error("Insufficient balance", {
        description: `You need at least ${amount} MNT to make this deposit`,
      })
      return
    }

    setIsLoading(true)

    try {
      // Generate a note with nullifier and secret
      const note = await generateNote(amount) as NoteData;
      
      // Create a contract instance with thirdweb
      const contract = getContract({
        client,
        address: CONTRACT_ADDRESSES.mantleMask as `0x${string}`,
        chain: mantleSepolia,
        // @ts-ignore - Ignore type errors for now
        abi: CONTRACT_ABIS.mantleMask,
      });
      
      // Prepare the transaction using the commitmentHex from the note
      // @ts-ignore - Ignore type errors for now
      const transaction = prepareContractCall({
        contract,
        method: "deposit",
        params: [note.commitmentHex as `0x${string}`],
        value: BigInt(ethers.parseEther(amount).toString()),
      });
      
      // Send the transaction
      // @ts-ignore - Ignore type errors for now
      sendTransaction(transaction, {
        onSuccess: (result) => {
          setSecretNote(note.noteString);
          setTxHash(result.transactionHash);
          toast.success("Deposit successful!", {
            description: `${amount} MNT deposited anonymously. Save your note to withdraw later!`,
          });
          setIsLoading(false);
        },
        onError: (error) => {
          toast.error("Deposit failed", {
            description: error.message || "There was an error processing your deposit",
          });
          console.error("Error depositing:", error);
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      toast.error("Preparation failed", {
        description: error.message || "There was an error preparing your deposit",
      });
      console.error("Error preparing deposit:", error);
      setIsLoading(false);
    }
  }

  const copyNote = () => {
    navigator.clipboard.writeText(secretNote)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    toast.success("Note copied to clipboard", {
      description: "Store this note securely to withdraw your funds later",
    })
  }

  // Format balance for display
  const formattedBalance = balance ? balance.displayValue : "0.0"

  // Check if a denomination is enabled (only 10 MNT for now)
  const isDenominationEnabled = (denom: string) => denom === "10";

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:px-8 h-full">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Deposit MNT</CardTitle>
            <CardDescription>
              Deposit MNT anonymously and receive a secret note for withdrawal
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 space-y-4">
            {!isConnected && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please connect your wallet to deposit MNT
                </p>
              </div>
            )}

            {!isInitialized && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Initializing cryptographic components...
                </p>
              </div>
            )}

            {isConnected && isInitialized && !secretNote && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    Amount to Deposit
                  </label>
                  <span className="text-sm text-muted-foreground">
                    Balance: {isBalanceLoading ? "Loading..." : `${parseFloat(formattedBalance).toFixed(4)} ${balance?.symbol || "MNT"}`}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="default"
                    onClick={() => setAmount("10")}
                    disabled={isLoading || (balance && parseFloat(balance.displayValue) < 10)}
                    className="h-14"
                  >
                    10 MNT
                  </Button>
                  
                  <Button
                    variant="outline"
                    disabled={true}
                    className="h-14 relative"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>100 MNT</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    disabled={true}
                    className="h-14 relative"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>500 MNT</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    disabled={true}
                    className="h-14 relative"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>1000 MNT</span>
                    </div>
                  </Button>
                </div>

                {balance && parseFloat(balance.displayValue) < parseFloat(amount) && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Insufficient balance for selected amount
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    className="w-full" 
                    onClick={handleDeposit}
                    disabled={isLoading || !isConnected || !isInitialized || (balance && parseFloat(balance.displayValue) < parseFloat(amount))}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Depositing...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Deposit {amount} MNT
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {secretNote && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    Your Secret Note
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyNote}
                    disabled={copied}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <div className="font-mono text-xs p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md break-all">
                  {secretNote}
                </div>
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Save this note securely! It cannot be recovered if lost.
                  </p>
                </div>
                
                {txHash && (
                  <div className="mt-2 text-center">
                    <a 
                      href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View transaction on block explorer
                    </a>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSecretNote("")
                      setTxHash("")
                    }}
                  >
                    Make Another Deposit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col px-6 py-4 text-center text-sm text-muted-foreground">
            <p>Your deposit will be completely private. The note is your key to withdrawal.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
