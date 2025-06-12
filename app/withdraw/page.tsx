"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { Loader2, AlertCircle, CheckCircle2, ReceiptText } from "lucide-react"
import { parseNote, initPoseidon } from "@/lib/zk-utils"
import { makeWithdrawal, getNativeBalance } from "@/lib/contract-utils"

export default function WithdrawPage() {
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [noteData, setNoteData] = useState<any>(null)
  const [balance, setBalance] = useState("0.0")
  const dynamicContext = useDynamicContext()
  const isLoggedIn = useIsLoggedIn()
  
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
  
  // Get native MNT balance when wallet changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (dynamicContext.primaryWallet?.address) {
        try {
          const userBalance = await getNativeBalance(dynamicContext, dynamicContext.primaryWallet.address);
          setBalance(userBalance);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance("0.0");
        }
      }
    };
    
    if (isLoggedIn) {
      fetchBalance();
    }
  }, [dynamicContext.primaryWallet?.address, isLoggedIn, dynamicContext]);

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
    if (!isLoggedIn || !dynamicContext.primaryWallet?.address) {
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
      // Ensure we're on the Mantle network
      try {
        // Removed switchToMantleNetwork call as it's not defined
        // await switchToMantleNetwork(dynamicContext);
      } catch (networkError: any) {
        toast.error("Network Error", {
          description: networkError.message || "Failed to switch to Mantle network",
        });
        setIsLoading(false);
        return;
      }
      
      // Make the withdrawal using contract-utils
      const txHash = await makeWithdrawal(
        dynamicContext,
        noteData.noteString,
        dynamicContext.primaryWallet.address
      );

      setIsSuccess(true)
      toast.success("Withdrawal successful!", {
        description: `${noteData.amount} MNT withdrawn to your wallet.`,
      })
      
      // Update balance after successful withdrawal
      const newBalance = await getNativeBalance(dynamicContext, dynamicContext.primaryWallet.address);
      setBalance(newBalance);
    } catch (error: any) {
      toast.error("Withdrawal failed", {
        description: error.message || "There was an error processing your withdrawal",
      })
      console.error("Error withdrawing:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Withdraw MNT</CardTitle>
            <CardDescription>
              Use your secret note to anonymously withdraw your MNT
            </CardDescription>
        </CardHeader>
          
          <CardContent className="px-6 space-y-4">
            {!isLoggedIn && (
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
                  disabled={isLoading || !isLoggedIn}
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

                {isLoggedIn && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Withdraw to: {dynamicContext.primaryWallet?.address?.slice(0, 6)}...{dynamicContext.primaryWallet?.address?.slice(-4)}</span>
                    <span>Balance: {parseFloat(balance).toFixed(4)} MNT</span>
            </div>
          )}
                
                <div className="pt-4">
            <Button
              className="w-full"
              onClick={handleWithdraw}
                    disabled={isLoading || !isLoggedIn || !noteData}
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
