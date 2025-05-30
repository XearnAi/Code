'use client'
import React, { useState, useEffect } from 'react';
import { TwitterData, UserData } from './utils/utils';
import { 
  useConnectWallet, 
  useCurrentWallet, 
  useWallets, 
  useDisconnectWallet 
} from '@mysten/dapp-kit';
import { TwitterAuth } from './TwitterAuth';

export function Header({ refreshTrigger, setTwitterData, twitterData, setUserData, userData }: { refreshTrigger: number, setTwitterData: (data: TwitterData | null) => void, twitterData: TwitterData | null, setUserData: (data: UserData | null) => void, userData: UserData | null  }) {
  const { currentWallet, isConnected } = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  const USER_STATE_URL = process.env.USER_STATE_URL || ''

  // 检查当前连接的是否为 Slush 钱包
  const isSlushWallet = currentWallet?.name?.toLowerCase().includes('slush');

  // 当钱包连接状态改变时获取用户数据和检查 Twitter 缓存
  useEffect(() => {
    if (isConnected && currentWallet?.accounts[0]?.address) {
      // 检查 Twitter 缓存
      const twitterToken = localStorage.getItem('twitterToken');
      if (twitterToken) {
        try {
          const data = JSON.parse(twitterToken);
          // 检查 token 是否过期
          if (data.expires > Date.now()) {
            setTwitterData(data);
          } else {
            // token 过期，清除数据并提示用户重新连接
            localStorage.removeItem('twitterToken');
            setTwitterData(null);
            alert('Twitter 授权已过期，请重新连接');
          }
        } catch (error) {
          console.error('解析 Twitter token 失败:', error);
          localStorage.removeItem('twitterToken');
          setTwitterData(null);
        }
      }
      // 获取用户数据
      fetchUserData(currentWallet.accounts[0].address);
    } else {
      setUserData(null);
      setTwitterData(null);
    }
  }, [isConnected, currentWallet]);

  useEffect(()=>{
    console.log("refreshTrigger",refreshTrigger)
      if(currentWallet?.accounts[0]?.address){
        fetchUserData(currentWallet.accounts[0].address)
    }
  },[refreshTrigger])

  // 模拟从API获取用户数据
  const fetchUserData = async (addr: string) => {
    try {
      const userStateResponse = await fetch(USER_STATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addr }),
      })

      if (!userStateResponse.ok) {
        throw new Error('获取 用户信息 失败')
      }

      const { data } = await userStateResponse.json()

      const uData: UserData = {
        points: data.user_point,
        completedTasks: data.task_count
      };
      
      setUserData(uData);
    } catch (error) {
      console.error('获取用户数据失败:', error);
    }
  };

  const handleConnect = async () => {
    // 精确匹配（假设 Slush 钱包的 name 包含 "Slush"）
    const slushWallet = wallets.find(wallet => 
      wallet.name.toLowerCase().includes('slush')
    );

    if (!slushWallet) {
      alert('未检测到 Slush 钱包，请确保已安装插件！');
      return;
    }

    try {
      await connect({ wallet: slushWallet, silent: false });
    } catch (error) {
      console.error('连接失败:', error);
      alert('连接失败，请查看控制台');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    // 清除 Twitter 数据
    localStorage.removeItem('twitterToken');
    setTwitterData(null);
  };

  const handleTwitterAuthSuccess = () => {
    // 重新检查 Twitter 缓存
    const twitterToken = localStorage.getItem('twitterToken');
    if (twitterToken) {
      try {
        const data = JSON.parse(twitterToken);
        setTwitterData(data);
        // 更新用户数据
        if (currentWallet?.accounts[0]?.address) {
          fetchUserData(currentWallet.accounts[0].address);
        }
      } catch (error) {
        console.error('解析 Twitter token 失败:', error);
      }
    }
  };

  const handleTwitterAuthError = (error: string) => {
    console.error('Twitter授权失败:', error);
    alert('Twitter授权失败，请重试');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo.png" alt="logo" className="w-10 h-10 mr-2" />
            <h1 className="text-2xl font-bold text-primary">X-Earn AI</h1>
            {isConnected && isSlushWallet && (
              <div className="ml-3 flex items-center">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full truncate max-w-[150px]">
                  {currentWallet?.accounts[0]?.address}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <>
                {/* 用户奖励信息 */}
                {userData && (
                  <div className="flex items-center space-x-3 mr-4">
                    <div className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 text-sm">
                      {userData.points} 积分
                    </div>
                    <div className="bg-green-100 px-3 py-1 rounded-full text-green-800 text-sm">
                      已完成 {userData.completedTasks} 任务
                    </div>
                  </div>
                )}

                {
                  twitterData ? (
                    <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      {twitterData.twitter_username}
                    </div>
                  ) : (
                    <TwitterAuth
                      onSuccess={handleTwitterAuthSuccess}
                      onError={handleTwitterAuthError}
                    />
                  )
                }

                <button
                  onClick={handleDisconnect}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                >
                  断开钱包
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                连接 Slush 钱包
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}