'use client'

import { useState } from 'react'
import { useCurrentWallet } from '@mysten/dapp-kit'

interface TwitterAuthProps {
  onSuccess: () => void
  onError: (error: string) => void
}

export function TwitterAuth({ onSuccess, onError }: TwitterAuthProps) {
  const { currentWallet } = useCurrentWallet()
  const [isLoading, setIsLoading] = useState(false)

  const generateState = () => {
    const array = new Uint32Array(8)
    window.crypto.getRandomValues(array)
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('')
  }

  const handleTwitterAuth = async () => {
    if (!currentWallet) {
      onError('请先连接钱包')
      return
    }

    setIsLoading(true)
    try {
      // 生成并保存 state
      const state = generateState()
      localStorage.setItem('twitterState', state)

      // 构建 Twitter 授权 URL
      const clientId = process.env.TWITTER_CLIENT_ID
      const redirectUri = `${window.location.origin}/twitter/authorize.html`
      const scope = 'tweet.read users.read follows.read follows.write'
      
      const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge=challenge&code_challenge_method=plain`

      // 打开 Twitter 授权页面
      const width = 600
      const height = 600
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const authWindow = window.open(
        authUrl,
        'Twitter Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // 监听消息事件，接收授权结果
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage)
          onSuccess()
        } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage)
          onError(event.data.error)
        }
      }

      window.addEventListener('message', handleMessage)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Twitter 授权失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleTwitterAuth}
      disabled={isLoading}
      // className="flex items-center justify-center w-full py-2 px-4 bg-[#1DA1F2] text-white rounded-md hover:bg-[#1a8cd8] transition-colors disabled:opacity-50"
      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )}
      {isLoading ? '授权中...' : 'Twitter 授权'}
    </button>
  )
} 