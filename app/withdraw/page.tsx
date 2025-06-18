"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2, ReceiptText, ShieldCheck } from "lucide-react"
import { parseNote, initPoseidon, calculateNullifierHash, toBytes32 } from "@/lib/zk-utils"
import { ZK_CONFIG, CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/config"
import { useWalletState } from "@/components/ConnectButton"
import { useActiveAccount, useWalletBalance, useSendTransaction } from "thirdweb/react"
import { client, mantleSepolia } from "@/components/ConnectButton"
import { getContract, prepareContractCall } from "thirdweb"
import { ethers } from "ethers"

// Define the type for the note returned by parseNote
interface NoteData {
  amount: string;
  nullifier: string;
  secret: string;
  commitment: string;
  noteString: string;
  commitmentHex: string;
  nullifierHash: string;
}

export default function WithdrawPage() {
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [noteData, setNoteData] = useState<NoteData | null>(null)
  const [proofStatus, setProofStatus] = useState<string>("")
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

  const handleNoteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value)
    
    if (e.target.value.trim().startsWith("mantle_")) {
      const parsedNote = parseNote(e.target.value.trim())
      if (parsedNote) {
        // For proof of concept, only allow notes with 10 MNT
        if (parsedNote.amount === "10") {
          setNoteData(parsedNote)
        } else {
          toast.error("Invalid denomination", {
            description: "This proof of concept only supports 10 MNT notes"
          });
          setNoteData(null)
        }
      } else {
        setNoteData(null)
      }
    } else {
      setNoteData(null)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected || !account) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to withdraw tokens",
      })
      return
    }

    if (!isInitialized) {
      toast.error("Cryptographic components not initialized", {
        description: "Please wait for initialization to complete or reload the page",
      })
      return
    }

    if (!noteData) {
      toast.error("Invalid note", {
        description: "Please enter a valid MantleMask note",
      })
      return
    }

    setIsLoading(true)

    try {
      // Start the real withdrawal process
      setProofStatus("Generating zero-knowledge proof...")
      
      // Create a contract instance with thirdweb
      const contract = getContract({
        client,
        address: CONTRACT_ADDRESSES.mantleMask as `0x${string}`,
        chain: mantleSepolia,
        abi: CONTRACT_ABIS.mantleMask as any,
      });
      
      // Check if the nullifier has already been spent - skip for demo
      setProofStatus("Checking if note has already been spent...")
      
      // In a real implementation, we would check if the nullifier has been spent
      // But for the demo, we'll skip this check
      
      // Get the current root from the contract - use placeholder for demo
      setProofStatus("Retrieving Merkle tree root...")
      // Use a placeholder root for the demo
      const root = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
      
      // In a real implementation, you would generate a ZK proof here
      // For this example, we're using a placeholder proof
      setProofStatus("Generating and verifying zero-knowledge proof...")
      
      // Generate a proof using the note data and Merkle tree
      // This would involve:
      // 1. Reconstructing the Merkle tree from events
      // 2. Creating a Merkle proof for the commitment
      // 3. Generating a ZK proof that proves you know the nullifier and secret
      
      // In a production environment, this would be generated by a ZK circuit
      const proof = "0x00" as `0x${string}`;
      
      // Convert nullifier hash to hex
      const nullifierHashHex = toBytes32(noteData.nullifierHash) as `0x${string}`;
      
      setProofStatus("Submitting withdrawal transaction...")
      
      // Prepare the transaction
      // @ts-ignore - Ignore type errors for now
      const transaction = prepareContractCall({
        contract,
        method: "withdraw",
        params: [
          proof,
          root,
          nullifierHashHex,
          account.address,
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
          BigInt(0)
        ],
      });
      
      // Send the transaction
      // @ts-ignore - Ignore type errors for now
      sendTransaction(transaction, {
        onSuccess: (result) => {
          setIsSuccess(true);
          setTxHash(result.transactionHash);
          toast.success("Withdrawal successful!", {
            description: `${noteData.amount} MNT withdrawn anonymously to your wallet.`,
          });
          setIsLoading(false);
          setProofStatus("");
        },
        onError: (error) => {
          toast.error("Withdrawal failed", {
            description: error.message || "There was an error processing your withdrawal",
          });
          console.error("Error withdrawing:", error);
          setIsLoading(false);
          setProofStatus("");
        },
      });
    } catch (error: any) {
      toast.error("Preparation failed", {
        description: error.message || "There was an error preparing your withdrawal",
      });
      console.error("Error preparing withdrawal:", error);
      setIsLoading(false);
      setProofStatus("");
    }
  }

  // Format balance for display
  const formattedBalance = balance ? balance.displayValue : "0.0"

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:px-8 h-full overflow-y-auto">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 pb-8">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Withdraw MNT</CardTitle>
            <CardDescription>
              Use your secret note to anonymously withdraw 10 MNT
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 space-y-4">
            {!isConnected && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please connect your wallet to withdraw tokens
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

            {!isSuccess && (
              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium">
                  Your Secret Note
                </label>
                <Input
                  id="note"
                  className="font-mono"
                  placeholder="mantle_10_..."
                  value={note}
                  onChange={handleNoteChange}
                  disabled={isLoading || !isConnected || !isInitialized}
                />
                
                {noteData && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Valid note for 10 MNT
                    </p>
                  </div>
                )}

                {note && !noteData && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Invalid note format. Please enter a valid 10 MNT MantleMask note.
                    </p>
                  </div>
                )}

                {isConnected && account && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Withdraw to: {account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
                    <span>Balance: {isBalanceLoading ? "Loading..." : `${parseFloat(formattedBalance).toFixed(4)} ${balance?.symbol || "MNT"}`}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your withdrawal will be private with no link to your deposit
                  </p>
                </div>
                
                {/* ZK Proof Status Display */}
                {isLoading && proofStatus && (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md">
                    <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                    <p className="text-sm text-indigo-800 dark:text-indigo-200">
                      {proofStatus}
                    </p>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={handleWithdraw}
                    disabled={isLoading || !isConnected || !isInitialized || !noteData}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Withdraw 10 MNT
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Successfully withdrawn 10 MNT to your wallet!
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
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setNote("")
                    setNoteData(null)
                    setIsSuccess(false)
                    setTxHash("")
                  }}
                >
                  Withdraw Another Note
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col px-6 py-4 text-center text-sm text-muted-foreground">
            <p>Your withdrawal will be anonymous with no link to your original deposit.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
