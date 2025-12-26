import { Mic, DollarSign, RefreshCw, Glasses, Zap, Shield } from "lucide-react"

const features = [
  {
    icon: Mic,
    title: "Voice First",
    description: "Control payments with natural voice commands in English or Spanish",
  },
  {
    icon: DollarSign,
    title: "USDC Payments",
    description: "Stable payments in USDC, no crypto volatility",
  },
  {
    icon: RefreshCw,
    title: "Auto-Swap",
    description: "Pay with ETH, we swap to USDC automatically via Uniswap",
  },
  {
    icon: Glasses,
    title: "AI Glasses",
    description: "Built for Meta Ray-Ban smart glasses with camera QR scanning",
  },
  {
    icon: Zap,
    title: "Unichain L2",
    description: "Fast & cheap transactions, near-zero gas fees",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    description: "WalletConnect integration, your keys stay with you",
  },
]

export function FeaturesGrid() {
  return (
    <section className="bg-[#FAFAFA] py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-2 h-2 bg-black rounded-full" />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase font-mono">
            FEATURES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="space-y-3">
                {/* Icon */}
                <div className="w-10 h-10 bg-[#1BFFE3]/15 rounded-sm flex items-center justify-center">
                  <Icon className="w-5 h-5 text-black" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold tracking-tight">{feature.title}</h3>

                {/* Description */}
                <p className="text-sm text-[#777777] leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
