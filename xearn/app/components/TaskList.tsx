'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useCurrentWallet } from '@mysten/dapp-kit'
import { TwitterAuth } from './TwitterAuth'
import { TwitterData } from './utils/utils'

type Task = {
  id: number
  title: string
  bg_img:string
  description: string
  url: string
  points: number
  type: string
  status: string
}

interface TaskListProps {
  initialTasks: Task[]
}

// 每页加载的任务数量
const PAGE_SIZE = 10;

export function TaskList({ onTaskComplete, twitterData }: { onTaskComplete: () => void, twitterData: TwitterData | null  }) {

  const [initialTasks,setInitialTasks]=useState<Task[]>([])
  const { currentWallet,isConnected } = useCurrentWallet();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [showWalletAlert, setShowWalletAlert] = useState(false);
  
  // 分页和加载状态
  const [currentStatus, setCurrentStatus] = useState<'ongoing' | 'completed' | 'expired'>('ongoing');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // 创建观察器的目标元素引用
  const observerTarget = useRef<HTMLDivElement>(null);


  const TASKS_URL = process.env.TASKS_URL || ''
  const COMPLETING_TASK_URL = process.env.COMPLETING_TASK_URL || ''

  // 获取任务列表
  const fetchTasks = async (status: string, pageNum: number, isNewQuery: boolean = false) => {
    try {
      setLoading(true);
      
      // 这里替换为实际的API调用
      let state=0
      if(status==='ongoing'){
        state=0
      }else if(status==='completed'){
        state=1
      }else if(status==='expired'){
        state=2
      }
      const pageSize=PAGE_SIZE
      let addr=""
      if(currentWallet){
        addr=currentWallet.accounts[0].address
      }
      if (pageNum==1){
        setPage(1)
      }

      const tasksResponse = await fetch(TASKS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state,page:pageNum,pageSize,addr }),
      })

      if (!tasksResponse.ok) {
        throw new Error('获取 任务 失败')
      }
      const { data } = await tasksResponse.json()
      
      // 假设API返回格式为 { tasks: Task[], hasMore: boolean }
      const newTasks = data || [];

      //begin
      setTasks(prevTasks => {
        if (isNewQuery) return newTasks;
        
        // 创建ID映射表提高查找性能
        const idMap = new Map();
        prevTasks.forEach(task => idMap.set(task.id, true));
        
        // 过滤新任务
        const filteredNewTasks = newTasks.filter((task: Task) => !idMap.has(task.id));
        
        return filteredNewTasks.length > 0 
          ? [...prevTasks, ...filteredNewTasks]
          : prevTasks;
      });
      //end
      
      //setTasks(prevTasks => isNewQuery ? newTasks : [...prevTasks, ...newTasks]);

      setHasMore(data.length===PAGE_SIZE);
      setLoading(false);
    } catch (error) {
      console.error('获取任务失败:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if(twitterData!=null){
      setShowWalletAlert(false)
    }
  }, [twitterData])

    // 初始加载和状态改变时加载任务
    useEffect(() => {
      setPage(1);
      console.log("初始加载",isConnected,currentStatus)
      fetchTasks(currentStatus, 1, true);
    }, [isConnected,currentStatus]);


  // 处理加载更多
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    console.log("加载更多")
    fetchTasks(currentStatus, nextPage, false);
  }, [loading, hasMore, page, currentStatus]);

  // 设置 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  // 处理状态改变
  const handleStatusChange = (status: 'ongoing' | 'completed' | 'expired') => {
    setCurrentStatus(status);
    setTasks([]); // 清空当前任务列表
    setHasMore(true); // 重置hasMore状态
    setPage(1); // 重置页码
  };

  // 创建一个返回Promise的延迟函数
  const randomDelay=()=>{
    const delay = Math.random() * 1000 + 1000; // 1000-2000毫秒
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // 完成任务后刷新列表
  const completeTask = async (task_id: number) => {
    if (!isConnected || twitterData==null) {
      setShowWalletAlert(true);
      return;
    }
    let addr=""
    if(currentWallet){
        addr=currentWallet.accounts[0].address
    }

    let token = twitterData?.token

    const task = tasks.find(t => t.id === task_id);
    if (!task) {
      console.log("没有任务")
      return;
    }

    setCompletingTask(task_id);
    
    try {
      // 调用完成任务的API
      const completing_task_response = await fetch(COMPLETING_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id,addr,token }),
      });
      
      if (completing_task_response.ok) {
        const { data } = await completing_task_response.json()
        if(data){
          await randomDelay();
          // 刷新当前状态的任务列表
          setTasks([]);
          setPage(1);
          console.log("刷新任务列表")
          fetchTasks(currentStatus, 1, true);
          onTaskComplete()
        }
        else{
          throw new Error('任务失败');
        } 
      } else {
        throw new Error('任务失败');
      }
    } catch (error) {
      console.error('任务失败:', error);
      alert('任务失败，请重试');
    } finally {
      setCompletingTask(null);
    }
  };

  return (
    <div>
      {showWalletAlert && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {isConnected ? "请先连接 Twitter 才能完成任务和获得积分" : "请先连接 Slush 钱包才能完成任务和获得积分"}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                  onClick={() => setShowWalletAlert(false)}
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 状态筛选按钮 */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${
            currentStatus === 'ongoing'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleStatusChange('ongoing')}
        >
          进行中
        </button>
        {isConnected && (
        <button
          className={`px-4 py-2 rounded-md ${
            currentStatus === 'completed'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleStatusChange('completed')}
        >
          已完成
        </button>)}

        <button
          className={`px-4 py-2 rounded-md ${
            currentStatus === 'expired'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleStatusChange('expired')}
        >
          已结束
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(tasks || []).map((task) => (
          <div className="flex flex-col">
            <img src={task.bg_img} className="w-full h-40 object-cover rounded-t-lg" />
          <div
            key={task.id}
            className="bg-white rounded-b-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-2">
              {task.type === 'twitter' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              )}
              <h3 className="text-xl font-semibold cursor-pointer" onClick={() => window.open(task.url, '_blank')}>{task.title}</h3>
            </div>
            
            <p className="text-gray-600 mb-4">{task.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary font-bold">{task.points} 积分</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                task.status === 'completed' || task.status === 'expired'
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {task.status === 'completed' ? '已完成' : task.status === 'expired' ? '已结束' : '待完成'}
              </span>
            </div>
            
            <div className="mt-4">
            <button 
                  className={`w-full py-2 rounded-md ${
                    task.status === 'completed' || task.status === 'expired'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark transition-colors'
                  }`}
                  onClick={() => task.status !== 'completed' && task.status !== 'expired' && completeTask(task.id)}
                  disabled={task.status === 'completed' || completingTask === task.id}
                >
                  {completingTask === task.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </span>
                  ) : task.status === 'completed' ? (
                    '已完成'
                  ) : task.status === 'expired' ? (
                    '已结束'
                  ) : (
                    '完成任务'
                  )}
                </button>
            </div>
          </div>
          </div>
        ))}
      </div>

      {/* 加载更多指示器 */}
      <div 
        ref={observerTarget} 
        className="w-full py-4 flex justify-center"
      >
        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-gray-500">加载更多...</span>
          </div>
        )}
        {!loading && !hasMore && (tasks || []).length > 0 && (
          <span className="text-gray-500">没有更多任务了</span>
        )}
        {!loading && (tasks || []).length === 0 && (
          <span className="text-gray-500">暂无任务</span>
        )}
      </div>
    </div>
  )
} 