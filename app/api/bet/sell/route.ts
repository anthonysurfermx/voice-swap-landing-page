import { NextRequest, NextResponse } from 'next/server'
import { executeClobSell } from '@/lib/polymarket-clob'
import { sql } from '@/lib/db'

// NOTE: Sell cashout limitation
// When shares are sold, the USDC proceeds stay in the server's Polygon wallet.
// The user's position is closed in the DB, but actual USDC is not transferred back.
// Future: bridge USDC to Monad and send MON equivalent back to user's wallet,
// or implement a withdrawal queue with manual admin processing.

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { wallet, tokenId, shares, tickSize, negRisk, marketSlug } = body

  if (!wallet || !tokenId || !shares) {
    return NextResponse.json({ error: 'Missing required fields: wallet, tokenId, shares' }, { status: 400 })
  }

  const sharesToSell = parseFloat(shares)
  if (isNaN(sharesToSell) || sharesToSell <= 0) {
    return NextResponse.json({ error: 'Invalid shares amount' }, { status: 400 })
  }

  // Verify user has this position
  const positions = await sql`
    SELECT id, shares, avg_price, total_usd FROM positions
    WHERE wallet_address = ${wallet.toLowerCase()} AND token_id = ${tokenId} AND shares > 0
    LIMIT 1
  `

  if (positions.length === 0) {
    return NextResponse.json({ error: 'No open position found for this token' }, { status: 404 })
  }

  const position = positions[0]
  const currentShares = parseFloat(position.shares)

  if (sharesToSell > currentShares * 1.01) {
    return NextResponse.json({ error: `Cannot sell ${sharesToSell} shares, only ${currentShares} available` }, { status: 400 })
  }

  try {
    const result = await executeClobSell({
      tokenId,
      shares: Math.min(sharesToSell, currentShares),
      tickSize: tickSize || '0.01',
      negRisk: negRisk || false,
    })

    // Update position in database
    const remainingShares = currentShares - (result.shares || sharesToSell)

    if (remainingShares <= 0.001) {
      // Close position
      await sql`DELETE FROM positions WHERE id = ${position.id}`
    } else {
      await sql`
        UPDATE positions SET
          shares = ${remainingShares},
          total_usd = ${parseFloat(position.total_usd) - result.amountUSD},
          updated_at = NOW()
        WHERE id = ${position.id}
      `
    }

    return NextResponse.json({
      success: true,
      sharesSold: result.shares,
      usdReceived: result.amountUSD,
      price: result.price,
      polygonTxHash: result.transactionHashes[0] || '',
      explorerUrl: result.explorerUrl,
      remainingShares: Math.max(remainingShares, 0),
      marketSlug,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CLOB Sell] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
