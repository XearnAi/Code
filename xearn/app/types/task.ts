export interface Task {
  id: string;
  title: string;
  description: string;
  reward: {
    amount: number;
    token: string;
  };
  requirements: {
    type: string;
    url: string;
  }[];
  status: 'active' | 'completed' | 'expired';
  participants: {
    total: number;
    completed: number;
  };
  deadline?: Date;
} 