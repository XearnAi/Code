import { Task } from '../types/task';

export const mockTasks: Task[] = [
  {
    id: '1',
    title: '关注并转发推文赢取SUI代币',
    description: '关注@WalrusApp账号，点赞并转发指定推文，即可获得10 SUI代币奖励！',
    reward: {
      amount: 10,
      token: 'SUI'
    },
    requirements: [
      {
        type: 'follow',
        url: 'https://twitter.com/WalrusApp'
      },
      {
        type: 'like',
        url: 'https://twitter.com/WalrusApp/status/123456789'
      },
      {
        type: 'retweet',
        url: 'https://twitter.com/WalrusApp/status/123456789'
      }
    ],
    status: 'active',
    participants: {
      total: 100,
      completed: 45
    },
    deadline: new Date('2024-04-30')
  },
  {
    id: '2',
    title: '点赞转发赢取SUI代币',
    description: '点赞并转发指定推文，即可获得5 SUI代币奖励！',
    reward: {
      amount: 5,
      token: 'SUI'
    },
    requirements: [
      {
        type: 'like',
        url: 'https://twitter.com/WalrusApp/status/987654321'
      },
      {
        type: 'retweet',
        url: 'https://twitter.com/WalrusApp/status/987654321'
      }
    ],
    status: 'active',
    participants: {
      total: 200,
      completed: 89
    }
  }
]; 