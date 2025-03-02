import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';

// Import screens
import MoreScreen from '../../screens/more/MoreScreen';
import YoutubeScreen from '../../screens/more/YoutubeScreen';
import WebSearchScreen from '../../screens/more/WebSearchScreen';
import WeatherScreen from '../../screens/more/WeatherScreen';

// Define the more stack navigator param list
export type MoreStackParamList = {
  MoreList: undefined;
  Youtube: { url?: string };
  WebSearch: { query?: string };
  Weather: undefined;
};

const Stack = createStackNavigator<MoreStackParamList>();

const MoreNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="MoreList"
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
        name="MoreList"
        component={MoreScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Youtube"
        component={YoutubeScreen}
        options={{ 
          title: 'YouTube',
        }}
      />
      <Stack.Screen
        name="WebSearch"
        component={WebSearchScreen}
        options={{ 
          title: 'Web Search',
        }}
      />
      <Stack.Screen
        name="Weather"
        component={WeatherScreen}
        options={{ 
          title: 'Weather Forecast',
        }}
      />
    </Stack.Navigator>
  );
};

export default MoreNavigator;
