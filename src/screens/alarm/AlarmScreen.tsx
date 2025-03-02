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
  Surface,
  Menu,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AlarmStackParamList } from '../../navigation/feature/AlarmNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useAlarmStore from '../../stores/useAlarmStore';
import { Alarm, AlarmFilter, AlarmSortOption } from '../../models/Alarm';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

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
    filter,
    sortOption,
    fetchAlarms,
    fetchAlarmSounds,
    toggleAlarmEnabled,
    deleteAlarm,
    setFilter,
    setSortOption,
    resetFilter,
  } = useAlarmStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState<string | null>(null);
  
  // Fetch alarms when the screen is focused
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
  
  // Filter alarms based on current filters
  const filteredAlarms = alarms.filter(alarm => {
    // Skip if alarm enabled state doesn't match the filter
    if (filter.enabled !== undefined && alarm.enabled !== filter.enabled) {
      return false;
    }
    
    // Skip if alarm type doesn't match the filter
    if (filter.isOneTime !== undefined && alarm.isOneTime !== filter.isOneTime) {
      return false;
    }
    
    return true;
  });
  
  // Sort filtered alarms
  const sortedAlarms = [...filteredAlarms].sort((a, b) => {
    switch (sortOption) {
      case 'time-asc':
        // Sort by hour, then minute
        if (a.hour !== b.hour) {
          return a.hour - b.hour;
        }
        return a.minute - b.minute;
        
      case 'time-desc':
        // Sort by hour, then minute (descending)
        if (a.hour !== b.hour) {
          return b.hour - a.hour;
        }
        return b.minute - a.minute;
        
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
  
  // Get alarm sound name by sound name
  const getAlarmSoundByName = (soundName: string) => {
    return alarmSounds.find(sound => sound.name === soundName);
  };
  
  // Format alarm time (12-hour format with AM/PM)
  const formatAlarmTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  };
  
  // Format alarm days
  const formatAlarmDays = (days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>): string => {
    if (days.length === 0) return '';
    if (days.length === 7) return 'Every day';
    
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
      return 'Weekdays';
    }
    
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return 'Weekends';
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };
  
  // Format one-time alarm date
  const formatOneTimeDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d, yyyy');
  };
  
  // Handle delete alarm
  const handleDeleteAlarm = (alarmId: string) => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAlarm(alarmId),
        },
      ]
    );
  };
  
  // Render alarm item
  const renderAlarmItem = ({ item }: { item: Alarm }) => {
    const alarmSound = getAlarmSoundByName(item.soundName);
    
    return (
      <Surface
        style={[
          styles.alarmCard,
          { backgroundColor: theme.colors.card }
        ]}
      >
        <View style={styles.alarmHeader}>
          <TouchableOpacity
            style={styles.alarmTimeContainer}
            onPress={() => navigation.navigate('AlarmDetail', { alarmId: item.id })}
          >
            <Text style={[styles.alarmTime, { color: theme.colors.text }]}>
              {formatAlarmTime(item.hour, item.minute)}
            </Text>
            
            <Text style={[styles.alarmName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.alarmControls}>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleAlarmEnabled(item.id)}
              trackColor={{ false: theme.colors.text + '40', true: theme.colors.primary + '80' }}
              thumbColor={item.enabled ? theme.colors.primary : theme.colors.text + '80'}
            />
            
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setContextMenuVisible(item.id)}
              color={theme.colors.text}
            />
            
            <Menu
              visible={contextMenuVisible === item.id}
              onDismiss={() => setContextMenuVisible(null)}
              anchor={<View />}
              style={{ marginTop: -40, marginLeft: -20 }}
            >
              <Menu.Item
                onPress={() => {
                  setContextMenuVisible(null);
                  navigation.navigate('AlarmDetail', { alarmId: item.id });
                }}
                title="Edit"
                icon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setContextMenuVisible(null);
                  handleDeleteAlarm(item.id);
                }}
                title="Delete"
                icon="delete"
              />
            </Menu>
          </View>
        </View>
        
        <View style={styles.alarmDetails}>
          {item.isOneTime ? (
            <Text style={[styles.alarmSchedule, { color: theme.colors.text }]}>
              {formatOneTimeDate(item.date)}
            </Text>
          ) : (
            <Text style={[styles.alarmSchedule, { color: theme.colors.text }]}>
              {formatAlarmDays(item.days)}
            </Text>
          )}
          
          <View style={styles.alarmFeatures}>
            {alarmSound && (
              <Chip
                icon="volume-high"
                label={alarmSound.name}
                backgroundColor={theme.colors.primary + '20'}
                textColor={theme.colors.text}
              />
            )}
            
            {item.vibrate && (
              <Chip
                icon="vibrate"
                label="Vibrate"
                backgroundColor={theme.colors.primary + '20'}
                textColor={theme.colors.text}
              />
            )}
            
            {item.gradualVolume && (
              <Chip
                icon="volume-gradient-up"
                label="Gradual"
                backgroundColor={theme.colors.primary + '20'}
                textColor={theme.colors.text}
              />
            )}
            
            {item.snoozeMinutes > 0 && (
              <Chip
                icon="snooze"
                label={`${item.snoozeMinutes} min snooze`}
                backgroundColor={theme.colors.primary + '20'}
                textColor={theme.colors.text}
              />
            )}
          </View>
        </View>
      </Surface>
    );
  };
  
  // Custom Chip component
  const Chip = ({ 
    icon, 
    label, 
    backgroundColor, 
    textColor 
  }: { 
    icon: string; 
    label: string; 
    backgroundColor: string; 
    textColor: string;
  }) => {
    return (
      <View style={[styles.chip, { backgroundColor }]}>
        <MaterialCommunityIcons name={icon} size={14} color={textColor} style={styles.chipIcon} />
        <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };
  
  // Render empty list message
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="alarm-multiple"
        size={64}
        color={theme.colors.primary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Alarms
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.text }]}>
        Tap the + button to create your first alarm
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
          Alarms
        </Text>
        
        <View style={styles.headerActions}>
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setFilterMenuVisible(true)}
            color={Object.keys(filter).length > 0 ? theme.colors.primary : theme.colors.text}
          />
          
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={<View />}
            style={{ marginTop: 50 }}
          >
            <Menu.Item
              onPress={() => {
                setFilter({ ...filter, enabled: true });
                setFilterMenuVisible(false);
              }}
              title="Enabled Alarms"
              icon="bell"
            />
            <Menu.Item
              onPress={() => {
                setFilter({ ...filter, enabled: false });
                setFilterMenuVisible(false);
              }}
              title="Disabled Alarms"
              icon="bell-off"
            />
            <Menu.Item
              onPress={() => {
                setFilter({ ...filter, isOneTime: true });
                setFilterMenuVisible(false);
              }}
              title="One-time Alarms"
              icon="calendar-clock"
            />
            <Menu.Item
              onPress={() => {
                setFilter({ ...filter, isOneTime: false });
                setFilterMenuVisible(false);
              }}
              title="Repeating Alarms"
              icon="repeat"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                resetFilter();
                setFilterMenuVisible(false);
              }}
              title="Clear Filters"
              icon="filter-remove"
            />
          </Menu>
          
          <IconButton
            icon="sort"
            size={24}
            onPress={() => setSortMenuVisible(true)}
            color={theme.colors.text}
          />
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={<View />}
            style={{ marginTop: 50 }}
          >
            <Menu.Item
              onPress={() => {
                setSortOption('time-asc');
                setSortMenuVisible(false);
              }}
              title="Time (Ascending)"
              icon="clock-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('time-desc');
                setSortMenuVisible(false);
              }}
              title="Time (Descending)"
              icon="clock-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('name-asc');
                setSortMenuVisible(false);
              }}
              title="Name (A-Z)"
              icon="sort-alphabetical-ascending"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('name-desc');
                setSortMenuVisible(false);
              }}
              title="Name (Z-A)"
              icon="sort-alphabetical-descending"
            />
          </Menu>
        </View>
      </View>
      
      <FlatList
        data={sortedAlarms}
        keyExtractor={item => item.id}
        renderItem={renderAlarmItem}
        contentContainerStyle={[
          styles.alarmsList,
          sortedAlarms.length === 0 && styles.emptyList
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmptyList}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmsList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 16,
  },
  alarmCard: {
    borderRadius: 12,
    elevation: 2,
    padding: 16,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alarmTimeContainer: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  alarmName: {
    fontSize: 16,
    opacity: 0.8,
  },
  alarmControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmDetails: {
    marginTop: 8,
  },
  alarmSchedule: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  alarmFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AlarmScreen;
