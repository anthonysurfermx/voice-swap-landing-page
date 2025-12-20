'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import EthereumProvider from '@walletconnect/ethereum-provider'

// Unichain configuration
const UNICHAIN_CONFIG = {
  chainId: 130,
  chainName: 'Unichain',
  rpcUrl: 'https://mainnet.unichain.org',
  blockExplorer: 'https://uniscan.xyz',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
}

// WalletConnect Project ID
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a7f53074c8b97d5aa4c8fb80c2f64564'

interface Web3ContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
  provider: null,
  signer: null,
})

export function useWeb3() {
  return useContext(Web3Context)
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [wcProvider, setWcProvider] = useState<InstanceType<typeof EthereumProvider> | null>(null)

  // Initialize provider on mount
  useEffect(() => {
    const init = async () => {
      try {
        const ethereumProvider = await EthereumProvider.init({
          projectId: PROJECT_ID,
          chains: [UNICHAIN_CONFIG.chainId],
          showQrModal: true,
          metadata: {
            name: 'VoiceSwap',
            description: 'Voice-activated crypto payments for AI glasses',
            url: 'https://voiceswap.cc',
            icons: ['https://voiceswap.cc/icon.png'],
          },
          rpcMap: {
            [UNICHAIN_CONFIG.chainId]: UNICHAIN_CONFIG.rpcUrl,
          },
        })

        setWcProvider(ethereumProvider)

        // Check if already connected
        if (ethereumProvider.connected) {
          const ethersProvider = new BrowserProvider(ethereumProvider)
          const accounts = await ethersProvider.listAccounts()
          if (accounts.length > 0) {
            setAddress(accounts[0].address)
            setProvider(ethersProvider)
            const signerInstance = await ethersProvider.getSigner()
            setSigner(signerInstance)
          }
        }

        // Listen for account changes
        ethereumProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
          } else {
            setAddress(null)
            setProvider(null)
            setSigner(null)
          }
        })

        // Listen for disconnect
        ethereumProvider.on('disconnect', () => {
          setAddress(null)
          setProvider(null)
          setSigner(null)
        })
      } catch (error) {
        console.error('Failed to initialize WalletConnect:', error)
      }
    }

    init()
  }, [])

  const connect = useCallback(async () => {
    if (!wcProvider) {
      console.error('WalletConnect provider not initialized')
      return
    }

    setIsConnecting(true)
    try {
      await wcProvider.connect()

      const ethersProvider = new BrowserProvider(wcProvider)
      const accounts = await ethersProvider.listAccounts()

      if (accounts.length > 0) {
        setAddress(accounts[0].address)
        setProvider(ethersProvider)
        const signerInstance = await ethersProvider.getSigner()
        setSigner(signerInstance)
      }
    } catch (error) {
      console.error('Failed to connect:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [wcProvider])

  const disconnect = useCallback(async () => {
    if (wcProvider) {
      await wcProvider.disconnect()
    }
    setAddress(null)
    setProvider(null)
    setSigner(null)
  }, [wcProvider])

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
        provider,
        signer,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
