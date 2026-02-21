// On-chain bet execution on Monad
// Self-bet pattern: MON transfer to own wallet with bet metadata in calldata
// The calldata proves the bet was informed by Agent Radar analysis

import { JsonRpcSigner, parseEther, hexlify, toUtf8Bytes } from 'ethers'
import { MONAD_EXPLORER } from './constants'

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

  // Self-bet: send to own address (bet metadata lives in calldata)
  const selfAddress = await signer.getAddress()

  // Encode bet metadata as calldata for on-chain data provenance
  const metadata = JSON.stringify({
    protocol: 'betwhisper',
    market: marketSlug,
    side,
    signal: signalHash,
    ts: Math.floor(Date.now() / 1000),
  })

  const tx = await signer.sendTransaction({
    to: selfAddress,
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
