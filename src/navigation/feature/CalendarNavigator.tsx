import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';

// Import screens
import CalendarScreen from '../../screens/calendar/CalendarScreen';
import EventDetailScreen from '../../screens/calendar/EventDetailScreen';
import CreateEventScreen from '../../screens/calendar/CreateEventScreen';
import CalendarSettingsScreen from '../../screens/calendar/CalendarSettingsScreen';

// Define the calendar stack navigator param list
export type CalendarStackParamList = {
  CalendarMain: undefined;
  EventDetail: { eventId: string };
  CreateEvent: { date?: string };
  CalendarSettings: undefined;
};

const Stack = createStackNavigator<CalendarStackParamList>();

const CalendarNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="CalendarMain"
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
        name="CalendarMain"
        component={CalendarScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ 
          title: 'Event Details',
        }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ 
          title: 'New Event',
        }}
      />
      <Stack.Screen
        name="CalendarSettings"
        component={CalendarSettingsScreen}
        options={{ 
          title: 'Calendar Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default CalendarNavigator;
