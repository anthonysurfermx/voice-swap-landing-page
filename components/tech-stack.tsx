export function TechStack() {
  const technologies = ["Unichain", "Uniswap V4", "WalletConnect", "Meta SDK", "Thirdweb", "x402", "OpenAI"]

  return (
    <section className="border-y border-[#E5E5E5] py-8">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#777777]">
            BUILT WITH
          </span>
          {technologies.map((tech, index) => (
            <span
              key={index}
              className="text-[11px] font-bold tracking-[0.05em] uppercase font-mono text-black"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
