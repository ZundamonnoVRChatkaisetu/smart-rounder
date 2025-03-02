import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import {
  Text,
  FAB,
  Divider,
  IconButton,
  useTheme as usePaperTheme,
  Card,
  Title,
  Paragraph,
  Dialog,
  Portal,
  Button,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AlarmStackParamList } from '../../navigation/feature/AlarmNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useAlarmStore from '../../stores/useAlarmStore';
import { Alarm, AlarmFilter, AlarmSortOption } from '../../models/Alarm';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';

type AlarmScreenNavigationProp = StackNavigationProp<AlarmStackParamList, 'AlarmList'>;

const AlarmScreen: React.FC = () => {
  const navigation = useNavigation<AlarmScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const {
    alarms,
    alarmSounds,
    isLoading,
    error,
    filter,
    sortOption,
    fetchAlarms,
    fetchAlarmSounds,
    toggleAlarmEnabled,
    deleteAlarm,
    setFilter,
    setSortOption,
  } = useAlarmStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  
  // Fetch alarms and sounds when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchAlarms(user.id);
        fetchAlarmSounds();
      }
    }, [user, fetchAlarms, fetchAlarmSounds])
  );
  
  // Handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await Promise.all([
        fetchAlarms(user.id),
        fetchAlarmSounds(),
      ]);
      setRefreshing(false);
    }
  }, [user, fetchAlarms, fetchAlarmSounds]);
  
  // Filter and sort alarms
  const filteredAlarms = alarms.filter(alarm => {
    // Skip if alarm doesn't match the enabled filter
    if (filter.enabled !== undefined && alarm.enabled !== filter.enabled) {
      return false;
    }
    
    // Skip if alarm doesn't match the one-time filter
    if (filter.isOneTime !== undefined && alarm.isOneTime !== filter.isOneTime) {
      return false;
    }
    
    return true;
  });
  
  const sortedAlarms = [...filteredAlarms].sort((a, b) => {
    switch (sortOption) {
      case 'time-asc':
        // Sort by hour, then by minute
        return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
        
      case 'time-desc':
        // Sort by hour, then by minute (descending)
        return b.hour * 60 + b.minute - (a.hour * 60 + a.minute);
        
      case 'name-asc':
        return a.name.localeCompare(b.name);
        
      case 'name-desc':
        return b.name.localeCompare(a.name);
        
      case 'createdAt-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        
      case 'createdAt-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
      default:
        return 0;
    }
  });
  
  // Group alarms by type (one-time vs. recurring)
  const oneTimeAlarms = sortedAlarms.filter(alarm => alarm.isOneTime);
  const recurringAlarms = sortedAlarms.filter(alarm => !alarm.isOneTime);
  
  // Get alarm sound name
  const getAlarmSoundName = (soundName: string): string => {
    const sound = alarmSounds.find(s => s.name === soundName);
    return sound ? sound.name : soundName;
  };
  
  // Format time (24h or 12h)
  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  // Format days
  const formatDays = (days: number[]): string => {
    if (days.length === 0) {
      return 'Never';
    }
    
    if (days.length === 7) {
      return 'Every day';
    }
    
    if (days.length === 5 && 
        days.includes(1) && days.includes(2) && days.includes(3) && 
        days.includes(4) && days.includes(5)) {
      return 'Weekdays';
    }
    
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return 'Weekends';
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };
  
  // Format date for one-time alarms
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'One time';
    
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEE, MMM d, yyyy');
    }
  };
  
  // Handle alarm toggle
  const handleAlarmToggle = async (alarm: Alarm) => {
    try {
      await toggleAlarmEnabled(alarm.id);
    } catch (error) {
      console.error('Failed to toggle alarm:', error);
      Alert.alert('Error', 'Failed to toggle alarm');
    }
  };
  
  // Handle alarm delete
  const handleDeleteAlarm = () => {
    if (selectedAlarm) {
      deleteAlarm(selectedAlarm.id)
        .then(() => {
          setDeleteDialogVisible(false);
          setSelectedAlarm(null);
        })
        .catch(error => {
          console.error('Failed to delete alarm:', error);
          Alert.alert('Error', 'Failed to delete alarm');
        });
    }
  };
  
  // Render alarm item
  const renderAlarmItem = ({ item }: { item: Alarm }) => {
    return (
      <Card
        style={[
          styles.alarmCard,
          { backgroundColor: theme.colors.card }
        ]}
      >
        <Card.Content style={styles.alarmContent}>
          <View style={styles.alarmHeader}>
            <View style={styles.alarmTimeContainer}>
              <Text style={[styles.alarmTime, { color: theme.colors.text }]}>
                {formatTime(item.hour, item.minute)}
              </Text>
              {item.isOneTime ? (
                <Text style={[styles.alarmDate, { color: theme.colors.text + '99' }]}>
                  {formatDate(item.date)}
                </Text>
              ) : (
                <Text style={[styles.alarmDays, { color: theme.colors.text + '99' }]}>
                  {formatDays(item.days)}
                </Text>
              )}
            </View>
            
            <Switch
              value={item.enabled}
              onValueChange={() => handleAlarmToggle(item)}
              trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
              thumbColor={item.enabled ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.alarmNameContainer}>
            <Text style={[styles.alarmName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
          </View>
          
          <View style={styles.alarmDetails}>
            {item.notes && (
              <Text style={[styles.alarmNotes, { color: theme.colors.text + '99' }]} numberOfLines={1}>
                📝 {item.notes}
              </Text>
            )}
            <Text style={[styles.alarmSound, { color: theme.colors.text + '99' }]}>
              🔊 {getAlarmSoundName(item.soundName)}
            </Text>
          </View>
          
          <View style={styles.alarmActions}>
            <IconButton
              icon="pencil"
              size={20}
              color={theme.colors.primary}
              onPress={() => navigation.navigate('AlarmDetail', { alarmId: item.id })}
            />
            <IconButton
              icon="delete"
              size={20}
              color={theme.colors.error || '#F44336'}
              onPress={() => {
                setSelectedAlarm(item);
                setDeleteDialogVisible(true);
              }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render section header
  const renderSectionHeader = (title: string) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background }
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        {title}
      </Text>
      <Divider style={styles.divider} />
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={[
          ...(recurringAlarms.length > 0 ? [{ type: 'header', title: 'Recurring Alarms' }] : []),
          ...recurringAlarms.map(alarm => ({ type: 'alarm', data: alarm })),
          ...(recurringAlarms.length > 0 && oneTimeAlarms.length > 0 ? [{ type: 'divider' }] : []),
          ...(oneTimeAlarms.length > 0 ? [{ type: 'header', title: 'One-Time Alarms' }] : []),
          ...oneTimeAlarms.map(alarm => ({ type: 'alarm', data: alarm })),
        ]}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title);
          } else if (item.type === 'divider') {
            return <View style={styles.sectionDivider} />;
          } else {
            return renderAlarmItem({ item: item.data });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="alarm-off"
              size={64}
              color={theme.colors.text + '40'}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text + '80' }]}>
              No alarms set
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.text + '60' }]}>
              Tap the + button to add an alarm
            </Text>
          </View>
        }
        contentContainerStyle={
          sortedAlarms.length === 0 ? styles.emptyListContent : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateAlarm')}
        color={paperTheme.colors.surface}
      />
      
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            Delete Alarm
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.text }}>
              Are you sure you want to delete this alarm?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteAlarm} color={theme.colors.error || '#F44336'}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginTop: 8,
  },
  sectionDivider: {
    height: 16,
  },
  alarmCard: {
    marginBottom: 16,
    elevation: 2,
  },
  alarmContent: {
    padding: 8,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alarmTimeContainer: {
    flexDirection: 'column',
  },
  alarmTime: {
    fontSize: 32,
    fontWeight: '500',
  },
  alarmDate: {
    fontSize: 14,
  },
  alarmDays: {
    fontSize: 14,
  },
  alarmNameContainer: {
    marginBottom: 8,
  },
  alarmName: {
    fontSize: 18,
    fontWeight: '500',
  },
  alarmDetails: {
    marginBottom: 8,
  },
  alarmNotes: {
    fontSize: 14,
    marginBottom: 4,
  },
  alarmSound: {
    fontSize: 14,
  },
  alarmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AlarmScreen;
