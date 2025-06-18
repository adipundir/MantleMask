"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Copy, CheckCircle2, AlertCircle, ShieldCheck, Lock, ArrowRight } from "lucide-react"
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

// Deposit flow states
type DepositState = "select" | "preview" | "processing" | "complete" | "generating";

export default function DepositPage() {
  // Fixed amount to 10 MNT for proof of concept
  const [amount, setAmount] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [secretNote, setSecretNote] = useState("")
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState(false)
  const { isConnected } = useWalletState()
  const [depositState, setDepositState] = useState<DepositState>("select")
  const [generatedNote, setGeneratedNote] = useState<NoteData | null>(null)
  const [noteSaved, setNoteSaved] = useState(false)
  
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
  
  const handleGenerateNote = async () => {
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
    
    // Create a dedicated generating state with visual feedback
    setDepositState("generating")

    try {
      // Add artificial delay for better UX (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a note with nullifier and secret
      const note = await generateNote(amount) as NoteData;
      setGeneratedNote(note);
      setSecretNote(note.noteString);
      setDepositState("preview");
      setIsLoading(false);
    } catch (error: any) {
      toast.error("Note generation failed", {
        description: error.message || "There was an error generating your deposit note",
      });
      console.error("Error generating note:", error);
      setIsLoading(false);
      setDepositState("select");
    }
  }
  
  const handleConfirmDeposit = async () => {
    if (!generatedNote) {
      toast.error("No note generated", {
        description: "Please generate a note first",
      })
      return
    }
    
    setIsLoading(true);
    setDepositState("processing");
    
    try {
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
        params: [generatedNote.commitmentHex as `0x${string}`],
        value: BigInt(ethers.parseEther(amount).toString()),
      });
      
      // Send the transaction
      // @ts-ignore - Ignore type errors for now
      sendTransaction(transaction, {
        onSuccess: (result) => {
          setTxHash(result.transactionHash);
          setDepositState("complete");
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
          setDepositState("preview"); // Go back to preview state
        },
      });
    } catch (error: any) {
      toast.error("Preparation failed", {
        description: error.message || "There was an error preparing your deposit",
      });
      console.error("Error preparing deposit:", error);
      setIsLoading(false);
      setDepositState("preview"); // Go back to preview state
    }
  }

  const copyNote = () => {
    navigator.clipboard.writeText(secretNote)
    setCopied(true)
    setNoteSaved(true)
    setTimeout(() => setCopied(false), 2000)
    
    toast.success("Note copied to clipboard", {
      description: "Store this note securely to withdraw your funds later",
    })
  }

  const resetFlow = () => {
    setSecretNote("")
    setTxHash("")
    setGeneratedNote(null)
    setDepositState("select")
    setNoteSaved(false)
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

            {isConnected && isInitialized && depositState === "select" && (
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
                    onClick={handleGenerateNote}
                    disabled={isLoading || !isConnected || !isInitialized || (balance && parseFloat(balance.displayValue) < parseFloat(amount))}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating note...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Generate Deposit Note
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {depositState === "generating" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <ShieldCheck className="h-6 w-6 text-primary absolute inset-0 m-auto" />
                  </div>
                  <h3 className="text-lg font-medium mt-4">Generating Your Secret Note</h3>
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
                    Creating a secure cryptographic note for your {amount} MNT deposit...
                  </p>
                  <div className="w-full max-w-xs mt-4">
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {depositState === "preview" && secretNote && (
              <div className="space-y-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</h3>
                      <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        <p>Save this note <strong>before</strong> proceeding with the deposit. You will need it to withdraw your funds.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
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
                
                <div className="pt-2 space-y-2">
                  <Button
                    className="w-full" 
                    onClick={handleConfirmDeposit}
                    disabled={isLoading || !noteSaved}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        {noteSaved ? "Confirm Deposit" : "Copy Note to Continue"}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resetFlow}
                    disabled={isLoading}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {depositState === "processing" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <h3 className="text-lg font-medium">Processing Deposit</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please wait while your transaction is being processed...
                  </p>
                </div>
              </div>
            )}

            {depositState === "complete" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Deposit Successful!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {amount} MNT has been deposited anonymously.
                    </p>
                  </div>
                </div>
                
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
                    onClick={resetFlow}
                  >
                    Make Another Deposit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

        </Card>
      </div>
    </div>
  )
}
