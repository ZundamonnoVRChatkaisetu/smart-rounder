import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import {
  List,
  Switch,
  Divider,
  Text,
  Dialog,
  Portal,
  Button,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/feature/SettingsNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsList'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { notificationsEnabled, enableNotifications, disableNotifications } = useNotifications();
  
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [clearDataDialogVisible, setClearDataDialogVisible] = useState(false);
  
  // Get application version
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  
  // Handle theme toggle
  const handleThemeToggle = () => {
    toggleTheme();
  };
  
  // Handle notifications toggle
  const handleNotificationsToggle = async () => {
    if (notificationsEnabled) {
      await disableNotifications();
    } else {
      await enableNotifications();
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setLogoutDialogVisible(false);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };
  
  // Handle clear data
  const handleClearData = async () => {
    try {
      // Clear all app data except auth (user will need to log out separately)
      await AsyncStorage.clear();
      
      // Reset stores (would need to implement in actual app)
      // resetTaskStore();
      // resetNoteStore();
      // resetCalendarStore();
      // resetAlarmStore();
      
      Alert.alert(
        'Data Cleared',
        'All app data has been cleared successfully. The app will now restart.',
        [
          {
            text: 'OK',
            onPress: () => {
              // In a real app, we would restart the app here
              // For now, just navigate back to the root
              navigation.navigate('SettingsList');
            },
          },
        ]
      );
      
      setClearDataDialogVisible(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };
  
  // Open privacy policy
  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.example.com/privacy-policy');
  };
  
  // Open terms of service
  const openTermsOfService = () => {
    Linking.openURL('https://www.example.com/terms-of-service');
  };
  
  // Open app store for rating
  const rateApp = () => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/app/idXXXXXXXXXX?action=write-review',
      android: 'https://play.google.com/store/apps/details?id=com.smartrounder.app&showAllReviews=true',
      default: 'https://www.example.com',
    });
    
    Linking.openURL(url);
  };
  
  // Send feedback email
  const sendFeedback = () => {
    Linking.openURL('mailto:support@example.com?subject=Smart%20Rounder%20Feedback');
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Account Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Account</List.Subheader>
        
        <List.Item
          title={user?.username || 'User'}
          description={user?.email || 'Not signed in'}
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="account-circle" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={() => navigation.navigate('AccountSettings')}
        />
        
        <List.Item
          title="Sign Out"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="logout" size={size} color={theme.colors.error || '#F44336'} />
              )}
            />
          )}
          onPress={() => setLogoutDialogVisible(true)}
        />
      </List.Section>
      
      <Divider />
      
      {/* Appearance Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Appearance</List.Subheader>
        
        <List.Item
          title="Dark Mode"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name={isDarkMode ? "weather-night" : "weather-sunny"}
                  size={size}
                  color={theme.colors.primary}
                />
              )}
            />
          )}
          right={props => (
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Appearance Settings"
          description="Customize theme colors and fonts"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="color-lens" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={() => navigation.navigate('AppearanceSettings')}
        />
      </List.Section>
      
      <Divider />
      
      {/* Notifications Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Notifications</List.Subheader>
        
        <List.Item
          title="Enable Notifications"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="notifications" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          right={props => (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Notification Settings"
          description="Configure notification preferences"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="notifications-active" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
      </List.Section>
      
      <Divider />
      
      {/* Data & Sync Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Data & Sync</List.Subheader>
        
        <List.Item
          title="Sync Settings"
          description="Manage data synchronization"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="sync" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={() => navigation.navigate('SyncSettings')}
        />
        
        <List.Item
          title="Clear App Data"
          description="Reset all app data"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="delete-forever" size={size} color={theme.colors.error || '#F44336'} />
              )}
            />
          )}
          onPress={() => setClearDataDialogVisible(true)}
        />
      </List.Section>
      
      <Divider />
      
      {/* About & Support Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>About & Support</List.Subheader>
        
        <List.Item
          title="About Smart Rounder"
          description={`Version ${appVersion}`}
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="info" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={() => navigation.navigate('About')}
        />
        
        <List.Item
          title="Rate App"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="star" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={rateApp}
        />
        
        <List.Item
          title="Send Feedback"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="feedback" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={sendFeedback}
        />
        
        <List.Item
          title="Privacy Policy"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="privacy-tip" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={openPrivacyPolicy}
        />
        
        <List.Item
          title="Terms of Service"
          left={props => (
            <List.Icon
              {...props}
              icon={({ size, color }) => (
                <MaterialIcons name="description" size={size} color={theme.colors.primary} />
              )}
            />
          )}
          onPress={openTermsOfService}
        />
      </List.Section>
      
      {/* Dialogs */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.text }}>
              Are you sure you want to sign out? Your data will remain synced to your account.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleLogout} color={theme.colors.error || '#F44336'}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog
          visible={clearDataDialogVisible}
          onDismiss={() => setClearDataDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>Clear App Data</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.text }}>
              Are you sure you want to clear all app data? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDataDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleClearData} color={theme.colors.error || '#F44336'}>
              Clear Data
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;
