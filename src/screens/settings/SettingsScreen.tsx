import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  List,
  Switch,
  Divider,
  Text,
  Avatar,
  Button,
  Dialog,
  Portal,
  Paragraph,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/feature/SettingsNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsList'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { notificationsEnabled, enableNotifications, disableNotifications } = useNotifications();
  
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [deleteAccountDialogVisible, setDeleteAccountDialogVisible] = useState(false);
  
  // Handle notification toggle
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
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setLogoutDialogVisible(false);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    // This would actually delete the user account
    // For now, just show a message and close the dialog
    Alert.alert('Not Implemented', 'Account deletion is not implemented in this demo');
    setDeleteAccountDialogVisible(false);
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {user && (
        <View style={styles.profileSection}>
          <Avatar.Text
            size={80}
            label={user.username.substring(0, 2).toUpperCase()}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: theme.colors.text }]}>
              {user.username}
            </Text>
            <Text style={[styles.email, { color: theme.colors.text + 'CC' }]}>
              {user.email}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          App Settings
        </Text>
        
        <List.Item
          title="Dark Mode"
          description="Toggle between light and dark themes"
          left={props => (
            <List.Icon
              {...props}
              icon={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Notifications"
          description="Enable notifications for tasks and events"
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
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        
        <List.Item
          title="Appearance"
          description="Customize app appearance and themes"
          left={props => (
            <List.Icon
              {...props}
              icon="palette-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.text + '80'}
            />
          )}
          onPress={() => navigation.navigate('AppearanceSettings')}
        />
        
        <List.Item
          title="Sync Settings"
          description="Manage data synchronization"
          left={props => (
            <List.Icon
              {...props}
              icon="sync"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.text + '80'}
            />
          )}
          onPress={() => navigation.navigate('SyncSettings')}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Account
        </Text>
        
        <List.Item
          title="Account Settings"
          description="Manage your account details"
          left={props => (
            <List.Icon
              {...props}
              icon="account-cog-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.text + '80'}
            />
          )}
          onPress={() => navigation.navigate('AccountSettings')}
        />
        
        <List.Item
          title="Sign Out"
          description="Sign out of your account"
          left={props => (
            <List.Icon
              {...props}
              icon="logout"
              color={theme.colors.primary}
            />
          )}
          onPress={() => setLogoutDialogVisible(true)}
        />
        
        <List.Item
          title="Delete Account"
          description="Permanently delete your account and data"
          left={props => (
            <List.Icon
              {...props}
              icon="delete-outline"
              color="red"
            />
          )}
          onPress={() => setDeleteAccountDialogVisible(true)}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          About
        </Text>
        
        <List.Item
          title="About Smart Rounder"
          description="Learn more about the app"
          left={props => (
            <List.Icon
              {...props}
              icon="information-outline"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.text + '80'}
            />
          )}
          onPress={() => navigation.navigate('About')}
        />
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.text + '99' }]}>
            Version 1.0.0
          </Text>
        </View>
      </View>
      
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            Sign Out
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.text }}>
              Are you sure you want to sign out?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleLogout}>Sign Out</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog
          visible={deleteAccountDialogVisible}
          onDismiss={() => setDeleteAccountDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            Delete Account
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.text }}>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteAccountDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteAccount} color="red">Delete</Button>
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
  contentContainer: {
    paddingBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
  },
});

export default SettingsScreen;
