'use client'

import { WalletProvider, SuiClientProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { registerSlushWallet } from '@mysten/slush-wallet'

// 注册 Slush 钱包
registerSlushWallet('X-Earn AI')

// 创建 Sui 客户端配置
const networks = {
  testnet: { url: getFullnodeUrl('testnet') }
}

export function Web3Modal({ children }: { children: React.ReactNode }) {
  return (
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider autoConnect >
        {children}
      </WalletProvider>
    </SuiClientProvider>
  )
} 