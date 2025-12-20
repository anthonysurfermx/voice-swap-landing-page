import { Github, QrCode } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
      <div className="text-center space-y-6 sm:space-y-8">
        {/* Main title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none text-balance">
          VOICESWAP
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-lg lg:text-xl font-bold max-w-2xl mx-auto px-4">
          Voice-activated crypto payments for AI glasses
        </p>

        {/* Subtitle */}
        <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">Speak. Send. Settled.</p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 sm:pt-6 px-4">
          <div className="relative w-full sm:w-auto">
            <button
              disabled
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#FFE135] border-[3px] border-black font-black uppercase text-sm sm:text-base tracking-tight brutalist-shadow opacity-60 cursor-not-allowed relative"
            >
              GET THE APP
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-[#FF6B6B] border-[2px] border-black text-[10px] font-black uppercase brutalist-shadow-sm">
                Coming Soon
              </span>
            </button>
          </div>
          <Link
            href="/receive"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#4ADE80] border-[3px] border-black font-black uppercase text-sm sm:text-base tracking-tight brutalist-shadow brutalist-shadow-hover brutalist-press inline-flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" strokeWidth={3} />
            RECEIVE PAYMENTS
          </Link>
          <a
            href="https://github.com/anthropicsurfermx/voiceswap"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white border-[3px] border-black font-black uppercase text-sm sm:text-base tracking-tight brutalist-shadow brutalist-shadow-hover brutalist-press inline-flex items-center justify-center gap-2"
          >
            <Github className="w-5 h-5" strokeWidth={3} />
            VIEW ON GITHUB
          </a>
        </div>
      </div>
    </section>
  )
}
