import { NextRequest, NextResponse } from 'next/server'
import { MONAD_EXPLORER } from '@/lib/constants'

interface BetRecord {
  id: string
  marketSlug: string
  side: 'Yes' | 'No'
  amount: string
  walletAddress: string
  txHash: string
  signalHash: string
  timestamp: number
}

// In-memory store for hackathon demo
const bets: BetRecord[] = []

export async function POST(request: NextRequest) {
  const { marketSlug, side, amount, walletAddress, txHash, signalHash } = await request.json()

  if (!marketSlug || !side || !amount || !walletAddress || !txHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const bet: BetRecord = {
    id: `bet_${Date.now()}`,
    marketSlug,
    side,
    amount,
    walletAddress,
    txHash,
    signalHash: signalHash || '',
    timestamp: Date.now(),
  }

  bets.push(bet)

  return NextResponse.json({
    success: true,
    bet,
    explorerUrl: `${MONAD_EXPLORER}/tx/${txHash}`,
  })
}

export async function GET() {
  return NextResponse.json({ bets, count: bets.length })
}
