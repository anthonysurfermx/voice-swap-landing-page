'use client'

import { useWeb3 } from '@/components/web3-provider'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, Copy, Check, Smartphone, QrCode } from 'lucide-react'

export default function ReceivePage() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWeb3()
  const [amount, setAmount] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Generate payment URL for QR code (deep link to iOS app)
  const paymentUrl = address
    ? `voiceswap://pay?wallet=${address}${amount ? `&amount=${amount}` : ''}${merchantName ? `&name=${encodeURIComponent(merchantName)}` : ''}`
    : ''

  // Web fallback URL
  const webUrl = address
    ? `https://voiceswap.vercel.app/pay/${address}${amount ? `?amount=${amount}` : ''}${merchantName ? `${amount ? '&' : '?'}name=${encodeURIComponent(merchantName)}` : ''}`
    : ''

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-black text-xl uppercase tracking-tighter">
              <ArrowLeft className="w-5 h-5" strokeWidth={3} />
              VoiceSwap
            </Link>
            {isConnected && (
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 border-[2px] border-black font-bold text-sm hover:bg-gray-100"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">
            Receive Payments
          </h1>
          <p className="text-lg text-gray-600">
            Connect your wallet to receive USDC payments on Unichain
          </p>

          {!isConnected ? (
            /* Not Connected - Show Connect Button */
            <div className="space-y-6">
              <div className="p-8 border-[3px] border-black bg-[#FFE135]" style={{ boxShadow: '6px 6px 0 black' }}>
                <Wallet className="w-16 h-16 mx-auto mb-4" strokeWidth={2} />
                <p className="font-bold mb-6">Connect your wallet to generate a payment QR code</p>
                <button
                  onClick={() => connect()}
                  disabled={isConnecting}
                  className="w-full px-8 py-4 bg-black text-white font-black uppercase tracking-tight text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Supports MetaMask and WalletConnect wallets on Unichain (Chain ID: 130)
              </p>
            </div>
          ) : !showQR ? (
            /* Connected - Setup Payment Details */
            <div className="space-y-6">
              <div className="p-4 border-[3px] border-black bg-green-100" style={{ boxShadow: '4px 4px 0 black' }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-bold">Connected to Unichain</span>
                </div>
                <button
                  onClick={copyAddress}
                  className="mt-2 flex items-center justify-center gap-2 mx-auto text-sm font-mono hover:underline"
                >
                  {address?.slice(0, 10)}...{address?.slice(-8)}
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-8 border-[3px] border-black bg-[#FFE135]" style={{ boxShadow: '6px 6px 0 black' }}>
                <div className="space-y-4 text-left">
                  <div>
                    <label className="block font-bold mb-2">Business Name (optional)</label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="e.g. Coffee Shop"
                      className="w-full px-4 py-3 border-[3px] border-black bg-white font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Amount in USDC (optional)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 25.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border-[3px] border-black bg-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowQR(true)}
                  className="w-full mt-6 px-8 py-4 bg-black text-white font-black uppercase tracking-tight text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  Generate QR Code
                </button>
              </div>
            </div>
          ) : (
            /* Show QR Code */
            <div className="space-y-8">
              {/* Wallet Info */}
              <div className="p-4 border-[3px] border-black bg-green-100" style={{ boxShadow: '4px 4px 0 black' }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-bold">Ready to receive on Unichain</span>
                </div>
                <button
                  onClick={copyAddress}
                  className="mt-2 flex items-center justify-center gap-2 mx-auto text-sm font-mono hover:underline"
                >
                  {address?.slice(0, 10)}...{address?.slice(-8)}
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* QR Code */}
              <div className="p-8 border-[3px] border-black bg-white" style={{ boxShadow: '6px 6px 0 black' }}>
                <div className="bg-white p-4 inline-block border-[2px] border-black">
                  <QRCodeSVG
                    value={paymentUrl}
                    size={220}
                    level="H"
                    marginSize={2}
                  />
                </div>
                <p className="mt-4 font-bold text-lg">
                  {merchantName || 'Scan to Pay'}
                  {amount && ` - $${amount} USDC`}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Customer scans with VoiceSwap app
                </p>
              </div>

              {/* Instructions */}
              <div className="p-6 border-[3px] border-black bg-gray-50" style={{ boxShadow: '4px 4px 0 black' }}>
                <h3 className="font-black uppercase mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  How customers pay
                </h3>
                <ol className="text-left space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="font-black">1.</span>
                    Customer opens VoiceSwap on their phone or glasses
                  </li>
                  <li className="flex gap-2">
                    <span className="font-black">2.</span>
                    Scans this QR code or says "Pay {amount ? `${amount} dollars` : 'amount'}{merchantName ? ` to ${merchantName}` : ''}"
                  </li>
                  <li className="flex gap-2">
                    <span className="font-black">3.</span>
                    Confirms payment in their MetaMask wallet
                  </li>
                  <li className="flex gap-2">
                    <span className="font-black">4.</span>
                    USDC arrives instantly in your wallet!
                  </li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowQR(false)}
                  className="px-6 py-3 border-[3px] border-black font-black uppercase text-sm hover:bg-gray-100 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-6 py-3 bg-black text-white border-[3px] border-black font-black uppercase text-sm hover:bg-gray-800 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="font-bold">Powered by Unichain</p>
          <p className="text-sm text-gray-500 mt-1">Fast, cheap USDC payments</p>
        </div>
      </footer>
    </div>
  )
}
