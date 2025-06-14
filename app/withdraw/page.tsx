"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2, ReceiptText, ShieldCheck } from "lucide-react"
import { parseNote, initPoseidon } from "@/lib/zk-utils"
import { ZK_CONFIG, CONTRACT_ADDRESSES } from "@/lib/config"
import { useWalletState } from "@/components/ConnectButton"
import { useActiveAccount, useWalletBalance, useSendTransaction } from "thirdweb/react"
import { client, mantleSepolia } from "@/components/ConnectButton"
import { getContract, prepareContractCall } from "thirdweb"
import { ethers } from "ethers"

// Contract ABI for the withdraw function
const MANTLEMASK_ABI = [
  "function withdraw(bytes calldata proof, bytes32 root, bytes32 nullifierHash, address recipient, address relayer, uint256 fee, uint256 denomination) external",
  "function getLastRoot() external view returns (bytes32)",
  "function isSpent(bytes32 nullifierHash) external view returns (bool)"
]

export default function WithdrawPage() {
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [noteData, setNoteData] = useState<any>(null)
  const [proofStatus, setProofStatus] = useState<string>("")
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

  const handleNoteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value)
    
    if (e.target.value.trim().startsWith("mantle_")) {
      const parsedNote = parseNote(e.target.value.trim())
      if (parsedNote) {
        setNoteData(parsedNote)
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

    if (!noteData) {
      toast.error("Invalid note", {
        description: "Please enter a valid MantleMask note",
      })
      return
    }

    setIsLoading(true)

    try {
      // DEMO: Simulate the ZK proof generation and verification process
      setProofStatus("Generating zero-knowledge proof...")
      
      // Simulate proof generation delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      setProofStatus("Verifying Merkle proof...")
      
      // Simulate Merkle verification delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      setProofStatus("Checking nullifier hasn't been spent...")
      
      // Simulate nullifier check delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      setProofStatus("Processing withdrawal...")
      
      // Simulate final processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Complete the withdrawal simulation
      setIsSuccess(true)
      toast.success("Withdrawal successful! (Demo Mode)", {
        description: `${noteData.amount} MNT withdrawn to your wallet.`,
      })
      setIsLoading(false)
      setProofStatus("")
      
      // COMMENTED OUT: Actual contract interaction code
      /*
      // Convert nullifier to bytes32
      const nullifierHex = BigInt(noteData.nullifier).toString(16).padStart(64, '0');
      const nullifierBytes32 = `0x${nullifierHex}` as `0x${string}`;
      
      // In a real implementation, you would generate a ZK proof here
      // For this example, we're using an empty proof and root (which won't work in production)
      const proof = "0x00" as `0x${string}`;
      const root = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
      
      // Convert denomination to wei
      const denominationInWei = BigInt(ethers.parseEther(noteData.amount).toString());
      
      // Create a contract instance with thirdweb
      const contract = getContract({
        client,
        address: CONTRACT_ADDRESSES.mantleMask,
        chain: mantleSepolia,
      });
      
      // Prepare the transaction
      const transaction = prepareContractCall({
        contract,
        method: "function withdraw(bytes calldata proof, bytes32 root, bytes32 nullifierHash, address recipient, address relayer, uint256 fee, uint256 denomination) external",
        params: [
          proof,
          root,
          nullifierBytes32,
          account.address,
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
          BigInt(0),
          denominationInWei
        ],
      });
      
      // Send the transaction
      sendTransaction(transaction, {
        onSuccess: (result) => {
          setIsSuccess(true);
          toast.success("Withdrawal successful!", {
            description: `${noteData.amount} MNT withdrawn to your wallet.`,
          });
          setIsLoading(false);
        },
        onError: (error) => {
          toast.error("Withdrawal failed", {
            description: error.message || "There was an error processing your withdrawal",
          });
          console.error("Error withdrawing:", error);
          setIsLoading(false);
        },
      });
      */
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
              Use your secret note to anonymously withdraw your MNT
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
                  Please connect your wallet to withdraw tokens
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
                  placeholder="mantle_100_..."
                  value={note}
                  onChange={handleNoteChange}
                  disabled={isLoading || !isConnected}
            />
                
                {noteData && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Valid note for {noteData.amount} MNT
                    </p>
          </div>
                )}

                {note && !noteData && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Invalid note format. Please enter a valid MantleMask note.
                    </p>
            </div>
          )}

                {isConnected && account && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Withdraw to: {account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
                    <span>Balance: {isBalanceLoading ? "Loading..." : `${parseFloat(formattedBalance).toFixed(4)} ${balance?.symbol || "MNT"}`}</span>
            </div>
          )}
                
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
                    disabled={isLoading || !isConnected || !noteData}
            >
                    {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Withdrawing...
                </>
              ) : (
                      <>
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Withdraw {noteData?.amount || 0} MNT
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
                    Successfully withdrawn {noteData.amount} MNT to your wallet!
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setNote("")
                    setNoteData(null)
                    setIsSuccess(false)
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
