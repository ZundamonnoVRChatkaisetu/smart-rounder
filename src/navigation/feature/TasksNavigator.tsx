import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';

// Import screens
import TasksScreen from '../../screens/tasks/TasksScreen';
import TaskDetailScreen from '../../screens/tasks/TaskDetailScreen';
import CreateTaskScreen from '../../screens/tasks/CreateTaskScreen';
import TaskCategoriesScreen from '../../screens/tasks/TaskCategoriesScreen';
import TaskSearchScreen from '../../screens/tasks/TaskSearchScreen';

// Define the tasks stack navigator param list
export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: { categoryId?: string; dueDate?: string };
  TaskCategories: undefined;
  TaskSearch: undefined;
};

const Stack = createStackNavigator<TasksStackParamList>();

const TasksNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="TasksList"
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="TasksList"
        component={TasksScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ 
          title: 'Task Details',
        }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ 
          title: 'New Task',
        }}
      />
      <Stack.Screen
        name="TaskCategories"
        component={TaskCategoriesScreen}
        options={{ 
          title: 'Categories',
        }}
      />
      <Stack.Screen
        name="TaskSearch"
        component={TaskSearchScreen}
        options={{ 
          title: 'Search Tasks',
        }}
      />
    </Stack.Navigator>
  );
};

export default TasksNavigator;
