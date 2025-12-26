"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, QrCode } from "lucide-react"

export function CTASection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Waitlist email:", email)
    setSubmitted(true)
  }

  return (
    <section id="waitlist" className="max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24 scroll-mt-20">
      <div className="space-y-8">
        {/* Primary CTA - Get the App */}
        <div className="p-8 lg:p-12 border border-[#E5E5E5] rounded-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#1BFFE3] rounded-full" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase font-mono">
                JOIN WAITLIST
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Be the first to pay
              <br />
              <span className="text-[#777777]">with your voice</span>
            </h2>

            <p className="text-[#777777] max-w-md">
              Get early access to VoiceSwap for Meta Ray-Ban glasses.
              We'll notify you when the iOS app is ready.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 border border-[#E5E5E5] text-sm font-mono focus:outline-none focus:border-[#1BFFE3] placeholder:text-[#777777]"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#1BFFE3] text-black text-[11px] font-bold tracking-[0.1em] uppercase font-mono hover:bg-[#66DEE0] transition-colors inline-flex items-center justify-center gap-2"
                >
                  JOIN WAITLIST
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 text-[#1BFFE3] pt-2">
                <div className="w-2 h-2 bg-[#1BFFE3] rounded-full animate-pulse" />
                <span className="font-medium">You're on the list! We'll be in touch.</span>
              </div>
            )}
          </div>
        </div>

        {/* Secondary CTA - For Merchants */}
        <div className="p-6 lg:p-8 bg-[#FAFAFA] rounded-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#777777] mb-1">
                FOR BUSINESSES
              </p>
              <p className="font-bold">
                Accept voice payments today
              </p>
              <p className="text-sm text-[#777777] mt-1">
                No app needed — just connect wallet and show QR
              </p>
            </div>
            <Link
              href="/receive"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#E5E5E5] bg-white text-black text-[11px] font-bold tracking-[0.1em] uppercase font-mono hover:border-[#1BFFE3] transition-colors whitespace-nowrap"
            >
              <QrCode className="w-4 h-4" strokeWidth={2} />
              RECEIVE PAYMENTS
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
