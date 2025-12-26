import Link from "next/link"

export function Navigation() {
  return (
    <nav className="border-b border-[#E5E5E5] bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            {/* Minimal dot indicator */}
            <div className="w-2 h-2 bg-[#1BFFE3] rounded-full" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">
              VOICESWAP
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Secondary link for merchants */}
            <Link
              href="/receive"
              className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#777777] hover:text-black transition-colors hidden sm:block"
            >
              FOR BUSINESSES
            </Link>

            {/* Primary CTA - scrolls to waitlist */}
            <a
              href="#waitlist"
              className="px-4 py-2 bg-[#1BFFE3] text-black text-[11px] font-bold tracking-[0.1em] uppercase font-mono hover:bg-[#66DEE0] transition-colors"
            >
              GET EARLY ACCESS
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
