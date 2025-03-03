import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  List,
  Switch,
  Divider,
  Text,
  RadioButton,
  Subheading,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/feature/SettingsNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotificationSettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'NotificationSettings'>;

const NOTIF_TASKS_KEY = 'notifications_tasks';
const NOTIF_CALENDAR_KEY = 'notifications_calendar';
const NOTIF_ALARMS_KEY = 'notifications_alarms';
const NOTIF_WEATHER_KEY = 'notifications_weather';
const NOTIF_DEFAULT_REMINDER_KEY = 'notifications_default_reminder';

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { notificationsEnabled, enableNotifications, disableNotifications } = useNotifications();
  
  // Notification preferences states
  const [tasksEnabled, setTasksEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [defaultReminder, setDefaultReminder] = useState('30min');
  
  // Load notification preferences
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const tasksValue = await AsyncStorage.getItem(NOTIF_TASKS_KEY);
        const calendarValue = await AsyncStorage.getItem(NOTIF_CALENDAR_KEY);
        const alarmsValue = await AsyncStorage.getItem(NOTIF_ALARMS_KEY);
        const weatherValue = await AsyncStorage.getItem(NOTIF_WEATHER_KEY);
        const reminderValue = await AsyncStorage.getItem(NOTIF_DEFAULT_REMINDER_KEY);
        
        setTasksEnabled(tasksValue !== 'false');
        setCalendarEnabled(calendarValue !== 'false');
        setAlarmsEnabled(alarmsValue !== 'false');
        setWeatherEnabled(weatherValue !== 'false');
        setDefaultReminder(reminderValue || '30min');
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Save notification preferences
  const savePreference = async (key: string, value: boolean | string) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Failed to save ${key} preference:`, error);
    }
  };
  
  // Handle main notification toggle
  const handleNotificationToggle = async () => {
    try {
      if (notificationsEnabled) {
        await disableNotifications();
      } else {
        const enabled = await enableNotifications();
        if (!enabled) {
          Alert.alert(
            'Notifications Permission',
            'Please enable notifications in your device settings to receive alerts for tasks and events.'
          );
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };
  
  // Handle tasks notifications toggle
  const handleTasksToggle = (value: boolean) => {
    setTasksEnabled(value);
    savePreference(NOTIF_TASKS_KEY, value);
  };
  
  // Handle calendar notifications toggle
  const handleCalendarToggle = (value: boolean) => {
    setCalendarEnabled(value);
    savePreference(NOTIF_CALENDAR_KEY, value);
  };
  
  // Handle alarms notifications toggle
  const handleAlarmsToggle = (value: boolean) => {
    setAlarmsEnabled(value);
    savePreference(NOTIF_ALARMS_KEY, value);
  };
  
  // Handle weather notifications toggle
  const handleWeatherToggle = (value: boolean) => {
    setWeatherEnabled(value);
    savePreference(NOTIF_WEATHER_KEY, value);
  };
  
  // Handle default reminder change
  const handleDefaultReminderChange = (value: string) => {
    setDefaultReminder(value);
    savePreference(NOTIF_DEFAULT_REMINDER_KEY, value);
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Notification Settings
        </Text>
        
        <List.Item
          title="Enable Notifications"
          description="Turn all notifications on or off"
          left={props => (
            <List.Icon
              {...props}
              icon="bell-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.divider} />
        
        <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
          Notification Types
        </Text>
        
        <List.Item
          title="Task Reminders"
          description="Notifications for upcoming tasks and deadlines"
          left={props => (
            <List.Icon
              {...props}
              icon="checkbox-marked-circle-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={tasksEnabled && notificationsEnabled}
              onValueChange={handleTasksToggle}
              color={theme.colors.primary}
              disabled={!notificationsEnabled}
            />
          )}
        />
        
        <List.Item
          title="Calendar Events"
          description="Reminders for scheduled events"
          left={props => (
            <List.Icon
              {...props}
              icon="calendar-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={calendarEnabled && notificationsEnabled}
              onValueChange={handleCalendarToggle}
              color={theme.colors.primary}
              disabled={!notificationsEnabled}
            />
          )}
        />
        
        <List.Item
          title="Alarms"
          description="Sound and notification alerts for alarms"
          left={props => (
            <List.Icon
              {...props}
              icon="alarm-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={alarmsEnabled && notificationsEnabled}
              onValueChange={handleAlarmsToggle}
              color={theme.colors.primary}
              disabled={!notificationsEnabled}
            />
          )}
        />
        
        <List.Item
          title="Weather Alerts"
          description="Notifications for severe weather warnings"
          left={props => (
            <List.Icon
              {...props}
              icon="weather-lightning-rainy"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={weatherEnabled && notificationsEnabled}
              onValueChange={handleWeatherToggle}
              color={theme.colors.primary}
              disabled={!notificationsEnabled}
            />
          )}
        />
        
        <Divider style={styles.divider} />
        
        <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
          Default Reminder Time
        </Text>
        
        <View style={styles.radioGroup}>
          <RadioButton.Group
            onValueChange={handleDefaultReminderChange}
            value={defaultReminder}
          >
            <RadioButton.Item
              label="10 minutes before"
              value="10min"
              disabled={!notificationsEnabled}
              labelStyle={{ color: theme.colors.text }}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.text + '80'}
            />
            <RadioButton.Item
              label="30 minutes before"
              value="30min"
              disabled={!notificationsEnabled}
              labelStyle={{ color: theme.colors.text }}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.text + '80'}
            />
            <RadioButton.Item
              label="1 hour before"
              value="1hour"
              disabled={!notificationsEnabled}
              labelStyle={{ color: theme.colors.text }}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.text + '80'}
            />
            <RadioButton.Item
              label="1 day before"
              value="1day"
              disabled={!notificationsEnabled}
              labelStyle={{ color: theme.colors.text }}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.text + '80'}
            />
          </RadioButton.Group>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  radioGroup: {
    marginTop: 8,
  },
});

export default NotificationSettingsScreen;
