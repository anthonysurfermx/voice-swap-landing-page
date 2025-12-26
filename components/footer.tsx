import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          {/* Logo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#1BFFE3] rounded-full" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">
                VOICESWAP
              </span>
            </div>
            <p className="text-sm text-[#777777]">
              Voice-activated crypto payments
              <br />
              for Meta Ray-Ban glasses
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div className="space-y-3">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#777777]">
                PRODUCT
              </span>
              <div className="flex flex-col gap-2">
                <a href="#waitlist" className="text-sm hover:text-[#1BFFE3] transition-colors">
                  Get Early Access
                </a>
                <Link href="/receive" className="text-sm hover:text-[#1BFFE3] transition-colors">
                  For Businesses
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#777777]">
                RESOURCES
              </span>
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/anthropicsurfermx/voiceswap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-[#1BFFE3] transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://unichain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-[#1BFFE3] transition-colors"
                >
                  Unichain
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 mt-8 border-t border-[#E5E5E5]">
          <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#777777] font-mono text-center">
            © 2025 VOICESWAP • BUILT ON UNICHAIN
          </p>
        </div>
      </div>
    </footer>
  )
}
