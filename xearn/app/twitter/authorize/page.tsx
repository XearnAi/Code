'use client'

import { useEffect, useState } from 'react'
import { useCurrentWallet } from '@mysten/dapp-kit'

export default function TwitterAuthorize() {
  const { currentWallet,isConnected } = useCurrentWallet()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const TWITTER_AUTHORIZE_URL = process.env.TWITTER_AUTHORIZE_URL || ''

  useEffect(() => {
    const handleAuthorization = async () => {
      try {
        // 如果钱包还在加载，直接返回
        if (!isConnected) return

        // 获取 URL 参数
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')

        if (!code || !state) {
          throw new Error('缺少必要的参数')
        }

        // 获取本地保存的 state
        const savedState = localStorage.getItem('twitterState')
        if (!savedState || savedState !== state) {
          throw new Error('State 验证失败')
        }

        // 获取钱包地址
        const addr = currentWallet?.accounts[0]?.address
        if (!addr) {
          throw new Error('请先连接钱包')
        }

        // 获取授权 token
        const tokenResponse = await fetch(TWITTER_AUTHORIZE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, addr }),
        })

        if (!tokenResponse.ok) {
          throw new Error('获取 token 失败')
        }

        const { data } = await tokenResponse.json()

        // 存储数据时记录时间
        const token_data = {
          twitter_username: data.twitter_username,
          twitter_id: data.twitter_id,
          token: data.access_token,
          expires: Date.now() + (data.expires_in * 1000)
        }
        
        localStorage.setItem('twitterToken', JSON.stringify(token_data))

        // 通知父窗口授权成功并关闭
        window.opener?.postMessage({ type: 'TWITTER_AUTH_SUCCESS' }, '*')
        window.close()
      } catch (err) {
        console.log("err：", err)
        // 直接发送错误消息并关闭
        window.opener?.postMessage({ 
          type: 'TWITTER_AUTH_ERROR',
          error: err instanceof Error ? err.message : '授权失败'
        }, '*')
        window.close()
      }
    }

    handleAuthorization()
  }, [currentWallet])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">正在处理授权...</p>
      </div>
    </div>
  )
} 