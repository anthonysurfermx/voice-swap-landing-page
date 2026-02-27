// Multi-source MON price oracle with DeFi Llama Pro as primary
// Sources: DeFi Llama (Pro), CoinGecko, GeckoTerminal
// Fallback: hardcoded last-known price if all sources fail (never block a trade)

import { MON_PRICE_API } from './constants'

const DEFILLAMA_API_KEY = process.env.DEFILLAMA_API_KEY || '60bace27ae36a74f83b7fa4309052214337f9da310266fe623db73134b611a54'

const PRICE_SOURCES = [
  {
    name: 'defillama',
    url: 'https://coins.llama.fi/prices/current/coingecko:monad',
    headers: { 'x-api-key': DEFILLAMA_API_KEY },
    extract: (data: Record<string, Record<string, Record<string, number>>>): number | null => {
      const price = data?.coins?.['coingecko:monad']?.price
      return (price && price > 0) ? price : null
    },
  },
  {
    name: 'coingecko',
    url: MON_PRICE_API,
    headers: {} as Record<string, string>,
    extract: (data: Record<string, Record<string, number>>): number | null =>
      data?.monad?.usd > 0 ? data.monad.usd : null,
  },
  {
    name: 'geckoterminal',
    url: 'https://api.geckoterminal.com/api/v2/networks/monad/pools?page=1',
    headers: {} as Record<string, string>,
    extract: (data: Record<string, unknown>): number | null => {
      const items = (data?.data as Array<{ attributes?: { base_token_price_usd?: string } }>) || []
      if (!Array.isArray(items) || items.length === 0) return null
      const price = items[0]?.attributes?.base_token_price_usd
      if (!price) return null
      const parsed = parseFloat(price)
      return (parsed > 0.001 && parsed < 1) ? parsed : null
    },
  },
]

// Module-level cache (survives across requests within same serverless instance)
let cachedPrice: number | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000         // 60 seconds
const STALE_CACHE_TTL_MS = 600_000  // 10 minutes (extended for reliability)
const FETCH_TIMEOUT_MS = 6_000      // 6s per source (Vercel cold starts need more time)

// Last-known MON price — updated manually as safety net
const HARDCODED_FALLBACK_PRICE = 0.021

export interface MonPriceResult {
  price: number  // never null — always returns a price
  source: string
  cached: boolean
  sourcesChecked: number
  sourcesResponded: number
}

async function fetchWithTimeout(url: string, timeoutMs: number, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: headers || {},
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function getMonPrice(): Promise<MonPriceResult> {
  const now = Date.now()

  // Return cache if fresh
  if (cachedPrice !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return { price: cachedPrice, source: 'cache', cached: true, sourcesChecked: 0, sourcesResponded: 0 }
  }

  // Query all sources in parallel with individual timeouts
  const results: { name: string; price: number }[] = []

  const fetches = PRICE_SOURCES.map(async (src) => {
    try {
      const res = await fetchWithTimeout(src.url, FETCH_TIMEOUT_MS, src.headers as Record<string, string>)
      if (!res.ok) return
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (src.extract as (d: any) => number | null)(data)
      if (price !== null && price > 0 && isFinite(price)) {
        results.push({ name: src.name, price })
      }
    } catch {
      // Source failed — continue
    }
  })

  await Promise.allSettled(fetches)

  // No source responded — use stale cache or hardcoded fallback
  if (results.length === 0) {
    if (cachedPrice !== null && now - cacheTimestamp < STALE_CACHE_TTL_MS) {
      console.warn('[MonPrice] All sources failed, using stale cache')
      return { price: cachedPrice, source: 'stale_cache', cached: true, sourcesChecked: PRICE_SOURCES.length, sourcesResponded: 0 }
    }
    console.warn(`[MonPrice] All sources failed, using hardcoded fallback $${HARDCODED_FALLBACK_PRICE}`)
    cachedPrice = HARDCODED_FALLBACK_PRICE
    cacheTimestamp = now
    return { price: HARDCODED_FALLBACK_PRICE, source: 'hardcoded_fallback', cached: false, sourcesChecked: PRICE_SOURCES.length, sourcesResponded: 0 }
  }

  // Use first responding source (DeFi Llama is first = highest priority)
  // If multiple responded, prefer DeFi Llama > CoinGecko > GeckoTerminal
  const priorityOrder = ['defillama', 'coingecko', 'geckoterminal']
  results.sort((a, b) => priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name))

  cachedPrice = results[0].price
  cacheTimestamp = now

  if (results.length >= 2) {
    console.log(`[MonPrice] ${results.length} sources: ${results.map(r => `${r.name}=$${r.price.toFixed(4)}`).join(', ')} → using ${results[0].name}`)
  }

  return {
    price: cachedPrice,
    source: results[0].name,
    cached: false,
    sourcesChecked: PRICE_SOURCES.length,
    sourcesResponded: results.length,
  }
}

// Convenience: get price (never throws — always returns a usable price)
export async function getMonPriceOrThrow(): Promise<number> {
  const result = await getMonPrice()
  return result.price
}
