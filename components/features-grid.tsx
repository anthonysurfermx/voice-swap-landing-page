import { Mic, DollarSign, RefreshCw, Glasses, Zap, Shield } from "lucide-react"

const features = [
  {
    icon: Mic,
    title: "VOICE FIRST",
    description: "Control payments with natural voice commands",
    color: "bg-[#4ECDC4]", // Teal
  },
  {
    icon: DollarSign,
    title: "USDC PAYMENTS",
    description: "Stable payments in USDC, no volatility",
    color: "bg-[#FF6B6B]", // Coral
  },
  {
    icon: RefreshCw,
    title: "AUTO-SWAP",
    description: "Pay with ETH, we swap to USDC automatically",
    color: "bg-[#FFE135]", // Yellow
  },
  {
    icon: Glasses,
    title: "AI GLASSES",
    description: "Built for smart AI glasses",
    color: "bg-[#FFE135]", // Yellow
  },
  {
    icon: Zap,
    title: "UNICHAIN",
    description: "Fast & cheap transactions on Unichain L2",
    color: "bg-[#4ECDC4]", // Teal
  },
  {
    icon: Shield,
    title: "SECURE",
    description: "WalletConnect + non-custodial, your keys always",
    color: "bg-[#FF6B6B]", // Coral
  },
]

export function FeaturesGrid() {
  return (
    <section className="bg-[#F5F5DC] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-center mb-8 sm:mb-12">
        FEATURES
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="bg-white border-[3px] border-black brutalist-shadow brutalist-shadow-hover p-6 space-y-4"
            >
              <div
                className={`${feature.color} border-[3px] border-black w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center brutalist-shadow-sm`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={3} />
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">{feature.title}</h3>
              <p className="font-bold text-sm leading-relaxed">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
