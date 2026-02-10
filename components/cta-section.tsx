"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, QrCode, Loader2 } from "lucide-react"

export function CTASection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Something went wrong")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join waitlist")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="waitlist" className="max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24 scroll-mt-20">
      <div className="space-y-8">
        {/* Primary CTA - Get the App */}
        <div className="p-8 lg:p-12 border border-[#E5E5E5] rounded-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#836EF9] rounded-full" />
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
              <div className="space-y-3 pt-2">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 border border-[#E5E5E5] text-sm font-mono focus:outline-none focus:border-[#836EF9] placeholder:text-[#777777] disabled:opacity-50"
                    required
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#836EF9] text-white text-[11px] font-bold tracking-[0.1em] uppercase font-mono hover:bg-[#A18FFF] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        JOIN WAITLIST
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
                {error && (
                  <p className="text-sm text-red-500 font-mono">{error}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#836EF9] pt-2">
                <div className="w-2 h-2 bg-[#836EF9] rounded-full animate-pulse" />
                <span className="font-medium">You're on the list! Check your email.</span>
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#E5E5E5] bg-white text-black text-[11px] font-bold tracking-[0.1em] uppercase font-mono hover:border-[#836EF9] transition-colors whitespace-nowrap"
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
