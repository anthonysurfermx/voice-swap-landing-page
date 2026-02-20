// On-chain bet execution on Monad
// Uses native MON transfer with signal hash in calldata for data provenance

import { JsonRpcSigner, parseEther, hexlify, toUtf8Bytes } from 'ethers'
import { BETWHISPER_POOL_ADDRESS, MONAD_EXPLORER } from './constants'

export interface BetParams {
  marketSlug: string
  side: 'Yes' | 'No'
  amount: string // MON amount as string (e.g. "0.01")
  signalHash: string
}

export interface BetResult {
  txHash: string
  blockNumber: number
  explorerUrl: string
}

export async function executeBet(
  signer: JsonRpcSigner,
  params: BetParams
): Promise<BetResult> {
  const { marketSlug, side, amount, signalHash } = params

  // Encode bet metadata as calldata for on-chain data provenance
  // This proves the bet was informed by the whale radar signal
  const metadata = JSON.stringify({
    protocol: 'betwhisper',
    market: marketSlug,
    side,
    signal: signalHash,
    ts: Math.floor(Date.now() / 1000),
  })

  const tx = await signer.sendTransaction({
    to: BETWHISPER_POOL_ADDRESS,
    value: parseEther(amount),
    data: hexlify(toUtf8Bytes(metadata)),
  })

  const receipt = await tx.wait()

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? 0,
    explorerUrl: `${MONAD_EXPLORER}/tx/${tx.hash}`,
  }
}
