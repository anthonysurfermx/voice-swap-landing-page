'use client'

import { useWeb3 } from '@/components/web3-provider'
import { useState, useCallback, useEffect } from 'react'
import { parseIntent } from '@/lib/intents'
import { executeBet } from '@/lib/monad-bet'
import { MONAD_EXPLORER } from '@/lib/constants'
import Link from 'next/link'
import {
  Wallet, LogOut, Send, TrendingUp, Search,
  ExternalLink, Loader2, AlertTriangle,
  Shield, ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react'
import type { AnalysisResult, SmartWalletPosition } from '../api/market/analyze/route'

// Types

interface MarketInfo {
  conditionId: string
  question: string
  slug: string
  volume: number
  yesPrice: number
  noPrice: number
  image: string
  endDate: string
}

interface EventInfo {
  title: string
  slug: string
  image: string
  volume: number
  markets: MarketInfo[]
}

interface UserPosition {
  conditionId: string
  title: string
  slug: string
  outcome: string
  size: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPct: number
}

interface UserTrade {
  timestamp: number
  type: string
  title: string
  outcome: string
  side: string
  usdcSize: number
  price: number
  transactionHash: string
}

interface PortfolioData {
  portfolioValue: number
  positions: UserPosition[]
  recentTrades: UserTrade[]
  stats: {
    totalPnl: number
    openPositions: number
    winCount: number
    lossCount: number
    winRate: number
  }
}

type Tab = 'explore' | 'portfolio' | 'activity'

// Assistant name management
function getAssistantName(): string {
  if (typeof window === 'undefined') return 'BetWhisper'
  return localStorage.getItem('betwhisper_assistant_name') || ''
}

function setAssistantName(name: string) {
  localStorage.setItem('betwhisper_assistant_name', name)
}

// Onboarding: name your assistant
function OnboardingScreen({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState('')
  const [focused, setFocused] = useState(false)

  const suggestions = ['Don Fede', 'Buddy', 'Seu Jorge', '老王', 'Coach', 'El Profe']

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="mb-10">
          <div className="w-8 h-8 border border-white/20 flex items-center justify-center mb-8">
            <span className="text-[11px] font-bold">BW</span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-3">
            Name your assistant
          </h1>
          <p className="text-[15px] text-[--text-secondary] leading-relaxed">
            This is how you will activate it. By voice, through your glasses, or by typing in this dashboard.
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onComplete(name.trim()) }}
            placeholder="e.g. Don Fede"
            className={`w-full bg-transparent border ${
              focused ? 'border-white/40' : 'border-[--border-light]'
            } px-4 py-3.5 text-[16px] text-white placeholder:text-[--text-tertiary] outline-none transition-colors`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setName(s)}
              className="px-3 py-1.5 border border-[--border-light] text-[13px] text-[--text-secondary] hover:text-white hover:border-white/30 transition-colors active:scale-[0.97]"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => { if (name.trim()) onComplete(name.trim()) }}
          disabled={!name.trim()}
          className="w-full px-6 py-3.5 bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Continue
        </button>

        <p className="text-[12px] text-[--text-tertiary] mt-4 text-center">
          You can change this anytime in settings
        </p>
      </div>
    </div>
  )
}

// Stat card
function StatCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean | null
}) {
  return (
    <div className="px-5 py-4 border border-[--border] bg-black">
      <div className="text-[12px] text-[--text-secondary] mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-[24px] font-bold tracking-tight">{value}</span>
        {sub && (
          <span className={`text-[12px] font-semibold ${
            positive === true ? 'text-emerald-500' : positive === false ? 'text-red-400' : 'text-[--text-secondary]'
          }`}>
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

// Position row
function PositionRow({ pos }: { pos: UserPosition }) {
  const isPositive = pos.pnl >= 0
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[--border] hover:bg-[#0a0a0a] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate pr-4">{pos.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px] font-semibold ${
            pos.outcome === 'Yes' ? 'text-emerald-500' : 'text-red-400'
          }`}>{pos.outcome}</span>
          <span className="text-[11px] text-[--text-tertiary]">{pos.size.toFixed(1)} shares @ ${pos.avgPrice.toFixed(2)}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-[13px] font-semibold flex items-center gap-1 ${
          isPositive ? 'text-emerald-500' : 'text-red-400'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          ${Math.abs(pos.pnl).toFixed(2)}
        </div>
        <div className={`text-[11px] ${isPositive ? 'text-emerald-500/60' : 'text-red-400/60'}`}>
          {isPositive ? '+' : ''}{pos.pnlPct.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

// Trade row
function TradeRow({ trade }: { trade: UserTrade }) {
  const isBuy = trade.side === 'BUY'
  const date = new Date(trade.timestamp * 1000)
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[--border] hover:bg-[#0a0a0a] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate pr-4">{trade.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px] font-semibold ${isBuy ? 'text-emerald-500' : 'text-red-400'}`}>
            {trade.side}
          </span>
          <span className="text-[11px] text-[--text-tertiary]">{trade.outcome} @ ${trade.price.toFixed(2)}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[13px] font-medium">${trade.usdcSize.toFixed(2)}</div>
        <div className="text-[11px] text-[--text-tertiary]">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  )
}

// Whale card (Profound style)
function WhaleCard({ wallet, index }: { wallet: SmartWalletPosition; index: number }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3 border-b border-[--border] hover:bg-[#0a0a0a] transition-all"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 border border-[--border-light] flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-bold text-white/50">
            {wallet.pseudonym.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">{wallet.pseudonym}</span>
            {wallet.isAgent && (
              <span className="text-[9px] font-bold tracking-wider text-amber-500 border border-amber-500/30 px-1.5 py-0.5">AI</span>
            )}
          </div>
          <span className="text-[11px] text-[--text-tertiary]">Score: {wallet.score}</span>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-[13px] font-semibold ${
          wallet.side === 'Yes' ? 'text-emerald-500' : 'text-red-400'
        }`}>{wallet.side}</div>
        <div className="text-[11px] text-[--text-tertiary]">wt: {wallet.weight}</div>
      </div>
    </div>
  )
}

// Main page
export default function PredictDashboard() {
  const { address, isConnected, connect, disconnect, signer } = useWeb3()

  // Assistant name
  const [assistantName, setAssistantNameState] = useState<string | null>(null)
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    const name = getAssistantName()
    setAssistantNameState(name || null)
    setOnboarded(!!name)
  }, [])

  const handleOnboardComplete = (name: string) => {
    setAssistantName(name)
    setAssistantNameState(name)
    setOnboarded(true)
  }

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('explore')

  // Portfolio data
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  // Explore state
  const [input, setInput] = useState('')
  const [events, setEvents] = useState<EventInfo[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<MarketInfo | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Bet state
  const [betSide, setBetSide] = useState<'Yes' | 'No'>('Yes')
  const [betAmount, setBetAmount] = useState('0.01')
  const [betting, setBetting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Load portfolio when wallet connects
  useEffect(() => {
    if (!address) {
      setPortfolio(null)
      return
    }
    const load = async () => {
      setPortfolioLoading(true)
      try {
        const res = await fetch(`/api/user/portfolio?address=${address}`)
        if (res.ok) {
          const data = await res.json()
          setPortfolio(data)
        }
      } catch {
        // silently fail
      } finally {
        setPortfolioLoading(false)
      }
    }
    load()
  }, [address])

  // Search / trending
  const handleSearch = useCallback(async (query: string) => {
    setSearching(true)
    setSelectedMarket(null)
    setAnalysis(null)
    setTxHash(null)
    try {
      const intent = parseIntent(query)
      const q = intent.type === 'TRENDING' ? '' : (intent.query || query)
      const res = await fetch(`/api/markets?q=${encodeURIComponent(q)}&limit=12`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSubmit = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const intent = parseIntent(text)
    if (intent.type === 'PLACE_BET' && intent.side && analysis) {
      setBetSide(intent.side)
      if (intent.amount) setBetAmount(intent.amount)
      // Trigger bet
    } else {
      handleSearch(text)
    }
    setInput('')
  }, [input, analysis, handleSearch])

  // Analyze market
  const handleAnalyze = useCallback(async (market: MarketInfo) => {
    setSelectedMarket(market)
    setAnalyzing(true)
    setAnalysis(null)
    setTxHash(null)
    try {
      const res = await fetch('/api/market/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionId: market.conditionId }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
      }
    } catch {
      // silently fail
    } finally {
      setAnalyzing(false)
    }
  }, [])

  // Place bet
  const handleBet = useCallback(async () => {
    if (!signer || !analysis || !selectedMarket) return
    setBetting(true)
    try {
      const result = await executeBet(signer, {
        marketSlug: selectedMarket.slug,
        side: betSide,
        amount: betAmount,
        signalHash: analysis.signalHash,
      })
      setTxHash(result.txHash)

      await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketSlug: selectedMarket.slug,
          side: betSide,
          amount: betAmount,
          walletAddress: address,
          txHash: result.txHash,
          signalHash: analysis.signalHash,
        }),
      })
    } catch {
      // silently fail
    } finally {
      setBetting(false)
    }
  }, [signer, analysis, selectedMarket, betSide, betAmount, address])

  // Show loading while checking onboarding state
  if (onboarded === null) return <div className="min-h-screen bg-black" />

  // Onboarding
  if (!onboarded) return <OnboardingScreen onComplete={handleOnboardComplete} />

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-[--border] bg-black sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/betwhisper" className="flex items-center gap-2.5">
              <div className="w-5 h-5 border border-white/20 flex items-center justify-center">
                <span className="text-[8px] font-bold">BW</span>
              </div>
              <span className="text-[13px] font-semibold tracking-tight">BetWhisper</span>
            </Link>
            {assistantName && (
              <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-[--border]">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[12px] text-[--text-secondary]">
                  <span className="text-white/70 font-medium">{assistantName}</span> online
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <span className="text-[12px] text-[--text-secondary] font-mono hidden sm:block">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="p-2 border border-[--border-light] hover:border-white/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-[--text-secondary]" />
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                className="px-4 py-2 bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97] flex items-center gap-2"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-[--border]">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-0">
          {(['explore', 'portfolio', 'activity'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-white text-white'
                  : 'border-transparent text-[--text-secondary] hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto">
        {/* Explore tab */}
        {activeTab === 'explore' && (
          <div className="grid md:grid-cols-[1fr,400px] min-h-[calc(100vh-112px)]">
            {/* Left: search + markets */}
            <div className="border-r border-[--border]">
              {/* Search bar */}
              <div className="px-6 py-4 border-b border-[--border]">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center border border-[--border-light] bg-black">
                    <Search className="w-4 h-4 text-[--text-tertiary] ml-3" />
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                      placeholder={`Ask ${assistantName || 'BetWhisper'} about any market...`}
                      className="flex-1 bg-transparent px-3 py-2.5 text-[14px] text-white placeholder:text-[--text-tertiary] outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2.5 bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {['trending', 'Bitcoin', 'Trump', 'elections'].map(q => (
                    <button
                      key={q}
                      onClick={() => handleSearch(q)}
                      className="px-3 py-1 border border-[--border-light] text-[11px] text-[--text-secondary] hover:text-white hover:border-white/30 transition-colors active:scale-[0.97]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market results */}
              <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                {searching && (
                  <div className="px-6 py-8 flex items-center gap-2 text-[--text-secondary]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[13px]">Searching markets...</span>
                  </div>
                )}

                {!searching && events.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <TrendingUp className="w-6 h-6 text-[--text-tertiary] mx-auto mb-3" />
                    <p className="text-[14px] text-[--text-secondary] mb-1">Search for a market or click trending</p>
                    <p className="text-[12px] text-[--text-tertiary]">
                      Try: &quot;What are the odds on Bitcoin?&quot;
                    </p>
                  </div>
                )}

                {events.map(event => (
                  event.markets.map(market => (
                    <button
                      key={market.conditionId}
                      onClick={() => handleAnalyze(market)}
                      className={`w-full text-left px-6 py-4 border-b border-[--border] hover:bg-[#0a0a0a] transition-colors ${
                        selectedMarket?.conditionId === market.conditionId ? 'bg-[#0a0a0a]' : ''
                      }`}
                    >
                      <div className="text-[14px] font-medium mb-2 pr-6">{market.question}</div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-emerald-500 font-semibold">YES ${market.yesPrice.toFixed(2)}</span>
                          <span className="text-[--text-tertiary]">/</span>
                          <span className="text-[12px] text-red-400 font-semibold">NO ${market.noPrice.toFixed(2)}</span>
                        </div>
                        <span className="text-[11px] text-[--text-tertiary]">
                          Vol: ${market.volume > 1000000 ? `${(market.volume / 1000000).toFixed(1)}M` : `${(market.volume / 1000).toFixed(0)}K`}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[--text-tertiary] ml-auto" />
                      </div>
                    </button>
                  ))
                ))}
              </div>
            </div>

            {/* Right: analysis + bet panel */}
            <div className="overflow-y-auto max-h-[calc(100vh-112px)]">
              {!selectedMarket && !analyzing && (
                <div className="px-6 py-16 text-center">
                  <div className="w-10 h-10 border border-[--border-light] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-4 h-4 text-[--text-tertiary]" />
                  </div>
                  <p className="text-[14px] text-[--text-secondary]">Select a market to analyze</p>
                  <p className="text-[12px] text-[--text-tertiary] mt-1">
                    {assistantName} will scan whale wallets
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="px-6 py-8 flex items-center gap-2 text-[--text-secondary]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px]">Scanning whale wallets...</span>
                </div>
              )}

              {selectedMarket && analysis && !analyzing && (
                <div>
                  {/* Market header */}
                  <div className="px-5 py-4 border-b border-[--border]">
                    <div className="text-[14px] font-medium mb-2">{selectedMarket.question}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-[20px] font-bold text-emerald-500">
                        {(selectedMarket.yesPrice * 100).toFixed(0)}%
                      </span>
                      <span className="text-[12px] text-[--text-tertiary]">chance of YES</span>
                    </div>
                  </div>

                  {/* Consensus */}
                  <div className="px-5 py-4 border-b border-[--border]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] text-[--text-secondary]">Whale consensus</span>
                      <span className="text-[12px] text-[--text-tertiary]">
                        {analysis.consensus.count} / {analysis.trackedWalletCount} tracked
                      </span>
                    </div>
                    {analysis.consensus.count > 0 ? (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[24px] font-bold ${
                            analysis.consensus.direction === 'Yes' ? 'text-emerald-500' : 'text-red-400'
                          }`}>
                            {analysis.consensus.pct}% {analysis.consensus.direction}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[--border] w-full">
                          <div
                            className={`h-full transition-all duration-700 ${
                              analysis.consensus.direction === 'Yes' ? 'bg-emerald-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${analysis.consensus.pct}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-[--text-tertiary]">
                        No tracked whales in this market
                      </p>
                    )}
                  </div>

                  {/* Agent Shield */}
                  {analysis.agentShield.warning && (
                    <div className="px-5 py-3 border-b border-amber-500/20 bg-amber-500/[0.03]">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] font-semibold text-amber-500">AGENT SHIELD</span>
                      </div>
                      <p className="text-[12px] text-amber-400/80">{analysis.agentShield.warning}</p>
                    </div>
                  )}

                  {/* Whale list */}
                  {analysis.smartWallets.length > 0 && (
                    <div>
                      <div className="px-5 py-2 border-b border-[--border]">
                        <span className="text-[11px] text-[--text-tertiary]">
                          TRACKED WALLETS ({analysis.smartWallets.length})
                        </span>
                      </div>
                      {analysis.smartWallets.map((w, i) => (
                        <WhaleCard key={w.address} wallet={w} index={i} />
                      ))}
                    </div>
                  )}

                  {/* Bet section */}
                  <div className="px-5 py-5 border-t border-[--border]">
                    <div className="text-[12px] text-[--text-secondary] mb-3">Place bet</div>

                    {/* Side selector */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => setBetSide('Yes')}
                        className={`py-2.5 text-[13px] font-semibold border transition-colors ${
                          betSide === 'Yes'
                            ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                            : 'border-[--border-light] text-[--text-secondary] hover:text-white'
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setBetSide('No')}
                        className={`py-2.5 text-[13px] font-semibold border transition-colors ${
                          betSide === 'No'
                            ? 'border-red-400 text-red-400 bg-red-400/10'
                            : 'border-[--border-light] text-[--text-secondary] hover:text-white'
                        }`}
                      >
                        NO
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center border border-[--border-light] mb-3">
                      <span className="text-[13px] text-[--text-tertiary] pl-3">MON</span>
                      <input
                        type="text"
                        value={betAmount}
                        onChange={e => setBetAmount(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2.5 text-[14px] text-white outline-none text-right"
                      />
                    </div>

                    {/* Bet button */}
                    {txHash ? (
                      <a
                        href={`${MONAD_EXPLORER}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-emerald-500/30 text-emerald-500 text-[13px] font-semibold hover:bg-emerald-500/10 transition-colors"
                      >
                        Confirmed on Monad <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={handleBet}
                        disabled={betting || !isConnected}
                        className="w-full px-4 py-3 bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-all active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {betting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : !isConnected ? (
                          <>Connect wallet to bet</>
                        ) : (
                          <>Bet {betAmount} MON on {betSide}</>
                        )}
                      </button>
                    )}

                    {analysis.signalHash && (
                      <div className="mt-3 text-[10px] text-[--text-tertiary] font-mono truncate">
                        Signal: {analysis.signalHash}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio tab */}
        {activeTab === 'portfolio' && (
          <div className="px-6 py-8 max-w-4xl mx-auto">
            {!isConnected ? (
              <div className="text-center py-20">
                <Wallet className="w-8 h-8 text-[--text-tertiary] mx-auto mb-4" />
                <h2 className="text-[20px] font-bold mb-2">Connect your wallet</h2>
                <p className="text-[14px] text-[--text-secondary] mb-6">
                  See your Polymarket positions, performance, and trade history
                </p>
                <button
                  onClick={connect}
                  className="px-6 py-3 bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
                >
                  Connect Wallet
                </button>
              </div>
            ) : portfolioLoading ? (
              <div className="flex items-center gap-2 py-12 justify-center text-[--text-secondary]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Loading portfolio...</span>
              </div>
            ) : portfolio ? (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  <StatCard
                    label="Portfolio Value"
                    value={`$${portfolio.portfolioValue.toFixed(2)}`}
                  />
                  <StatCard
                    label="Total P&L"
                    value={`${portfolio.stats.totalPnl >= 0 ? '+' : ''}$${portfolio.stats.totalPnl.toFixed(2)}`}
                    positive={portfolio.stats.totalPnl >= 0}
                  />
                  <StatCard
                    label="Win Rate"
                    value={`${portfolio.stats.winRate}%`}
                    sub={`${portfolio.stats.winCount}W ${portfolio.stats.lossCount}L`}
                  />
                  <StatCard
                    label="Open Positions"
                    value={String(portfolio.stats.openPositions)}
                  />
                </div>

                {/* Positions */}
                <div className="border border-[--border] mb-8">
                  <div className="px-5 py-3 border-b border-[--border] flex items-center justify-between">
                    <span className="text-[13px] font-semibold">Open Positions</span>
                    <span className="text-[11px] text-[--text-tertiary]">{portfolio.positions.length}</span>
                  </div>
                  {portfolio.positions.length === 0 ? (
                    <div className="px-5 py-8 text-center text-[13px] text-[--text-secondary]">
                      No open positions on Polymarket
                    </div>
                  ) : (
                    portfolio.positions.map(pos => (
                      <PositionRow key={`${pos.conditionId}-${pos.outcome}`} pos={pos} />
                    ))
                  )}
                </div>

                {/* Recent trades */}
                <div className="border border-[--border]">
                  <div className="px-5 py-3 border-b border-[--border] flex items-center justify-between">
                    <span className="text-[13px] font-semibold">Recent Trades</span>
                    <span className="text-[11px] text-[--text-tertiary]">{portfolio.recentTrades.length}</span>
                  </div>
                  {portfolio.recentTrades.length === 0 ? (
                    <div className="px-5 py-8 text-center text-[13px] text-[--text-secondary]">
                      No recent trades
                    </div>
                  ) : (
                    portfolio.recentTrades.map((trade, i) => (
                      <TradeRow key={`${trade.transactionHash}-${i}`} trade={trade} />
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-6 h-6 text-[--text-tertiary] mx-auto mb-3" />
                <p className="text-[14px] text-[--text-secondary]">
                  Could not load portfolio data
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className="px-6 py-8 max-w-4xl mx-auto">
            {!isConnected ? (
              <div className="text-center py-20">
                <Wallet className="w-8 h-8 text-[--text-tertiary] mx-auto mb-4" />
                <h2 className="text-[20px] font-bold mb-2">Connect your wallet</h2>
                <p className="text-[14px] text-[--text-secondary] mb-6">
                  See your complete trading history across Polymarket
                </p>
                <button
                  onClick={connect}
                  className="px-6 py-3 bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
                >
                  Connect Wallet
                </button>
              </div>
            ) : portfolioLoading ? (
              <div className="flex items-center gap-2 py-12 justify-center text-[--text-secondary]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Loading activity...</span>
              </div>
            ) : portfolio?.recentTrades ? (
              <div className="border border-[--border]">
                <div className="px-5 py-3 border-b border-[--border]">
                  <span className="text-[13px] font-semibold">Trade History</span>
                </div>
                {portfolio.recentTrades.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] text-[--text-secondary]">
                    No trades found for this wallet on Polymarket
                  </div>
                ) : (
                  portfolio.recentTrades.map((trade, i) => (
                    <TradeRow key={`${trade.transactionHash}-${i}`} trade={trade} />
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-6 h-6 text-[--text-tertiary] mx-auto mb-3" />
                <p className="text-[14px] text-[--text-secondary]">
                  Could not load activity data
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
