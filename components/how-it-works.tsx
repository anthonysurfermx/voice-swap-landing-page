import { Wallet, Mic, Check } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Wallet,
    title: "CONNECT",
    description: "Link your crypto wallet via WalletConnect. Works with MetaMask, Rainbow, Uniswap Wallet.",
  },
  {
    number: "02",
    icon: Mic,
    title: "SPEAK",
    description: 'Just say "Pay $25 to the coffee shop" - in English or Spanish.',
  },
  {
    number: "03",
    icon: Check,
    title: "DONE",
    description: "Payment executes instantly in USDC on Monad. MON auto-swaps if needed — no buttons.",
  },
]

export function HowItWorks() {
  return (
    <section className="max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Section header - Interfacer style */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-2 h-2 bg-black rounded-full" />
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase font-mono">
          HOW IT WORKS
        </span>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="flex gap-6 py-8 border-b border-[#E5E5E5] last:border-b-0"
            >
              {/* Number + Icon */}
              <div className="flex-shrink-0 w-16">
                <div className="w-10 h-10 bg-[#836EF9]/15 rounded-sm flex items-center justify-center">
                  <Icon className="w-5 h-5 text-black" strokeWidth={2} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#777777]">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
                </div>
                <p className="text-[#777777] text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
