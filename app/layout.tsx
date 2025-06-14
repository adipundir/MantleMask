import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MantleMask - Privacy-First Token Transfers",
  description: "Transfer your MNT tokens with complete privacy using zero-knowledge proofs",
};

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} h-full overflow-auto`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThirdwebProvider>
            <div className="relative flex min-h-screen flex-col h-full">
              <Navbar />
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
            <Toaster richColors position="top-center" />
            </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
