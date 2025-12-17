export function TechStack() {
  const technologies = ["Unichain", "Uniswap V4", "WalletConnect", "x402", "Thirdweb", "OpenAI"]

  return (
    <section className="bg-black border-y-[3px] border-black py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          <span className="text-[#FFE135] font-black uppercase text-base sm:text-lg tracking-tight">BUILT WITH</span>
          {technologies.map((tech, index) => (
            <span
              key={index}
              className="text-white font-black uppercase text-sm sm:text-base tracking-tight px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-white"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
