import Link from "next/link"
import { Glasses } from "lucide-react"

export function Navigation() {
  return (
    <nav className="border-b-[3px] border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-black uppercase tracking-tight">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#4ECDC4] border-[2px] border-black flex items-center justify-center">
              <Glasses className="w-5 h-5 sm:w-6 sm:h-6 text-black" strokeWidth={3} />
            </div>
            VOICESWAP
          </Link>
          <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#FFE135] border-[3px] border-black font-black uppercase text-xs sm:text-sm tracking-tight brutalist-shadow-sm brutalist-shadow-hover brutalist-press">
            GET APP
          </button>
        </div>
      </div>
    </nav>
  )
}
