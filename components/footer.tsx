import { Github } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t-[3px] border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Logo */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-4">VOICESWAP</h3>
            <p className="font-bold text-sm">Voice-activated crypto payments for the future.</p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">LINKS</h4>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/anthropicsurfermx/voiceswap" className="font-bold text-sm hover:underline inline-flex items-center gap-2">
                <Github className="w-4 h-4" strokeWidth={3} />
                GitHub
              </a>
              <Link href="/docs" className="font-bold text-sm hover:underline">
                Documentation
              </Link>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 sm:pt-8 border-t-[3px] border-black">
          <p className="font-black uppercase text-xs sm:text-sm tracking-tight text-center">
            © 2025 VOICESWAP. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  )
}
