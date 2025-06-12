"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { DynamicWidget } from "@dynamic-labs/sdk-react-core"
import { ShieldCheck } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <Link href="/" className="text-xl font-bold">
            MantleMask
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link 
            href="/" 
            className={`transition-colors hover:text-primary ${isActive("/") ? "text-primary font-medium" : "text-muted-foreground"}`}
          >
            Home
          </Link>
          <Link 
            href="/deposit" 
            className={`transition-colors hover:text-primary ${isActive("/deposit") ? "text-primary font-medium" : "text-muted-foreground"}`}
          >
            Deposit
          </Link>
          <Link 
            href="/withdraw" 
            className={`transition-colors hover:text-primary ${isActive("/withdraw") ? "text-primary font-medium" : "text-muted-foreground"}`}
          >
            Withdraw
          </Link>
        </nav>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DynamicWidget />
        </div>
      </div>
    </header>
  )
} 