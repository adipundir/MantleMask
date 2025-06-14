"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Copy, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { initPoseidon, generateNote } from "@/lib/zk-utils"
import { ZK_CONFIG, CONTRACT_ADDRESSES } from "@/lib/config"
import { useWalletState } from "@/components/ConnectButton"
import { useActiveAccount, useWalletBalance, useSendTransaction } from "thirdweb/react"
import { client, mantleSepolia } from "@/components/ConnectButton"
import { getContract, prepareContractCall } from "thirdweb"
import { ethers } from "ethers"

// Contract ABI for the deposit function
const MANTLEMASK_ABI = ["function deposit(bytes32 commitment) external payable"]

export default function DepositPage() {
  const [amount, setAmount] = useState(ZK_CONFIG.allowedDenominations[0])
  const [isLoading, setIsLoading] = useState(false)
  const [secretNote, setSecretNote] = useState("")
  const [copied, setCopied] = useState(false)
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
      } catch (error) {
        console.error("Failed to initialize cryptographic components:", error);
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

    setIsLoading(true)

    try {
      // Generate a note with nullifier and secret
      const note = await generateNote(amount);
      
      // DEMO: Simulate transaction processing with a delay
      setTimeout(() => {
        setSecretNote(note.noteString);
        toast.success("Deposit successful! (Demo Mode)", {
          description: `${amount} MNT deposited. Save your note to withdraw later!`,
        });
        setIsLoading(false);
      }, 2000);
      
      // COMMENTED OUT: Actual contract interaction code
      /*
      // Convert the commitment to bytes32 format
      const commitmentHex = BigInt(note.commitment).toString(16).padStart(64, '0');
      const commitmentBytes32 = `0x${commitmentHex}`;
      
      // Create a contract instance with thirdweb
      const contract = getContract({
        client,
        address: CONTRACT_ADDRESSES.mantleMask,
        chain: mantleSepolia,
      });
      
      // Prepare the transaction
      const transaction = prepareContractCall({
        contract,
        method: "function deposit(bytes32 commitment) external payable",
        params: [commitmentBytes32 as `0x${string}`],
        value: BigInt(ethers.parseEther(amount).toString()),
      });
      
      // Send the transaction
      sendTransaction(transaction, {
        onSuccess: (result) => {
          setSecretNote(note.noteString);
          toast.success("Deposit successful!", {
            description: `${amount} MNT deposited. Save your note to withdraw later!`,
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
      */
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

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:px-8 h-full overflow-y-auto">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 pb-8">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Deposit MNT</CardTitle>
            <CardDescription>
              Deposit MNT anonymously and receive a secret note for withdrawal
            </CardDescription>
        </CardHeader>
          
          <CardContent className="px-6 space-y-4">
            {/* Demo Mode Banner */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                DEMO MODE: No actual blockchain transactions will occur
              </p>
            </div>
            
            {!isConnected && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please connect your wallet to deposit MNT
              </p>
            </div>
          )}

            {isConnected && (
          <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    Amount to Deposit
            </label>
                  <span className="text-sm text-muted-foreground">
                    Balance: {isBalanceLoading ? "Loading..." : `${parseFloat(formattedBalance).toFixed(4)} ${balance?.symbol || "MNT"}`}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ZK_CONFIG.allowedDenominations.map((denomination) => (
                    <Button
                      key={denomination}
                      variant={amount === denomination ? "default" : "outline"}
                      onClick={() => setAmount(denomination)}
                      disabled={isLoading || !!secretNote}
                      className="h-12"
                    >
                      {denomination} MNT
                    </Button>
                  ))}
          </div>
              </div>
            )}

            {secretNote ? (
              <div className="space-y-2">
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
            </div>
            ) : (
              <div className="pt-4">
                <Button
                  className="w-full" 
                  onClick={handleDeposit}
                  disabled={isLoading || !isConnected}
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
            )}
            
            {secretNote && (
              <div className="pt-4">
            <Button
                  variant="outline" 
              className="w-full"
              onClick={() => {
                setSecretNote("")
                    setAmount(ZK_CONFIG.allowedDenominations[0])
              }}
            >
              Make Another Deposit
            </Button>
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
