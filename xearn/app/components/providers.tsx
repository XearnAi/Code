'use client'

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getFullnodeUrl } from '@mysten/sui.js/client'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{
        devnet: { url: getFullnodeUrl('devnet') },
        mainnet: { url: getFullnodeUrl('mainnet') },
      }}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
} 