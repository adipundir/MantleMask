"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { toast } from "sonner"
import { Loader2, Copy, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { initPoseidon } from "@/lib/zk-utils"
import { makeDeposit, getNativeBalance, getAllowedDenominations } from "@/lib/contract-utils"
import { ZK_CONFIG } from "@/lib/config"

export default function DepositPage() {
  const [amount, setAmount] = useState(ZK_CONFIG.allowedDenominations[0])
  const [isLoading, setIsLoading] = useState(false)
  const [secretNote, setSecretNote] = useState("")
  const [copied, setCopied] = useState(false)
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
  
  const getBalances = async () => {
    if (dynamicContext.primaryWallet?.address) {
      try {
        const balance = await getNativeBalance(dynamicContext, dynamicContext.primaryWallet.address);
        setBalance(balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0.0");
      }
    }
  }
  
  useEffect(() => {
    console.log("Useeffect running")
    if (dynamicContext.primaryWallet?.address) {
      getBalances();
    }
  }, [dynamicContext])

  const handleDeposit = async () => {
    if (!isLoggedIn || !dynamicContext.primaryWallet?.address) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to deposit tokens",
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
      
      // Make the deposit using contract-utils
      const result = await makeDeposit(dynamicContext, amount);
      
      setSecretNote(result.note)
      
      toast.success("Deposit successful!", {
        description: `${amount} MNT deposited. Save your note to withdraw later!`,
      })
      
      // Update balance after successful deposit
      const newBalance = await getNativeBalance(dynamicContext, dynamicContext.primaryWallet.address);
      setBalance(newBalance);
    } catch (error: any) {
      toast.error("Deposit failed", {
        description: error.message || "There was an error processing your deposit",
      })
      console.error("Error depositing:", error)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Deposit MNT</CardTitle>
            <CardDescription>
              Deposit MNT anonymously and receive a secret note for withdrawal
            </CardDescription>
        </CardHeader>
          
          <CardContent className="px-6 space-y-4">
            {!isLoggedIn && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please connect your wallet to deposit MNT
              </p>
            </div>
          )}

            {isLoggedIn && (
          <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    Amount to Deposit
            </label>
                  <span className="text-sm text-muted-foreground">
                    Balance: {parseFloat(balance).toFixed(4)} MNT
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ZK_CONFIG.allowedDenominations.map((denomination) => (
                    <Button
                      key={denomination}
                      variant={amount === denomination ? "default" : "outline"}
                      onClick={() => setAmount(denomination)}
                      disabled={isLoading || !!secretNote || Number(denomination) > Number(balance)}
                      className="h-12"
                    >
                      {denomination} MNT
                    </Button>
                  ))}
          </div>

                {Number(amount) > Number(balance) && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Insufficient balance
                    </p>
                  </div>
                )}
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
                  disabled={isLoading || !isLoggedIn || Number(amount) > Number(balance)}
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
