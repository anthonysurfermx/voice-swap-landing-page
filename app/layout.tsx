import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({
  subsets: ["latin"],
  weight: ["400", "700", "900"], // Include extra bold weights for brutalist design
})
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VoiceSwap - Voice-Activated Crypto Payments for AI Glasses",
  description:
    "Speak. Send. Settled. Voice-activated crypto payments for AI smart glasses. Pay with USDC on Unichain using just your voice.",
  keywords: ["crypto payments", "voice activated", "AI glasses", "USDC", "Unichain", "WalletConnect"],
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
