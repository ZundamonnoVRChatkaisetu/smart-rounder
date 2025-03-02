import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5, 
  Feather 
} from '@expo/vector-icons';

// Import screens or navigators for each feature
import TasksNavigator from './feature/TasksNavigator';
import NotesNavigator from './feature/NotesNavigator';
import CalendarNavigator from './feature/CalendarNavigator';
import AlarmNavigator from './feature/AlarmNavigator';
import SettingsNavigator from './feature/SettingsNavigator';
import MoreNavigator from './feature/MoreNavigator';

// Define the main tab navigator param list
export type MainTabParamList = {
  Tasks: undefined;
  Notes: undefined;
  Calendar: undefined;
  Alarms: undefined;
  Settings: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Tasks"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Tasks',
          headerTitle: 'My Tasks',
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="note-text-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Notes',
          headerTitle: 'My Notes',
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Calendar',
          headerTitle: 'Calendar',
        }}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alarm-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Alarms',
          headerTitle: 'My Alarms',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Settings',
          headerTitle: 'Settings',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="more-horizontal" size={size} color={color} />
          ),
          tabBarLabel: 'More',
          headerTitle: 'More Features',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
