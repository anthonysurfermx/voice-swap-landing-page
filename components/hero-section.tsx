import { Glasses } from "lucide-react"
import { VideoSection } from "./video-section"

export function HeroSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
      <div className="space-y-8">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#836EF9] rounded-full animate-pulse" />
          <span className="text-[11px] font-medium tracking-[0.1em] uppercase font-mono text-[#777777]">
            META RAY-BAN • MONAD
          </span>
        </div>

        {/* Main title - Interfacer style */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
          Pay with your voice
          <br />
          <span className="text-[#777777]">through AI glasses</span>
        </h1>

        {/* Tagline */}
        <p className="text-base lg:text-lg text-[#777777] max-w-md leading-relaxed">
          Scan a QR code, say the amount, confirm with your voice.
          Instant USDC payments on Monad — no phone needed.
        </p>

        {/* CTA buttons - minimal style */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {/* Primary CTA - Coming Soon state */}
          <div className="relative">
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#836EF9]/50 text-white/50 text-[11px] font-bold tracking-[0.1em] uppercase font-mono cursor-not-allowed"
            >
              <Glasses className="w-4 h-4" strokeWidth={2} />
              GET THE APP
            </button>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-black text-white text-[9px] font-bold tracking-[0.1em] uppercase font-mono rounded-sm">
              SOON
            </span>
          </div>
          <VideoSection />
        </div>

        {/* Stats row - Interfacer minimal */}
        <div className="flex gap-12 pt-8 border-t border-[#E5E5E5]">
          <div>
            <p className="text-2xl font-bold">~$0</p>
            <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#777777] font-mono">Gas fees</p>
          </div>
          <div>
            <p className="text-2xl font-bold">&lt;1s</p>
            <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#777777] font-mono">Tx time</p>
          </div>
          <div>
            <p className="text-2xl font-bold">USDC</p>
            <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#777777] font-mono">Stablecoin</p>
          </div>
        </div>
      </div>
    </section>
  )
}
