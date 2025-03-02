import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskCategory, TaskFilter, TaskSortOption } from '../models/Task';
import { useNotifications } from '../contexts/NotificationContext';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

interface TaskState {
  tasks: Task[];
  categories: TaskCategory[];
  isLoading: boolean;
  error: string | null;
  filter: TaskFilter;
  sortOption: TaskSortOption;
  
  // Task actions
  fetchTasks: (userId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (taskId: string, updatedTask: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  
  // Category actions
  fetchCategories: (userId: string) => Promise<void>;
  addCategory: (category: Omit<TaskCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TaskCategory>;
  updateCategory: (categoryId: string, updatedCategory: Partial<TaskCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  // Filter actions
  setFilter: (filter: TaskFilter) => void;
  setSortOption: (sortOption: TaskSortOption) => void;
  resetFilter: () => void;
}

// Helper function to open database
const getDatabase = () => {
  if (Platform.OS === 'web') {
    return {
      transaction: () => ({
        executeSql: () => {},
      }),
    };
  }
  return SQLite.openDatabase('smart_rounder.db');
};

// Initialize database tables
const initDatabase = () => {
  const db = getDatabase();
  
  // Create tasks table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER NOT NULL,
        dueDate TEXT,
        priority TEXT NOT NULL,
        categoryId TEXT,
        tags TEXT,
        remindAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL,
        repeatType TEXT,
        notificationId TEXT
      )`,
      [],
      () => console.log('Tasks table created successfully'),
      (_, error) => {
        console.error('Error creating tasks table:', error);
        return false;
      }
    );
  });
  
  // Create categories table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      [],
      () => console.log('Categories table created successfully'),
      (_, error) => {
        console.error('Error creating categories table:', error);
        return false;
      }
    );
  });
};

// Initialize database on store creation
initDatabase();

// Create task store
const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  categories: [],
  isLoading: false,
  error: null,
  filter: {},
  sortOption: 'dueDate-asc',
  
  // Task actions
  fetchTasks: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query tasks from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM tasks WHERE userId = ?',
          [userId],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              const task = rows.item(i);
              tasks.push({
                ...task,
                completed: task.completed === 1,
                tags: task.tags ? JSON.parse(task.tags) : [],
              });
            }
            set({ tasks, isLoading: false });
          },
          (_, error) => {
            set({ error: error.message, isLoading: false });
            return false;
          }
        );
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
  
  addTask: async (task) => {
    set({ isLoading: true, error: null });
    
    try {
      const taskId = Date.now().toString();
      const now = new Date().toISOString();
      const newTask: Task = {
        id: taskId,
        ...task,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Insert task into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO tasks (
              id, title, description, completed, dueDate, priority, 
              categoryId, tags, remindAt, createdAt, updatedAt, 
              userId, repeatType, notificationId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newTask.id,
              newTask.title,
              newTask.description || null,
              newTask.completed ? 1 : 0,
              newTask.dueDate || null,
              newTask.priority,
              newTask.categoryId || null,
              newTask.tags ? JSON.stringify(newTask.tags) : null,
              newTask.remindAt || null,
              newTask.createdAt,
              newTask.updatedAt,
              newTask.userId,
              newTask.repeatType || null,
              newTask.notificationId || null,
            ],
            () => {
              set(state => ({
                tasks: [...state.tasks, newTask],
                isLoading: false,
              }));
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
      
      return newTask;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateTask: async (taskId, updatedTask) => {
    set({ isLoading: true, error: null });
    
    try {
      const tasks = get().tasks;
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      
      const task = tasks[taskIndex];
      const now = new Date().toISOString();
      const updatedTaskData: Task = {
        ...task,
        ...updatedTask,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Update task in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedTask).forEach(([key, value]) => {
            if (key !== 'id') {
              updates.push(`${key} = ?`);
              
              if (key === 'completed') {
                values.push(value ? 1 : 0);
              } else if (key === 'tags' && Array.isArray(value)) {
                values.push(JSON.stringify(value));
              } else {
                values.push(value);
              }
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(taskId);
          
          tx.executeSql(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              const newTasks = [...tasks];
              newTasks[taskIndex] = updatedTaskData;
              
              set({
                tasks: newTasks,
                isLoading: false,
              });
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Delete task from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM tasks WHERE id = ?',
            [taskId],
            () => {
              set(state => ({
                tasks: state.tasks.filter(task => task.id !== taskId),
                isLoading: false,
              }));
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  toggleTaskCompletion: async (taskId) => {
    const tasks = get().tasks;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      await get().updateTask(taskId, { completed: !task.completed });
    }
  },
  
  // Category actions
  fetchCategories: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query categories from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM categories WHERE userId = ?',
          [userId],
          (_, { rows }) => {
            const categories: TaskCategory[] = [];
            for (let i = 0; i < rows.length; i++) {
              categories.push(rows.item(i));
            }
            set({ categories, isLoading: false });
          },
          (_, error) => {
            set({ error: error.message, isLoading: false });
            return false;
          }
        );
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
  
  addCategory: async (category) => {
    set({ isLoading: true, error: null });
    
    try {
      const categoryId = Date.now().toString();
      const now = new Date().toISOString();
      const newCategory: TaskCategory = {
        id: categoryId,
        ...category,
        createdAt: now,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Insert category into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO categories (
              id, name, color, icon, userId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              newCategory.id,
              newCategory.name,
              newCategory.color,
              newCategory.icon || null,
              newCategory.userId,
              newCategory.createdAt,
              newCategory.updatedAt,
            ],
            () => {
              set(state => ({
                categories: [...state.categories, newCategory],
                isLoading: false,
              }));
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
      
      return newCategory;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateCategory: async (categoryId, updatedCategory) => {
    set({ isLoading: true, error: null });
    
    try {
      const categories = get().categories;
      const categoryIndex = categories.findIndex(category => category.id === categoryId);
      
      if (categoryIndex === -1) {
        throw new Error('Category not found');
      }
      
      const category = categories[categoryIndex];
      const now = new Date().toISOString();
      const updatedCategoryData: TaskCategory = {
        ...category,
        ...updatedCategory,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Update category in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedCategory).forEach(([key, value]) => {
            if (key !== 'id') {
              updates.push(`${key} = ?`);
              values.push(value);
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(categoryId);
          
          tx.executeSql(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              const newCategories = [...categories];
              newCategories[categoryIndex] = updatedCategoryData;
              
              set({
                categories: newCategories,
                isLoading: false,
              });
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  deleteCategory: async (categoryId) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Delete category from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM categories WHERE id = ?',
            [categoryId],
            () => {
              // Remove category from tasks
              tx.executeSql(
                'UPDATE tasks SET categoryId = NULL WHERE categoryId = ?',
                [categoryId],
                () => {
                  set(state => ({
                    categories: state.categories.filter(category => category.id !== categoryId),
                    tasks: state.tasks.map(task => 
                      task.categoryId === categoryId 
                        ? { ...task, categoryId: undefined } 
                        : task
                    ),
                    isLoading: false,
                  }));
                  resolve();
                },
                (_, error) => {
                  set({
                    error: error.message,
                    isLoading: false,
                  });
                  reject(error);
                  return false;
                }
              );
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  // Filter actions
  setFilter: (filter) => {
    set(state => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    }));
  },
  
  setSortOption: (sortOption) => {
    set({ sortOption });
  },
  
  resetFilter: () => {
    set({ filter: {} });
  },
}));

export default useTaskStore;
