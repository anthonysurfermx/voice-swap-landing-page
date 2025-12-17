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
    description: "Payment executes instantly in USDC on Unichain. No buttons needed.",
  },
]

export function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-center mb-8 sm:mb-12">
        HOW IT WORKS
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="bg-white border-[3px] border-black brutalist-shadow brutalist-shadow-hover overflow-hidden"
            >
              {/* Header bar */}
              <div className="bg-[#FFE135] border-b-[3px] border-black p-4 flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-black">{step.number}</span>
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
              </div>
              {/* Body */}
              <div className="p-4 sm:p-6 space-y-3">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{step.title}</h3>
                <p className="font-bold text-sm sm:text-base leading-relaxed">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
