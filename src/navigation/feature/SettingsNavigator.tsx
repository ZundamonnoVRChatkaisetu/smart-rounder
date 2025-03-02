import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';

// Import screens
import SettingsScreen from '../../screens/settings/SettingsScreen';
import AccountSettingsScreen from '../../screens/settings/AccountSettingsScreen';
import NotificationSettingsScreen from '../../screens/settings/NotificationSettingsScreen';
import AppearanceSettingsScreen from '../../screens/settings/AppearanceSettingsScreen';
import SyncSettingsScreen from '../../screens/settings/SyncSettingsScreen';
import AboutScreen from '../../screens/settings/AboutScreen';

// Define the settings stack navigator param list
export type SettingsStackParamList = {
  SettingsList: undefined;
  AccountSettings: undefined;
  NotificationSettings: undefined;
  AppearanceSettings: undefined;
  SyncSettings: undefined;
  About: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsList"
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
        name="SettingsList"
        component={SettingsScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ 
          title: 'Account',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ 
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{ 
          title: 'Appearance',
        }}
      />
      <Stack.Screen
        name="SyncSettings"
        component={SyncSettingsScreen}
        options={{ 
          title: 'Sync',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ 
          title: 'About Smart Rounder',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
