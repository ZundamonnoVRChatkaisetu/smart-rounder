export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // ISO format date string
  priority: 'low' | 'medium' | 'high';
  categoryId?: string;
  tags?: string[];
  remindAt?: string; // ISO format date string for reminder
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
  userId: string;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  notificationId?: string; // ID for scheduled notification
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskFilter = {
  categoryId?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  search?: string;
  tags?: string[];
};

export type TaskSortOption = 
  | 'dueDate-asc' 
  | 'dueDate-desc' 
  | 'priority-asc' 
  | 'priority-desc'
  | 'title-asc'
  | 'title-desc'
  | 'createdAt-asc'
  | 'createdAt-desc';
