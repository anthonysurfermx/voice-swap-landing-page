// Polymarket CLOB execution layer
// Server-side market order execution with slippage protection
// Uses a pre-funded Polygon wallet to place FOK orders

import { ClobClient, Side, OrderType } from '@polymarket/clob-client'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { GAMMA_API, POLYGON_RPC, USDC_POLYGON, SLIPPAGE_PCT, MAX_BET_USD } from './constants'

// Singleton CLOB client (lazy init)
let clientInstance: ClobClient | null = null
let walletAddress: string = ''

export interface ClobBetResult {
  success: boolean
  orderID: string
  transactionHashes: string[]
  price: number        // actual fill price
  shares: number       // shares received
  amountUSD: number    // USDC spent
  explorerUrl: string  // polygonscan link
}

export interface ClobTokenIds {
  yes: string
  no: string
  tickSize: string
  negRisk: boolean
}

async function getClient(): Promise<ClobClient> {
  if (clientInstance) return clientInstance

  const pk = process.env.POLYMARKET_PRIVATE_KEY
  if (!pk) throw new Error('POLYMARKET_PRIVATE_KEY not set')

  const signer = new Wallet(pk)
  walletAddress = await signer.getAddress()

  // Derive or create API credentials
  const temp = new ClobClient('https://clob.polymarket.com', 137, signer)
  const creds = await temp.createOrDeriveApiKey()

  clientInstance = new ClobClient(
    'https://clob.polymarket.com',
    137,
    signer,
    creds,
    0,                // signatureType: EOA
    walletAddress,    // funder address
  )

  console.log(`[CLOB] Initialized for wallet: ${walletAddress}`)
  return clientInstance
}

// Fetch clobTokenIds from Gamma API for a conditionId
export async function getTokenIds(conditionId: string): Promise<ClobTokenIds | null> {
  try {
    const res = await fetch(`${GAMMA_API}/markets?condition_id=${conditionId}&limit=1`)
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const market = data[0]
    const tokenIds = JSON.parse(market.clobTokenIds || '[]')
    if (tokenIds.length < 2) return null

    return {
      yes: tokenIds[0],
      no: tokenIds[1],
      tickSize: market.orderPriceMinTickSize?.toString() || '0.01',
      negRisk: market.negRisk === true,
    }
  } catch (e) {
    console.error('[CLOB] Failed to fetch token IDs:', e)
    return null
  }
}

// Get current best price for a token (for slippage calculation)
async function getBestPrice(client: ClobClient, tokenID: string, side: Side): Promise<number> {
  try {
    const book = await client.getOrderBook(tokenID)
    if (side === Side.BUY) {
      // For buying, we need the lowest ask
      const asks = book.asks || []
      if (asks.length > 0) return parseFloat(asks[0].price)
    } else {
      // For selling, we need the highest bid
      const bids = book.bids || []
      if (bids.length > 0) return parseFloat(bids[0].price)
    }
    // Fallback: get last trade price
    const lastTrade = await client.getLastTradePrice(tokenID)
    return parseFloat(lastTrade?.price || '0.5')
  } catch {
    return 0.5 // Safe default
  }
}

// Apply slippage to price (round to tick size)
function applySlippage(price: number, slippage: number, tickSize: string): number {
  const withSlippage = Math.min(price * (1 + slippage), 0.99)
  const tick = parseFloat(tickSize)
  return Math.ceil(withSlippage / tick) * tick
}

// Execute a market order on Polymarket CLOB
export async function executeClobBet(params: {
  conditionId: string
  outcomeIndex: number  // 0 = Yes, 1 = No
  amountUSD: number
  signalHash: string
}): Promise<ClobBetResult> {
  const { conditionId, outcomeIndex, amountUSD } = params

  // Safety cap
  if (amountUSD > MAX_BET_USD) {
    throw new Error(`Bet amount $${amountUSD} exceeds max $${MAX_BET_USD}`)
  }
  if (amountUSD <= 0) {
    throw new Error('Bet amount must be positive')
  }

  // Get token IDs
  const tokens = await getTokenIds(conditionId)
  if (!tokens) throw new Error('Market not found or missing token IDs')

  const tokenID = outcomeIndex === 0 ? tokens.yes : tokens.no
  const client = await getClient()

  // Get current best price and apply slippage
  const bestPrice = await getBestPrice(client, tokenID, Side.BUY)
  const priceWithSlippage = applySlippage(bestPrice, SLIPPAGE_PCT, tokens.tickSize)

  console.log(`[CLOB] Executing: $${amountUSD} on ${outcomeIndex === 0 ? 'YES' : 'NO'}`)
  console.log(`[CLOB] Token: ${tokenID.substring(0, 20)}...`)
  console.log(`[CLOB] Best price: ${bestPrice}, with slippage: ${priceWithSlippage}`)

  // Place FOK market order with slippage-protected price
  const response = await client.createAndPostMarketOrder(
    {
      tokenID,
      amount: amountUSD,
      side: Side.BUY,
      price: priceWithSlippage,
    },
    {
      tickSize: tokens.tickSize as '0.1' | '0.01' | '0.001' | '0.0001',
      negRisk: tokens.negRisk,
    },
    OrderType.FOK,
  )

  console.log(`[CLOB] Order response:`, JSON.stringify(response))

  if (!response.success && response.errorMsg) {
    throw new Error(`CLOB order failed: ${response.errorMsg}`)
  }

  const txHashes: string[] = response.transactionsHashes || []
  const makingAmount = parseFloat(response.makingAmount || '0')
  const takingAmount = parseFloat(response.takingAmount || '0')
  const fillPrice = takingAmount > 0 ? makingAmount / takingAmount : bestPrice

  return {
    success: true,
    orderID: response.orderID || '',
    transactionHashes: txHashes,
    price: fillPrice,
    shares: takingAmount,
    amountUSD: makingAmount || amountUSD,
    explorerUrl: txHashes.length > 0
      ? `https://polygonscan.com/tx/${txHashes[0]}`
      : '',
  }
}

// Check USDC balance on Polygon
export async function getUSDCBalance(): Promise<number> {
  const pk = process.env.POLYMARKET_PRIVATE_KEY
  if (!pk) return 0

  try {
    const provider = new JsonRpcProvider(POLYGON_RPC)
    const wallet = new Wallet(pk, provider)
    const usdc = new Contract(USDC_POLYGON, [
      'function balanceOf(address) view returns (uint256)',
    ], wallet)
    const balance = await usdc.balanceOf(wallet.address)
    return parseFloat(balance.toString()) / 1e6  // USDC has 6 decimals
  } catch {
    return 0
  }
}

export function getWalletAddress(): string {
  return walletAddress
}
