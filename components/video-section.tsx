"use client"

import { useState } from "react"
import { Play, X } from "lucide-react"

export function VideoSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Video Button - inline style */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 border border-[#E5E5E5] text-black text-[11px] font-bold tracking-[0.1em] uppercase font-mono hover:border-[#1BFFE3] hover:text-[#1BFFE3] transition-colors group"
      >
        <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center group-hover:bg-[#1BFFE3] group-hover:border-[#1BFFE3] group-hover:text-black transition-colors">
          <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
        </div>
        WATCH DEMO
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 p-2 text-white hover:text-[#1BFFE3] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Video container */}
          <div
            className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            >
              <source src="https://17usg51unah8rfmu.public.blob.vercel-storage.com/demo.mp4" type="video/mp4" />
              <source src="https://17usg51unah8rfmu.public.blob.vercel-storage.com/demo.mov" type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Caption */}
          <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] font-medium tracking-[0.05em] uppercase text-white/60 font-mono">
            Voice payment on Meta Ray-Ban glasses
          </p>
        </div>
      )}
    </>
  )
}
