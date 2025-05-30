'use client'

import { useState, useEffect } from 'react'
import { TaskList } from './components/TaskList'
import { Header } from './components/Header'
import { useCurrentWallet } from '@mysten/dapp-kit'
import { TwitterData, UserData } from './components/utils/utils'

export default function Home() {
  const [twitterData, setTwitterData] = useState<TwitterData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { isConnected } = useCurrentWallet();
  const [refreshCount, setRefreshCount] = useState(0);

  const handleTaskComplete = () => {
    setRefreshCount(prev => prev + 1); // 触发刷新
  };

  return (
    <main className="min-h-screen bg-background">
      <Header refreshTrigger={refreshCount} setTwitterData={setTwitterData} twitterData={twitterData} setUserData={setUserData} userData={userData} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            完成任务赚取积分奖励
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8">
            {isConnected ? '选择任务开始完成' : '连接 Slush 钱包开始赚取积分'}
          </p>
        </div>
        <TaskList onTaskComplete={handleTaskComplete} twitterData={twitterData} />
      </div>
    </main>
  )
} 
