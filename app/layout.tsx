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
  title: "VoiceSwap — Pay with your voice, through AI glasses",
  description:
    "Scan. Speak. Paid. Voice-activated payments for smart AI glasses. No phone, no friction — just you and your glasses.",
  keywords: ["voice payments", "AI glasses", "smart glasses", "USDC", "Monad", "contactless payments"],
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
  openGraph: {
    title: "VoiceSwap — Pay with your voice, through AI glasses",
    description: "Scan. Speak. Paid. Voice-activated payments for smart AI glasses.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-[#0a0a0a] text-white">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
