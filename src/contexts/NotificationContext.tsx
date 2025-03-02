import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextData {
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  scheduleTaskNotification: (
    title: string,
    body: string,
    data: any,
    trigger: Notifications.NotificationTriggerInput
  ) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NOTIFICATIONS_ENABLED_KEY = 'smartrounder_notifications_enabled';

const NotificationContext = createContext<NotificationContextData>({
  notificationsEnabled: false,
  enableNotifications: async () => false,
  disableNotifications: async () => {},
  scheduleTaskNotification: async () => '',
  cancelNotification: async () => {},
  requestPermissions: async () => false,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Load notification preferences
    const loadNotificationPreference = async () => {
      try {
        const preference = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        setNotificationsEnabled(preference === 'true');
      } catch (error) {
        console.error('Failed to load notification preference:', error);
      }
    };

    loadNotificationPreference();
  }, []);

  // Request permission for notifications
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false; // Web doesn't support notifications in the same way
    }

    if (!Device.isDevice) {
      alert('Notifications are not supported in the simulator/emulator');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for notifications!');
      return false;
    }

    return true;
  };

  // Enable notifications
  const enableNotifications = async (): Promise<boolean> => {
    try {
      const permissionsGranted = await requestPermissions();
      
      if (permissionsGranted) {
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
        setNotificationsEnabled(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  };

  // Disable notifications
  const disableNotifications = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setNotificationsEnabled(false);
      
      // Cancel all pending notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  };

  // Schedule a task notification
  const scheduleTaskNotification = async (
    title: string,
    body: string,
    data: any,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    if (!notificationsEnabled) {
      return '';
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return '';
    }
  };

  // Cancel a specific notification
  const cancelNotification = async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        enableNotifications,
        disableNotifications,
        scheduleTaskNotification,
        cancelNotification,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);
