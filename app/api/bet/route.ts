import { NextRequest, NextResponse } from 'next/server'
import { POLYGON_EXPLORER } from '@/lib/constants'

interface BetRecord {
  id: string
  marketSlug: string
  side: 'Yes' | 'No'
  amount: string
  walletAddress: string
  txHash: string
  signalHash: string
  timestamp: number
  source: string
  monadTxHash: string
}

// In-memory store for hackathon demo
const bets: BetRecord[] = []

export async function POST(request: NextRequest) {
  const { marketSlug, side, amount, walletAddress, txHash, signalHash, source, monadTxHash } = await request.json()

  if (!marketSlug || !side || !amount || !txHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const bet: BetRecord = {
    id: `bet_${Date.now()}`,
    marketSlug,
    side,
    amount,
    walletAddress: walletAddress || 'demo',
    txHash,
    signalHash: signalHash || '',
    timestamp: Date.now(),
    source: source || 'monad',
    monadTxHash: monadTxHash || '',
  }

  bets.push(bet)

  return NextResponse.json({
    success: true,
    bet,
    explorerUrl: `${POLYGON_EXPLORER}/tx/${txHash}`,
  })
}

export async function GET() {
  return NextResponse.json({ bets, count: bets.length })
}
