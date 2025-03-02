import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme, DarkTheme as PaperDarkTheme } from 'react-native-paper';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        setIsDarkMode(themePreference === 'dark');
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    // Initialize app resources
    const prepareApp = async () => {
      try {
        await loadThemePreference();
        // Any other initialization can go here
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  // Define theme to be used based on preference
  const theme = isDarkMode ? PaperDarkTheme : DefaultTheme;

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <NavigationContainer theme={theme}>
                <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                <RootNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// Register the root component
registerRootComponent(App);
