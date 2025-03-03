import React, { useState, useEffect } from 'react';
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
  Button,
  useTheme as usePaperTheme,
  RadioButton,
  Dialog,
  Portal,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/feature/SettingsNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SyncSettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SyncSettings'>;

// Storage keys for settings
const SYNC_ENABLED_KEY = 'sync_enabled';
const SYNC_INTERVAL_KEY = 'sync_interval';
const SYNC_WIFI_ONLY_KEY = 'sync_wifi_only';
const LAST_SYNC_KEY = 'last_sync_time';

const SyncSettingsScreen: React.FC = () => {
  const navigation = useNavigation<SyncSettingsScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  
  // Sync settings
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState('15min');
  const [syncWifiOnly, setSyncWifiOnly] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // UI states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDialogVisible, setSyncDialogVisible] = useState(false);
  
  // Load sync settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const enabledValue = await AsyncStorage.getItem(SYNC_ENABLED_KEY);
        const intervalValue = await AsyncStorage.getItem(SYNC_INTERVAL_KEY);
        const wifiOnlyValue = await AsyncStorage.getItem(SYNC_WIFI_ONLY_KEY);
        const lastSyncValue = await AsyncStorage.getItem(LAST_SYNC_KEY);
        
        setSyncEnabled(enabledValue !== 'false');
        if (intervalValue) setSyncInterval(intervalValue);
        setSyncWifiOnly(wifiOnlyValue === 'true');
        setLastSyncTime(lastSyncValue);
      } catch (error) {
        console.error('Failed to load sync settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save sync settings
  const saveSettings = async (key: string, value: boolean | string) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Failed to save ${key} setting:`, error);
    }
  };
  
  // Handle sync toggle
  const handleSyncToggle = (value: boolean) => {
    setSyncEnabled(value);
    saveSettings(SYNC_ENABLED_KEY, value);
  };
  
  // Handle sync interval change
  const handleIntervalChange = (value: string) => {
    setSyncInterval(value);
    saveSettings(SYNC_INTERVAL_KEY, value);
  };
  
  // Handle wifi only toggle
  const handleWifiOnlyToggle = (value: boolean) => {
    setSyncWifiOnly(value);
    saveSettings(SYNC_WIFI_ONLY_KEY, value);
  };
  
  // Format sync interval for display
  const formatSyncInterval = (interval: string): string => {
    switch (interval) {
      case '5min':
        return 'Every 5 minutes';
      case '15min':
        return 'Every 15 minutes';
      case '30min':
        return 'Every 30 minutes';
      case '1hour':
        return 'Every hour';
      case '6hour':
        return 'Every 6 hours';
      case '1day':
        return 'Once a day';
      default:
        return 'Every 15 minutes';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Sync now
  const syncNow = async () => {
    setIsSyncing(true);
    setSyncDialogVisible(false);
    
    // Simulate sync process
    setTimeout(async () => {
      const now = new Date().toISOString();
      
      try {
        await AsyncStorage.setItem(LAST_SYNC_KEY, now);
        setLastSyncTime(now);
        
        setIsSyncing(false);
        Alert.alert('Sync Complete', 'Your data has been successfully synchronized');
      } catch (error) {
        console.error('Error saving sync time:', error);
        setIsSyncing(false);
        Alert.alert('Sync Failed', 'There was a problem syncing your data');
      }
    }, 2000);
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Data Synchronization
        </Text>
        
        <List.Item
          title="Enable Sync"
          description="Automatically sync your data across devices"
          left={props => (
            <List.Icon
              {...props}
              icon="sync"
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <Switch
              value={syncEnabled}
              onValueChange={handleSyncToggle}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.divider} />
        
        <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
          Sync Settings
        </Text>
        
        <List.Item
          title="Sync Interval"
          description={formatSyncInterval(syncInterval)}
          disabled={!syncEnabled}
          left={props => (
            <List.Icon
              {...props}
              icon="timer-outline"
              color={syncEnabled ? theme.colors.primary : theme.colors.text + '40'}
            />
          )}
          right={props => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={syncEnabled ? theme.colors.text + '80' : theme.colors.text + '40'}
            />
          )}
          onPress={() => {
            if (syncEnabled) {
              navigation.navigate('SyncIntervalSelection');
            }
          }}
        />
        
        <List.Item
          title="Sync on Wi-Fi Only"
          description="Sync only when connected to Wi-Fi"
          disabled={!syncEnabled}
          left={props => (
            <List.Icon
              {...props}
              icon="wifi"
              color={syncEnabled ? theme.colors.primary : theme.colors.text + '40'}
            />
          )}
          right={props => (
            <Switch
              value={syncWifiOnly}
              onValueChange={handleWifiOnlyToggle}
              color={theme.colors.primary}
              disabled={!syncEnabled}
            />
          )}
        />
        
        <Divider style={styles.divider} />
        
        <View style={styles.syncInfoContainer}>
          <Text style={[styles.lastSyncText, { color: theme.colors.text }]}>
            Last synced: {formatDate(lastSyncTime)}
          </Text>
          
          <Button
            mode="contained"
            onPress={() => setSyncDialogVisible(true)}
            loading={isSyncing}
            disabled={isSyncing}
            style={styles.syncButton}
          >
            Sync Now
          </Button>
        </View>
        
        {/* For demo purposes, we're implementing the interval selection here */}
        <Portal>
          <Dialog
            visible={!!syncInterval && navigation.getState().routes.slice(-1)[0].name === 'SyncIntervalSelection'}
            onDismiss={() => navigation.goBack()}
            style={{ backgroundColor: theme.colors.card }}
          >
            <Dialog.Title style={{ color: theme.colors.text }}>
              Sync Interval
            </Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group
                onValueChange={handleIntervalChange}
                value={syncInterval}
              >
                <RadioButton.Item
                  label="Every 5 minutes"
                  value="5min"
                  color={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                />
                <RadioButton.Item
                  label="Every 15 minutes"
                  value="15min"
                  color={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                />
                <RadioButton.Item
                  label="Every 30 minutes"
                  value="30min"
                  color={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                />
                <RadioButton.Item
                  label="Every hour"
                  value="1hour"
                  color={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                />
                <RadioButton.Item
                  label="Every 6 hours"
                  value="6hour"
                  color={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                />
                <RadioButton.Item
                  label="Once a day"
                  value="1day"
                  color={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => navigation.goBack()}>Done</Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog
            visible={syncDialogVisible}
            onDismiss={() => setSyncDialogVisible(false)}
            style={{ backgroundColor: theme.colors.card }}
          >
            <Dialog.Title style={{ color: theme.colors.text }}>
              Sync Now
            </Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: theme.colors.text }}>
                This will sync all your data immediately. Continue?
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setSyncDialogVisible(false)}>Cancel</Button>
              <Button onPress={syncNow}>Sync</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  syncInfoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 16,
  },
  lastSyncText: {
    fontSize: 14,
    marginBottom: 16,
  },
  syncButton: {
    paddingHorizontal: 16,
  },
});

export default SyncSettingsScreen;
