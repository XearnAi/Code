'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Web3Modal } from './components/Web3Modal'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Modal>{children}</Web3Modal>
    </QueryClientProvider>
  )
} 