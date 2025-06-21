"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Copy, CheckCircle2, AlertCircle, ShieldCheck, Lock, ArrowRight } from "lucide-react"
import { initPoseidon, generateNote } from "@/lib/zk-utils"
import { ZK_CONFIG } from "@/lib/config"
import { MANTLEMASK_ABI } from "@/lib/abi"
import { useWalletState } from "@/components/ConnectButton"
import { useActiveAccount, useWalletBalance, useSendTransaction } from "thirdweb/react"
import { client, mantleSepolia } from "@/components/ConnectButton"
import { getContract, prepareContractCall, readContract } from "thirdweb"
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
  // Fixed amount to 10 MNT for initial release
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
    setDepositState("generating")

    try {
      // Generate a secure note for the privacy mixer
      toast.info("Generating secure note...", {
        description: "Creating cryptographic commitment for your deposit",
      });
      
      // Add artificial delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a note with nullifier and secret
      const note = await generateNote(amount) as NoteData;
      setGeneratedNote(note);
      setSecretNote(note.noteString);
      setDepositState("preview");
      setIsLoading(false);
      
      toast.success("Note generated successfully!", {
        description: "Your secure note is ready for deposit",
      });
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
    
    if (!account) {
      toast.error("No account connected", {
        description: "Please connect your wallet first",
      })
      return
    }
    
    setIsLoading(true);
    setDepositState("processing");
    
    try {
      console.log("=== STARTING DEPOSIT PROCESS ===");
      console.log("Account:", account.address);
      console.log("Generated note:", generatedNote);
      
      toast.info("Submitting deposit...", {
        description: "Creating anonymous deposit on Mantle Network",
      });
      
      // Check if contract address is properly configured
      const contractAddress = process.env.NEXT_PUBLIC_MANTLEMASK_ADDRESS;
      console.log("Raw contract address from env:", contractAddress);
      
      if (!contractAddress || contractAddress === "your_deployed_contract_address_here") {
        throw new Error("Contract address not configured. Please set NEXT_PUBLIC_MANTLEMASK_ADDRESS in your .env file.");
      }
      
      console.log("Contract address:", contractAddress);
      console.log("Chain ID:", mantleSepolia.id);
      
      // Use the note hash as the commitment for privacy
      // This allows secure deposit and withdrawal operations
      const noteHash = ethers.keccak256(ethers.toUtf8Bytes(generatedNote.noteString));
      console.log("Note hash:", noteHash);
      console.log("Deposit amount:", amount, "ETH");
      console.log("Amount in wei:", ethers.parseEther(amount).toString());
      
      // Create a contract instance with thirdweb
      const contract = getContract({
        client,
        address: contractAddress as `0x${string}`,
        chain: mantleSepolia,
        abi: MANTLEMASK_ABI,
      });
      
      console.log("Contract instance created:", contract);
      
      // Check if we can read from the contract first
      try {
        console.log("Verifying contract connection by reading DENOMINATION...");
        const denomination = await readContract({
          contract,
          method: "DENOMINATION",
          params: []
        });
        console.log("Contract DENOMINATION:", denomination);
      } catch (readError: any) {
        console.error("Failed to read from contract:", readError);
        throw new Error(`Cannot connect to contract: ${readError.message}`);
      }
      
      console.log("Preparing transaction...");
      
      // Prepare the transaction using the note hash as commitment
      const transaction = prepareContractCall({
        contract,
        method: "deposit",
        params: [noteHash as `0x${string}`],
        value: BigInt(ethers.parseEther(amount).toString()),
      }) as any;
      
      console.log("Transaction prepared");
      console.log("Transaction details:");
      console.log("- Contract address:", contractAddress);
      console.log("- Method: deposit");
      console.log("- Params:", [noteHash]);
      console.log("- Value:", ethers.parseEther(amount).toString(), "wei");
      console.log("- Value in ETH:", amount);
      
      // Send the transaction
      console.log("Sending transaction...");
      
      // Add a timeout to catch if the transaction hangs
      const transactionTimeout = setTimeout(() => {
        console.warn("Transaction is taking longer than expected...");
        toast.info("Transaction is processing...", {
          description: "This may take a few moments on Mantle network",
        });
      }, 10000); // 10 seconds
      
      sendTransaction(transaction, {
        onSuccess: (result) => {
          clearTimeout(transactionTimeout);
          console.log("=== TRANSACTION SUCCESS ===");
          console.log("Transaction result:", result);
          console.log("Transaction hash:", result.transactionHash);
          
          setTxHash(result.transactionHash);
          setDepositState("complete");
          toast.success("Deposit successful!", {
            description: `${amount} MNT deposited anonymously. Save your note to withdraw later!`,
          });
          setIsLoading(false);
        },
        onError: (error) => {
          clearTimeout(transactionTimeout);
          console.error("=== TRANSACTION ERROR ===");
          console.error("Full error object:", error);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
          console.error("Error cause:", error.cause);
          console.error("Error name:", error.name);
          
          // Check for specific ThirdWeb errors
          if (error.message.includes("400") || error.message.includes("Bad Request")) {
            console.error("ThirdWeb API error detected");
          }
          
          let errorMessage = "Unknown transaction error";
          if (error.message.includes("user rejected") || error.message.includes("User rejected")) {
            errorMessage = "Transaction was rejected by user";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (error.message.includes("wrong network")) {
            errorMessage = "Please switch to Mantle Sepolia network";
          } else if (error.message.includes("400") || error.message.includes("Bad Request")) {
            errorMessage = "ThirdWeb API error - please try again";
          } else {
            errorMessage = error.message || "Transaction failed";
          }
          
          toast.error("Deposit failed", {
            description: errorMessage,
          });
          console.error("Error depositing:", error);
          setIsLoading(false);
          setDepositState("preview");
        },
      });
    } catch (error: any) {
      console.error("=== PREPARATION ERROR ===");
      console.error("Full error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      toast.error("Preparation failed", {
        description: error.message || "There was an error preparing your deposit",
      });
      console.error("Error preparing deposit:", error);
      setIsLoading(false);
      setDepositState("preview");
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

  // Check if a denomination is enabled (10 MNT supported in initial release)
  const isDenominationEnabled = (denom: string) => denom === "10"

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Anonymous Deposit</h1>
            <p className="text-sm text-muted-foreground">
              Deposit MNT tokens anonymously using zero-knowledge cryptography
            </p>
          </div>

          {/* Balance Display */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className="text-base font-semibold">
                  {isBalanceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `${formattedBalance} MNT`
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Flow */}
          {depositState === "select" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-4 w-4" />
                  Select Deposit Amount
                </CardTitle>
                <CardDescription className="text-sm">
                  Choose the amount to deposit anonymously. Currently supporting 10 MNT denominations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {["10"].map((denom) => (
                    <Button
                      key={denom}
                      variant={amount === denom ? "default" : "outline"}
                      className="h-12 text-base"
                      onClick={() => setAmount(denom)}
                      disabled={!isDenominationEnabled(denom)}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="font-bold">{denom} MNT</span>
                        {!isDenominationEnabled(denom) && (
                          <span className="text-xs text-muted-foreground">Coming Soon</span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={handleGenerateNote} 
                  className="w-full" 
                  disabled={!isDenominationEnabled(amount) || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Secure Note
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {depositState === "generating" && (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Generating cryptographic note...</p>
                    <p className="text-xs text-muted-foreground">
                      Creating secure commitment using zero-knowledge cryptography
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {depositState === "preview" && generatedNote && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-4 w-4" />
                  Secure Note Generated
                </CardTitle>
                <CardDescription className="text-sm">
                  Your anonymous deposit note has been generated. Save it securely to withdraw your funds later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-semibold">{amount} MNT</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Secure Note</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                      {secretNote}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyNote}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Store this note securely. You'll need it to withdraw your funds. There's no way to recover it if lost.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-2">
                <Button variant="outline" onClick={resetFlow} className="flex-1">
                  Generate New Note
                </Button>
                <Button 
                  onClick={handleConfirmDeposit} 
                  className="flex-1" 
                  disabled={!noteSaved || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    "Confirm Deposit"
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {depositState === "processing" && (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Processing deposit...</p>
                    <p className="text-xs text-muted-foreground">
                      Submitting anonymous transaction to Mantle Network
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {depositState === "complete" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Deposit Successful!
                </CardTitle>
                <CardDescription className="text-sm">
                  Your {amount} MNT has been deposited anonymously into MantleMask
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {txHash && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transaction Hash</label>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {txHash}
                    </div>
                  </div>
                )}
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Important Reminders
                  </p>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Your note is required to withdraw funds</li>
                    <li>• Store it in a safe, offline location</li>
                    <li>• Anyone with the note can withdraw your funds</li>
                    <li>• The deposit is now anonymous and untraceable</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button onClick={resetFlow} className="w-full">
                  Make Another Deposit
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Anonymous Deposit</h1>
          <p className="text-sm text-muted-foreground">
            Deposit MNT tokens anonymously using zero-knowledge cryptography
          </p>
        </div>

        {/* Balance Display */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Balance</span>
              <span className="text-base font-semibold">
                {isBalanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `${formattedBalance} MNT`
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Flow */}
        {depositState === "select" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-4 w-4" />
                Select Deposit Amount
              </CardTitle>
              <CardDescription className="text-sm">
                Choose the amount to deposit anonymously. Currently supporting 10 MNT denominations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {["10"].map((denom) => (
                  <Button
                    key={denom}
                    variant={amount === denom ? "default" : "outline"}
                    className="h-12 text-base"
                    onClick={() => setAmount(denom)}
                    disabled={!isDenominationEnabled(denom)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="font-bold">{denom} MNT</span>
                      {!isDenominationEnabled(denom) && (
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                onClick={handleGenerateNote} 
                className="w-full" 
                disabled={!isDenominationEnabled(amount) || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Secure Note
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {depositState === "generating" && (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Generating cryptographic note...</p>
                  <p className="text-xs text-muted-foreground">
                    Creating secure commitment using zero-knowledge cryptography
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {depositState === "preview" && generatedNote && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-4 w-4" />
                Secure Note Generated
              </CardTitle>
              <CardDescription className="text-sm">
                Your anonymous deposit note has been generated. Save it securely to withdraw your funds later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold">{amount} MNT</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Secure Note</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {secretNote}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyNote}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Store this note securely. You'll need it to withdraw your funds. There's no way to recover it if lost.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-2">
              <Button variant="outline" onClick={resetFlow} className="flex-1">
                Generate New Note
              </Button>
              <Button 
                onClick={handleConfirmDeposit} 
                className="flex-1" 
                disabled={!noteSaved || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  "Confirm Deposit"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {depositState === "processing" && (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Processing deposit...</p>
                  <p className="text-xs text-muted-foreground">
                    Submitting anonymous transaction to Mantle Network
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {depositState === "complete" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Deposit Successful!
              </CardTitle>
              <CardDescription className="text-sm">
                Your {amount} MNT has been deposited anonymously into MantleMask
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {txHash && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Hash</label>
                  <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                    {txHash}
                  </div>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-green-800">
                  ✅ Important Reminders
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Your note is required to withdraw funds</li>
                  <li>• Store it in a safe, offline location</li>
                  <li>• Anyone with the note can withdraw your funds</li>
                  <li>• The deposit is now anonymous and untraceable</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button onClick={resetFlow} className="w-full">
                Make Another Deposit
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
