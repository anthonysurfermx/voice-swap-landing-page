import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-geist",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "BetWhisper — Your AI voice interface to prediction markets",
  description:
    "Talk to your AI assistant, scan whale wallets, detect bots, and trade on Polymarket. Voice, text, or smart glasses. Cross-chain on Monad.",
  keywords: ["prediction markets", "Polymarket", "AI assistant", "Meta Ray-Ban", "smart glasses", "Monad", "voice trading", "whale detection"],
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
  metadataBase: new URL("https://betwhisper.ai"),
  openGraph: {
    title: "BetWhisper — Your AI voice interface to prediction markets",
    description: "Talk to your AI assistant, scan whale wallets, detect bots, and trade on Polymarket. Voice, text, or smart glasses. Cross-chain on Monad.",
    type: "website",
    url: "https://betwhisper.ai",
    siteName: "BetWhisper",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BetWhisper — Your AI voice interface to prediction markets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BetWhisper — Your AI voice interface to prediction markets",
    description: "Talk to your AI assistant, scan whale wallets, detect bots, and trade on Polymarket. Cross-chain on Monad.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-black text-white">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
