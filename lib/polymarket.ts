// Polymarket API utilities (server-side only)
// Ported from defi-mexico-hub/src/services/polymarket.service.ts

import { GAMMA_API, DATA_API } from './constants'

export interface MarketInfo {
  conditionId: string
  question: string
  slug: string
  volume: number
  yesPrice: number
  noPrice: number
  image: string
  endDate: string
  outcomes: string[]
}

export interface EventInfo {
  title: string
  slug: string
  image: string
  volume: number
  liquidity: number
  endDate: string
  markets: MarketInfo[]
}

export interface MarketHolder {
  address: string
  pseudonym: string
  amount: number
  outcome: 'Yes' | 'No'
}

function parseMarket(m: Record<string, unknown>): MarketInfo {
  const prices = JSON.parse((m.outcomePrices as string) || '[]')
  const outcomes = JSON.parse((m.outcomes as string) || '["Yes","No"]')
  return {
    conditionId: (m.conditionId as string) || '',
    question: (m.question as string) || '',
    slug: (m.slug as string) || '',
    volume: parseFloat(m.volume as string) || 0,
    yesPrice: parseFloat(prices[0]) || 0,
    noPrice: parseFloat(prices[1]) || 0,
    image: (m.image as string) || '',
    endDate: (m.endDate as string) || '',
    outcomes,
  }
}

export async function searchMarkets(query: string, limit = 10): Promise<EventInfo[]> {
  const params = new URLSearchParams({
    _limit: String(limit),
    active: 'true',
    closed: 'false',
    order: 'volume24hr',
    ascending: 'false',
  })
  if (query) params.set('title', query)

  const res = await fetch(`${GAMMA_API}/events?${params}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []

  return data.map((event: Record<string, unknown>) => {
    const rawMarkets = (event.markets as Record<string, unknown>[]) || []
    return {
      title: (event.title as string) || '',
      slug: (event.slug as string) || '',
      image: (event.image as string) || '',
      volume: parseFloat(event.volume as string) || 0,
      liquidity: parseFloat(event.liquidity as string) || 0,
      endDate: (event.endDate as string) || '',
      markets: rawMarkets.map(parseMarket),
    }
  })
}

export async function getMarketBySlug(slug: string): Promise<MarketInfo | null> {
  // Try as market slug first
  const res = await fetch(`${GAMMA_API}/markets?slug=${slug}&limit=1`)
  if (res.ok) {
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return parseMarket(data[0])
    }
  }

  // Try as event slug
  const eventRes = await fetch(`${GAMMA_API}/events?slug=${slug}&limit=1`)
  if (eventRes.ok) {
    const eventData = await eventRes.json()
    if (Array.isArray(eventData) && eventData.length > 0) {
      const markets = eventData[0].markets || []
      if (markets.length > 0) return parseMarket(markets[0])
    }
  }

  return null
}

export async function getMarketHolders(conditionId: string): Promise<MarketHolder[]> {
  const res = await fetch(`${DATA_API}/holders?market=${conditionId}&limit=100`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []

  const holders: MarketHolder[] = []
  for (const group of data) {
    const outcomeIndex = group.holders?.[0]?.outcomeIndex ?? 0
    const outcome: 'Yes' | 'No' = outcomeIndex === 0 ? 'Yes' : 'No'
    for (const h of group.holders || []) {
      holders.push({
        address: h.proxyWallet || '',
        pseudonym: h.pseudonym || h.name || '',
        amount: parseFloat(h.amount) || 0,
        outcome,
      })
    }
  }

  holders.sort((a, b) => b.amount - a.amount)
  return holders
}

export async function getTrendingMarkets(limit = 8): Promise<EventInfo[]> {
  return searchMarkets('', limit)
}

// User-specific Polymarket data (Data API)

export interface UserPosition {
  conditionId: string
  title: string
  slug: string
  eventSlug: string
  outcome: string
  outcomeIndex: number
  size: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPct: number
}

export interface UserActivity {
  timestamp: number
  type: string // TRADE, SPLIT, MERGE, REDEEM, REWARD
  title: string
  slug: string
  outcome: string
  side: string // BUY, SELL
  size: number
  usdcSize: number
  price: number
  transactionHash: string
}

export interface UserProfile {
  name: string
  pseudonym: string
  profileImage: string
  bio: string
}

export interface UserPortfolioValue {
  totalValue: number
}

export async function getUserPositions(address: string): Promise<UserPosition[]> {
  const res = await fetch(`${DATA_API}/positions?user=${address}&sizeThreshold=0.1`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []

  return data.map((p: Record<string, unknown>) => {
    const size = parseFloat(p.size as string) || 0
    const avgPrice = parseFloat(p.avgPrice as string) || 0
    const currentPrice = parseFloat(p.curPrice as string) || parseFloat(p.currentPrice as string) || 0
    const pnl = size * (currentPrice - avgPrice)
    const pnlPct = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0

    return {
      conditionId: (p.conditionId as string) || (p.asset as string) || '',
      title: (p.title as string) || '',
      slug: (p.slug as string) || '',
      eventSlug: (p.eventSlug as string) || '',
      outcome: (p.outcome as string) || '',
      outcomeIndex: (p.outcomeIndex as number) || 0,
      size,
      avgPrice,
      currentPrice,
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 10) / 10,
    }
  })
}

export async function getUserActivity(
  address: string,
  limit = 50,
  type?: string
): Promise<UserActivity[]> {
  const params = new URLSearchParams({
    user: address,
    limit: String(limit),
    sortBy: 'TIMESTAMP',
    sortDirection: 'DESC',
  })
  if (type) params.set('type', type)

  const res = await fetch(`${DATA_API}/activity?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []

  return data.map((a: Record<string, unknown>) => ({
    timestamp: (a.timestamp as number) || 0,
    type: (a.type as string) || '',
    title: (a.title as string) || '',
    slug: (a.slug as string) || '',
    outcome: (a.outcome as string) || '',
    side: (a.side as string) || '',
    size: parseFloat(a.size as string) || 0,
    usdcSize: parseFloat(a.usdcSize as string) || 0,
    price: parseFloat(a.price as string) || 0,
    transactionHash: (a.transactionHash as string) || '',
  }))
}

export async function getUserPortfolioValue(address: string): Promise<UserPortfolioValue> {
  const res = await fetch(`${DATA_API}/value?user=${address}`)
  if (!res.ok) return { totalValue: 0 }
  const data = await res.json()
  return {
    totalValue: parseFloat(data?.value as string) || parseFloat(data?.totalValue as string) || 0,
  }
}

export async function getUserProfile(address: string): Promise<UserProfile | null> {
  const res = await fetch(`${GAMMA_API}/public-profile?address=${address}`)
  if (!res.ok) return null
  const data = await res.json()
  return {
    name: (data.name as string) || '',
    pseudonym: (data.pseudonym as string) || '',
    profileImage: (data.profileImage as string) || '',
    bio: (data.bio as string) || '',
  }
}
