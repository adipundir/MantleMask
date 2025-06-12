import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Lock, ArrowRight, Coins, Fingerprint } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-b">
        <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
          <div className="grid gap-4 px-10 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                <Lock className="mr-1 h-4 w-4" />
                Privacy-Focused
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Anonymous Token Transfers on Mantle Network
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                MantleMask uses zero-knowledge proofs to enable completely private token transfers.
                Deposit your tokens and withdraw them to any address without revealing the connection.
              </p>
              <div>
                <Link href="/deposit">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-[350px] rounded-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
                <ShieldCheck className="h-32 w-32 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                MantleMask uses advanced cryptography to ensure your transactions remain private
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">1. Deposit Tokens</h3>
              <p className="text-muted-foreground">
                Deposit your MNT tokens into the MantleMask contract and receive a secret note
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">2. Store Your Note</h3>
              <p className="text-muted-foreground">
                Keep your secret note safe - it's the only way to access your funds
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Fingerprint className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">3. Withdraw Anonymously</h3>
              <p className="text-muted-foreground">
                Use your secret note to withdraw tokens to any address with complete privacy
        </p>
      </div>
          </div>
          <div className="flex justify-center">
            <Link href="/deposit">
              <Button size="lg" className="w-full min-[400px]:w-auto">
                Make a Deposit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <p className="text-center text-sm leading-loose md:text-left">
              Built for privacy and security on Mantle Network
            </p>
      </div>
          <p className="text-center text-sm md:text-left">
            MantleMask &copy; {new Date().getFullYear()}
          </p>
      </div>
      </footer>
    </div>
  )
}
