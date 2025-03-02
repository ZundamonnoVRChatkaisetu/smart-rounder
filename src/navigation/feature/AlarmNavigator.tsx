import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';

// Import screens
import AlarmScreen from '../../screens/alarm/AlarmScreen';
import CreateAlarmScreen from '../../screens/alarm/CreateAlarmScreen';
import AlarmDetailScreen from '../../screens/alarm/AlarmDetailScreen';
import AlarmSoundsScreen from '../../screens/alarm/AlarmSoundsScreen';

// Define the alarm stack navigator param list
export type AlarmStackParamList = {
  AlarmList: undefined;
  CreateAlarm: undefined;
  AlarmDetail: { alarmId: string };
  AlarmSounds: { selectedSound?: string; onSelect: (sound: string) => void };
};

const Stack = createStackNavigator<AlarmStackParamList>();

const AlarmNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="AlarmList"
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
        name="AlarmList"
        component={AlarmScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateAlarm"
        component={CreateAlarmScreen}
        options={{ 
          title: 'New Alarm',
        }}
      />
      <Stack.Screen
        name="AlarmDetail"
        component={AlarmDetailScreen}
        options={{ 
          title: 'Alarm Details',
        }}
      />
      <Stack.Screen
        name="AlarmSounds"
        component={AlarmSoundsScreen}
        options={{ 
          title: 'Alarm Sounds',
        }}
      />
    </Stack.Navigator>
  );
};

export default AlarmNavigator;
