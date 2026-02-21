import { NextRequest, NextResponse } from 'next/server'
import { executeClobBet, getUSDCBalance } from '@/lib/polymarket-clob'
import { MAX_BET_USD, POLYGON_EXPLORER } from '@/lib/constants'

// Daily spend tracking (resets on deploy/restart)
let dailySpent = 0
let dailyResetDate = new Date().toDateString()
const DAILY_LIMIT = 500

function checkDailyLimit(amount: number): boolean {
  const today = new Date().toDateString()
  if (today !== dailyResetDate) {
    dailySpent = 0
    dailyResetDate = today
  }
  return (dailySpent + amount) <= DAILY_LIMIT
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { conditionId, outcomeIndex, amountUSD, signalHash, marketSlug, monadTxHash } = body

  // Validate required fields
  if (!conditionId || outcomeIndex === undefined || !amountUSD || !marketSlug) {
    return NextResponse.json({ error: 'Missing required fields: conditionId, outcomeIndex, amountUSD, marketSlug' }, { status: 400 })
  }

  // Validate amount
  const amount = parseFloat(amountUSD)
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }
  if (amount > MAX_BET_USD) {
    return NextResponse.json({ error: `Amount exceeds max bet of $${MAX_BET_USD}` }, { status: 400 })
  }

  // Check daily limit
  if (!checkDailyLimit(amount)) {
    return NextResponse.json({ error: `Daily limit of $${DAILY_LIMIT} reached` }, { status: 400 })
  }

  // Mock mode (panic button for demo)
  if (process.env.MOCK_POLYGON_EXECUTION === 'true') {
    await new Promise(r => setTimeout(r, 1500))
    const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    dailySpent += amount
    return NextResponse.json({
      success: true,
      source: 'polymarket-mock',
      orderID: `mock_${Date.now()}`,
      txHash: mockHash,
      polygonTxHash: mockHash,
      price: outcomeIndex === 0 ? 0.55 : 0.45,
      shares: amount / (outcomeIndex === 0 ? 0.55 : 0.45),
      amountUSD: amount,
      explorerUrl: `${POLYGON_EXPLORER}/tx/${mockHash}`,
      monadTxHash: monadTxHash || null,
      marketSlug,
      side: outcomeIndex === 0 ? 'Yes' : 'No',
    })
  }

  // Check USDC balance
  const balance = await getUSDCBalance()
  if (balance < amount) {
    return NextResponse.json({
      error: `Insufficient USDC balance: $${balance.toFixed(2)} available, $${amount} needed`,
    }, { status: 400 })
  }

  try {
    // Execute real CLOB order on Polymarket
    const result = await executeClobBet({
      conditionId,
      outcomeIndex,
      amountUSD: amount,
      signalHash: signalHash || '',
    })

    dailySpent += amount

    return NextResponse.json({
      success: true,
      source: 'polymarket',
      orderID: result.orderID,
      txHash: result.transactionHashes[0] || '',
      polygonTxHash: result.transactionHashes[0] || '',
      price: result.price,
      shares: result.shares,
      amountUSD: result.amountUSD,
      explorerUrl: result.explorerUrl,
      monadTxHash: monadTxHash || null,
      marketSlug,
      side: outcomeIndex === 0 ? 'Yes' : 'No',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CLOB Execute] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET: Check execution status and balance
export async function GET() {
  const balance = await getUSDCBalance()
  const today = new Date().toDateString()
  if (today !== dailyResetDate) {
    dailySpent = 0
    dailyResetDate = today
  }

  return NextResponse.json({
    ready: !!process.env.POLYMARKET_PRIVATE_KEY,
    mock: process.env.MOCK_POLYGON_EXECUTION === 'true',
    balance: balance,
    dailySpent,
    dailyLimit: DAILY_LIMIT,
    dailyRemaining: DAILY_LIMIT - dailySpent,
    maxBetUSD: MAX_BET_USD,
  })
}
