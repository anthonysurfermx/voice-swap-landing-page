"use client"

import type React from "react"

import { useState } from "react"

export function CTASection() {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle waitlist submission
    console.log("Waitlist email:", email)
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
      <div className="text-center space-y-6 sm:space-y-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-balance">
          READY TO PAY WITH YOUR VOICE?
        </h2>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <input
            type="email"
            placeholder="YOUR EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 border-[3px] border-black font-black uppercase text-sm sm:text-base tracking-tight brutalist-shadow focus:outline-none focus:brutalist-shadow-hover placeholder:text-black/50"
            required
          />
          <button
            type="submit"
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-[#FFE135] border-[3px] border-black font-black uppercase text-sm sm:text-base tracking-tight brutalist-shadow brutalist-shadow-hover brutalist-press"
          >
            JOIN WAITLIST
          </button>
        </form>
      </div>
    </section>
  )
}
