import { create } from 'zustand';
import { Alarm, AlarmSound, AlarmFilter, AlarmSortOption } from '../models/Alarm';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';

interface AlarmState {
  alarms: Alarm[];
  alarmSounds: AlarmSound[];
  isLoading: boolean;
  error: string | null;
  filter: AlarmFilter;
  sortOption: AlarmSortOption;
  
  // Alarm actions
  fetchAlarms: (userId: string) => Promise<void>;
  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt' | 'notificationIds'>) => Promise<Alarm>;
  updateAlarm: (alarmId: string, updatedAlarm: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (alarmId: string) => Promise<void>;
  toggleAlarmEnabled: (alarmId: string) => Promise<void>;
  
  // Sound actions
  fetchAlarmSounds: () => Promise<void>;
  addAlarmSound: (sound: Omit<AlarmSound, 'id'>) => Promise<AlarmSound>;
  deleteAlarmSound: (soundId: string) => Promise<void>;
  
  // Filter actions
  setFilter: (filter: AlarmFilter) => void;
  setSortOption: (sortOption: AlarmSortOption) => void;
  resetFilter: () => void;
}

// Helper function to open database
const getDatabase = () => {
  if (Platform.OS === 'web') {
    return {
      transaction: () => ({
        executeSql: () => {},
      }),
    };
  }
  return SQLite.openDatabase('smart_rounder.db');
};

// Initialize database tables
const initDatabase = () => {
  const db = getDatabase();
  
  // Create alarms table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS alarms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        days TEXT,
        enabled INTEGER NOT NULL,
        soundName TEXT NOT NULL,
        vibrate INTEGER NOT NULL,
        snoozeMinutes INTEGER NOT NULL,
        gradualVolume INTEGER NOT NULL,
        notes TEXT,
        isOneTime INTEGER NOT NULL,
        date TEXT,
        notificationIds TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL
      )`,
      [],
      () => console.log('Alarms table created successfully'),
      (_, error) => {
        console.error('Error creating alarms table:', error);
        return false;
      }
    );
  });
  
  // Create alarm sounds table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS alarm_sounds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        isBuiltIn INTEGER NOT NULL
      )`,
      [],
      () => {
        console.log('Alarm sounds table created successfully');
        
        // Insert default alarm sounds if needed
        tx.executeSql(
          'SELECT COUNT(*) as count FROM alarm_sounds WHERE isBuiltIn = 1',
          [],
          (_, { rows }) => {
            const count = rows.item(0).count;
            
            if (count === 0) {
              const defaultSounds: Omit<AlarmSound, 'id'>[] = [
                { name: 'Gentle Wake', url: 'gentle_wake.mp3', isBuiltIn: true },
                { name: 'Digital Alarm', url: 'digital_alarm.mp3', isBuiltIn: true },
                { name: 'Morning Bird', url: 'morning_bird.mp3', isBuiltIn: true },
                { name: 'Soft Bells', url: 'soft_bells.mp3', isBuiltIn: true },
                { name: 'Ocean Wave', url: 'ocean_wave.mp3', isBuiltIn: true },
              ];
              
              defaultSounds.forEach((sound, index) => {
                tx.executeSql(
                  'INSERT INTO alarm_sounds (id, name, url, isBuiltIn) VALUES (?, ?, ?, ?)',
                  [`default_${index + 1}`, sound.name, sound.url, sound.isBuiltIn ? 1 : 0],
                  () => {},
                  (_, error) => {
                    console.error('Error inserting default sound:', error);
                    return false;
                  }
                );
              });
            }
          },
          (_, error) => {
            console.error('Error checking alarm sounds:', error);
            return false;
          }
        );
      },
      (_, error) => {
        console.error('Error creating alarm sounds table:', error);
        return false;
      }
    );
  });
};

// Initialize database on store creation
initDatabase();

// Helper function to calculate the next alarm date for scheduling notifications
const getNextAlarmDate = (alarm: Alarm): Date | null => {
  const now = new Date();
  
  // For one-time alarms
  if (alarm.isOneTime && alarm.date) {
    const alarmDate = new Date(alarm.date);
    alarmDate.setHours(alarm.hour, alarm.minute, 0, 0);
    
    if (alarmDate > now) {
      return alarmDate;
    }
    return null; // One-time alarm in the past
  }
  
  // For repeating alarms
  if (!alarm.isOneTime && alarm.days && alarm.days.length > 0) {
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Sort days to find the next occurrence
    const sortedDays = [...alarm.days].sort((a, b) => {
      // Calculate days from now, considering wrapping around to next week
      const daysFromNowA = (a - currentDay + 7) % 7;
      const daysFromNowB = (b - currentDay + 7) % 7;
      
      // If it's the same day, check time
      if (daysFromNowA === 0 && daysFromNowB === 0) {
        // If alarm time has passed, a should come after b (next week)
        if (currentHour > alarm.hour || (currentHour === alarm.hour && currentMinute >= alarm.minute)) {
          return 1;
        }
        // If alarm time hasn't passed yet, a should come before b (today)
        return -1;
      }
      
      // If it's today and time has passed, make it next week
      if (daysFromNowA === 0) {
        if (currentHour > alarm.hour || (currentHour === alarm.hour && currentMinute >= alarm.minute)) {
          return daysFromNowA + 7 - daysFromNowB;
        }
      }
      
      if (daysFromNowB === 0) {
        if (currentHour > alarm.hour || (currentHour === alarm.hour && currentMinute >= alarm.minute)) {
          return daysFromNowA - (daysFromNowB + 7);
        }
      }
      
      // Regular comparison for different days
      return daysFromNowA - daysFromNowB;
    });
    
    const nextDay = sortedDays[0];
    let daysToAdd = (nextDay - currentDay + 7) % 7;
    
    // If it's the same day but the time has passed, go to next week
    if (
      daysToAdd === 0 &&
      (currentHour > alarm.hour || (currentHour === alarm.hour && currentMinute >= alarm.minute))
    ) {
      daysToAdd = 7;
    }
    
    const nextAlarmDate = new Date(now);
    nextAlarmDate.setDate(now.getDate() + daysToAdd);
    nextAlarmDate.setHours(alarm.hour, alarm.minute, 0, 0);
    
    return nextAlarmDate;
  }
  
  return null;
};

// Helper function to schedule alarm notifications
const scheduleAlarmNotifications = async (
  alarm: Alarm
): Promise<string[]> => {
  if (!alarm.enabled) {
    return [];
  }

  const notificationIds: string[] = [];
  
  try {
    const notificationsContext = useNotifications();
    if (!notificationsContext.notificationsEnabled) {
      return [];
    }

    // Get the next alarm date
    const nextAlarmDate = getNextAlarmDate(alarm);
    if (!nextAlarmDate) {
      return [];
    }
    
    // Schedule the alarm notification
    const notificationId = await notificationsContext.scheduleTaskNotification(
      alarm.name || 'Alarm',
      alarm.notes || 'Time to wake up!',
      { 
        alarmId: alarm.id,
        soundName: alarm.soundName,
        vibrate: alarm.vibrate,
        snoozeMinutes: alarm.snoozeMinutes,
        gradualVolume: alarm.gradualVolume,
      },
      { date: nextAlarmDate }
    );
    
    if (notificationId) {
      notificationIds.push(notificationId);
    }
    
    // For repeating alarms, schedule multiple occurrences if needed
    if (!alarm.isOneTime && alarm.days && alarm.days.length > 0) {
      // For now, we'll just schedule the next occurrence
      // In a real app, you might want to schedule multiple occurrences ahead of time
    }
  } catch (error) {
    console.error('Failed to schedule alarm notifications:', error);
  }
  
  return notificationIds;
};

// Helper function to cancel alarm notifications
const cancelAlarmNotifications = async (notificationIds: string[]): Promise<void> => {
  try {
    for (const notificationId of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (error) {
    console.error('Failed to cancel alarm notifications:', error);
  }
};

// Create alarm store
const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: [],
  alarmSounds: [],
  isLoading: false,
  error: null,
  filter: {},
  sortOption: 'time-asc',
  
  // Alarm actions
  fetchAlarms: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query alarms from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM alarms WHERE userId = ?',
          [userId],
          (_, { rows }) => {
            const alarms: Alarm[] = [];
            for (let i = 0; i < rows.length; i++) {
              const alarm = rows.item(i);
              alarms.push({
                ...alarm,
                enabled: alarm.enabled === 1,
                vibrate: alarm.vibrate === 1,
                gradualVolume: alarm.gradualVolume === 1,
                isOneTime: alarm.isOneTime === 1,
                days: alarm.days ? JSON.parse(alarm.days) : [],
                notificationIds: alarm.notificationIds ? JSON.parse(alarm.notificationIds) : [],
              });
            }
            set({ alarms, isLoading: false });
          },
          (_, error) => {
            set({ error: error.message, isLoading: false });
            return false;
          }
        );
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
  
  addAlarm: async (alarm) => {
    set({ isLoading: true, error: null });
    
    try {
      const alarmId = Date.now().toString();
      const now = new Date().toISOString();
      
      const newAlarm: Alarm = {
        id: alarmId,
        ...alarm,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      };
      
      // Schedule notifications if alarm is enabled
      if (newAlarm.enabled) {
        const notificationIds = await scheduleAlarmNotifications(newAlarm);
        newAlarm.notificationIds = notificationIds;
      }
      
      const db = getDatabase();
      
      // Insert alarm into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO alarms (
              id, name, hour, minute, days, enabled, soundName, 
              vibrate, snoozeMinutes, gradualVolume, notes, 
              isOneTime, date, notificationIds, createdAt, updatedAt, userId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newAlarm.id,
              newAlarm.name,
              newAlarm.hour,
              newAlarm.minute,
              newAlarm.days && newAlarm.days.length > 0 ? JSON.stringify(newAlarm.days) : null,
              newAlarm.enabled ? 1 : 0,
              newAlarm.soundName,
              newAlarm.vibrate ? 1 : 0,
              newAlarm.snoozeMinutes,
              newAlarm.gradualVolume ? 1 : 0,
              newAlarm.notes || null,
              newAlarm.isOneTime ? 1 : 0,
              newAlarm.date || null,
              newAlarm.notificationIds.length > 0 ? JSON.stringify(newAlarm.notificationIds) : null,
              newAlarm.createdAt,
              newAlarm.updatedAt,
              newAlarm.userId,
            ],
            () => {
              set(state => ({
                alarms: [...state.alarms, newAlarm],
                isLoading: false,
              }));
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
      
      return newAlarm;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateAlarm: async (alarmId, updatedAlarmData) => {
    set({ isLoading: true, error: null });
    
    try {
      const alarms = get().alarms;
      const alarmIndex = alarms.findIndex(alarm => alarm.id === alarmId);
      
      if (alarmIndex === -1) {
        throw new Error('Alarm not found');
      }
      
      const alarm = alarms[alarmIndex];
      const now = new Date().toISOString();
      const updatedAlarm: Alarm = {
        ...alarm,
        ...updatedAlarmData,
        updatedAt: now,
      };
      
      // Handle notification changes
      let notificationIds = [...(alarm.notificationIds || [])];
      
      // If enabled status changed or time/date/days changed, reschedule notifications
      if (
        'enabled' in updatedAlarmData ||
        'hour' in updatedAlarmData ||
        'minute' in updatedAlarmData ||
        'days' in updatedAlarmData ||
        'date' in updatedAlarmData ||
        'isOneTime' in updatedAlarmData
      ) {
        // Cancel existing notifications
        if (notificationIds.length > 0) {
          await cancelAlarmNotifications(notificationIds);
        }
        
        // Schedule new notifications if alarm is enabled
        if (updatedAlarm.enabled) {
          notificationIds = await scheduleAlarmNotifications(updatedAlarm);
        } else {
          notificationIds = [];
        }
        
        updatedAlarm.notificationIds = notificationIds;
      }
      
      const db = getDatabase();
      
      // Update alarm in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedAlarm).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'createdAt' && key !== 'userId') {
              updates.push(`${key} = ?`);
              
              if (key === 'enabled' || key === 'vibrate' || key === 'gradualVolume' || key === 'isOneTime') {
                values.push(value ? 1 : 0);
              } else if (key === 'days' || key === 'notificationIds') {
                values.push(value && Array.isArray(value) && value.length > 0 ? JSON.stringify(value) : null);
              } else {
                values.push(value);
              }
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(alarmId);
          
          tx.executeSql(
            `UPDATE alarms SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              const newAlarms = [...alarms];
              newAlarms[alarmIndex] = updatedAlarm;
              
              set({
                alarms: newAlarms,
                isLoading: false,
              });
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  deleteAlarm: async (alarmId) => {
    set({ isLoading: true, error: null });
    
    try {
      const alarms = get().alarms;
      const alarm = alarms.find(a => a.id === alarmId);
      
      if (alarm && alarm.notificationIds && alarm.notificationIds.length > 0) {
        // Cancel notifications for the alarm
        await cancelAlarmNotifications(alarm.notificationIds);
      }
      
      const db = getDatabase();
      
      // Delete alarm from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM alarms WHERE id = ?',
            [alarmId],
            () => {
              set(state => ({
                alarms: state.alarms.filter(alarm => alarm.id !== alarmId),
                isLoading: false,
              }));
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  toggleAlarmEnabled: async (alarmId) => {
    const alarms = get().alarms;
    const alarmIndex = alarms.findIndex(alarm => alarm.id === alarmId);
    
    if (alarmIndex !== -1) {
      const alarm = alarms[alarmIndex];
      await get().updateAlarm(alarmId, { enabled: !alarm.enabled });
    }
  },
  
  // Sound actions
  fetchAlarmSounds: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query alarm sounds from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM alarm_sounds',
          [],
          (_, { rows }) => {
            const sounds: AlarmSound[] = [];
            for (let i = 0; i < rows.length; i++) {
              const sound = rows.item(i);
              sounds.push({
                ...sound,
                isBuiltIn: sound.isBuiltIn === 1,
              });
            }
            set({ alarmSounds: sounds, isLoading: false });
          },
          (_, error) => {
            set({ error: error.message, isLoading: false });
            return false;
          }
        );
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
  
  addAlarmSound: async (sound) => {
    set({ isLoading: true, error: null });
    
    try {
      const soundId = `custom_${Date.now()}`;
      const newSound: AlarmSound = {
        id: soundId,
        ...sound,
      };
      
      const db = getDatabase();
      
      // Insert sound into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'INSERT INTO alarm_sounds (id, name, url, isBuiltIn) VALUES (?, ?, ?, ?)',
            [newSound.id, newSound.name, newSound.url, newSound.isBuiltIn ? 1 : 0],
            () => {
              set(state => ({
                alarmSounds: [...state.alarmSounds, newSound],
                isLoading: false,
              }));
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
      
      return newSound;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  deleteAlarmSound: async (soundId) => {
    set({ isLoading: true, error: null });
    
    try {
      const sounds = get().alarmSounds;
      const sound = sounds.find(s => s.id === soundId);
      
      if (!sound) {
        throw new Error('Sound not found');
      }
      
      // Cannot delete built-in sounds
      if (sound.isBuiltIn) {
        throw new Error('Cannot delete built-in sounds');
      }
      
      const db = getDatabase();
      
      // Delete sound from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM alarm_sounds WHERE id = ?',
            [soundId],
            () => {
              // Update alarms that use this sound to use the default sound
              const defaultSound = sounds.find(s => s.isBuiltIn && s.id === 'default_1');
              
              if (defaultSound) {
                const alarmsToUpdate = get().alarms.filter(alarm => alarm.soundName === sound.name);
                
                // Update each alarm to use the default sound
                for (const alarm of alarmsToUpdate) {
                  tx.executeSql(
                    'UPDATE alarms SET soundName = ? WHERE soundName = ?',
                    [defaultSound.name, sound.name],
                    () => {},
                    () => false
                  );
                }
                
                set(state => ({
                  alarmSounds: state.alarmSounds.filter(s => s.id !== soundId),
                  alarms: state.alarms.map(alarm => 
                    alarm.soundName === sound.name 
                      ? { ...alarm, soundName: defaultSound.name } 
                      : alarm
                  ),
                  isLoading: false,
                }));
              } else {
                set(state => ({
                  alarmSounds: state.alarmSounds.filter(s => s.id !== soundId),
                  isLoading: false,
                }));
              }
              
              resolve();
            },
            (_, error) => {
              set({
                error: error.message,
                isLoading: false,
              });
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  // Filter actions
  setFilter: (filter) => {
    set(state => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    }));
  },
  
  setSortOption: (sortOption) => {
    set({ sortOption });
  },
  
  resetFilter: () => {
    set({ filter: {} });
  },
}));

export default useAlarmStore;
