import { create } from 'zustand';
import {
  CalendarEvent,
  CustomCalendar,
  DeviceCalendar,
  EventFilter,
  EventSortOption,
  Reminder
} from '../models/Calendar';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { useNotifications } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';

interface CalendarState {
  events: CalendarEvent[];
  customCalendars: CustomCalendar[];
  deviceCalendars: DeviceCalendar[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string; // ISO date string
  filter: EventFilter;
  sortOption: EventSortOption;
  
  // Event actions
  fetchEvents: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updatedEvent: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Calendar actions
  fetchCustomCalendars: (userId: string) => Promise<void>;
  addCustomCalendar: (calendar: Omit<CustomCalendar, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomCalendar>;
  updateCustomCalendar: (calendarId: string, updatedCalendar: Partial<CustomCalendar>) => Promise<void>;
  deleteCustomCalendar: (calendarId: string) => Promise<void>;
  
  // Device Calendar actions
  fetchDeviceCalendars: () => Promise<void>;
  toggleDeviceCalendarVisibility: (calendarId: string) => void;
  
  // Date selection and filter actions
  setSelectedDate: (date: string) => void;
  setFilter: (filter: EventFilter) => void;
  setSortOption: (sortOption: EventSortOption) => void;
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
  
  // Create events table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        allDay INTEGER NOT NULL,
        color TEXT,
        calendarId TEXT,
        recurrence TEXT,
        reminders TEXT,
        url TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL,
        syncId TEXT,
        notificationIds TEXT
      )`,
      [],
      () => console.log('Events table created successfully'),
      (_, error) => {
        console.error('Error creating events table:', error);
        return false;
      }
    );
  });
  
  // Create custom calendars table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS custom_calendars (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        isVisible INTEGER NOT NULL,
        isDefault INTEGER NOT NULL,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      [],
      () => console.log('Custom calendars table created successfully'),
      (_, error) => {
        console.error('Error creating custom calendars table:', error);
        return false;
      }
    );
  });
  
  // Create device calendars preference table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS device_calendar_prefs (
        id TEXT PRIMARY KEY,
        isVisible INTEGER NOT NULL
      )`,
      [],
      () => console.log('Device calendar preferences table created successfully'),
      (_, error) => {
        console.error('Error creating device calendar preferences table:', error);
        return false;
      }
    );
  });
};

// Initialize database on store creation
initDatabase();

// Helper function to schedule event notifications
const scheduleEventNotifications = async (
  event: CalendarEvent
): Promise<string[]> => {
  if (!event.reminders || event.reminders.length === 0) {
    return [];
  }

  const notificationIds: string[] = [];
  
  try {
    const notificationsContext = useNotifications();
    if (!notificationsContext.notificationsEnabled) {
      return [];
    }

    // Parse event start date
    const startDate = new Date(event.startDate);
    
    // Schedule notifications for each reminder
    for (const reminder of event.reminders) {
      const reminderTime = new Date(startDate.getTime() - reminder.minutes * 60 * 1000);
      
      // Don't schedule notifications in the past
      if (reminderTime <= new Date()) {
        continue;
      }
      
      const notificationId = await notificationsContext.scheduleTaskNotification(
        event.title,
        event.description || 'Upcoming event',
        { eventId: event.id },
        { date: reminderTime }
      );
      
      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }
  } catch (error) {
    console.error('Failed to schedule event notifications:', error);
  }
  
  return notificationIds;
};

// Helper function to cancel event notifications
const cancelEventNotifications = async (notificationIds: string[]): Promise<void> => {
  try {
    for (const notificationId of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (error) {
    console.error('Failed to cancel event notifications:', error);
  }
};

// Helper function to request calendar permissions
const getCalendarPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
};

// Create calendar store
const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  customCalendars: [],
  deviceCalendars: [],
  isLoading: false,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0],
  filter: {},
  sortOption: 'startDate-asc',
  
  // Event actions
  fetchEvents: async (userId: string, startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Build the query based on provided date range
      let query = 'SELECT * FROM events WHERE userId = ?';
      const params: any[] = [userId];
      
      if (startDate) {
        query += ' AND endDate >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND startDate <= ?';
        params.push(endDate);
      }
      
      // Query events from database
      db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const events: CalendarEvent[] = [];
            for (let i = 0; i < rows.length; i++) {
              const event = rows.item(i);
              events.push({
                ...event,
                allDay: event.allDay === 1,
                recurrence: event.recurrence ? JSON.parse(event.recurrence) : undefined,
                reminders: event.reminders ? JSON.parse(event.reminders) : [],
                notificationIds: event.notificationIds ? JSON.parse(event.notificationIds) : [],
              });
            }
            set({ events, isLoading: false });
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
  
  addEvent: async (event) => {
    set({ isLoading: true, error: null });
    
    try {
      const eventId = Date.now().toString();
      const now = new Date().toISOString();
      
      const newEvent: CalendarEvent = {
        id: eventId,
        ...event,
        createdAt: now,
        updatedAt: now,
      };
      
      // Schedule notifications if reminders are set
      if (newEvent.reminders && newEvent.reminders.length > 0) {
        const notificationIds = await scheduleEventNotifications(newEvent);
        newEvent.notificationIds = notificationIds;
      }
      
      const db = getDatabase();
      
      // Insert event into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO events (
              id, title, description, location, startDate, endDate, 
              allDay, color, calendarId, recurrence, reminders, url, 
              createdAt, updatedAt, userId, syncId, notificationIds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newEvent.id,
              newEvent.title,
              newEvent.description || null,
              newEvent.location || null,
              newEvent.startDate,
              newEvent.endDate,
              newEvent.allDay ? 1 : 0,
              newEvent.color || null,
              newEvent.calendarId || null,
              newEvent.recurrence ? JSON.stringify(newEvent.recurrence) : null,
              newEvent.reminders ? JSON.stringify(newEvent.reminders) : null,
              newEvent.url || null,
              newEvent.createdAt,
              newEvent.updatedAt,
              newEvent.userId,
              newEvent.syncId || null,
              newEvent.notificationIds ? JSON.stringify(newEvent.notificationIds) : null,
            ],
            () => {
              set(state => ({
                events: [...state.events, newEvent],
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
      
      return newEvent;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateEvent: async (eventId, updatedEventData) => {
    set({ isLoading: true, error: null });
    
    try {
      const events = get().events;
      const eventIndex = events.findIndex(event => event.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      const event = events[eventIndex];
      const now = new Date().toISOString();
      const updatedEvent: CalendarEvent = {
        ...event,
        ...updatedEventData,
        updatedAt: now,
      };
      
      // Cancel existing notifications if they exist and reminders have changed
      if (
        (event.notificationIds && event.notificationIds.length > 0) &&
        (updatedEventData.reminders || updatedEventData.startDate)
      ) {
        await cancelEventNotifications(event.notificationIds);
        
        // Schedule new notifications
        const notificationIds = await scheduleEventNotifications(updatedEvent);
        updatedEvent.notificationIds = notificationIds;
      }
      
      const db = getDatabase();
      
      // Update event in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedEvent).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'createdAt' && key !== 'userId') {
              updates.push(`${key} = ?`);
              
              if (key === 'allDay') {
                values.push(value ? 1 : 0);
              } else if (key === 'recurrence' || key === 'reminders' || key === 'notificationIds') {
                values.push(value ? JSON.stringify(value) : null);
              } else {
                values.push(value);
              }
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(eventId);
          
          tx.executeSql(
            `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              const newEvents = [...events];
              newEvents[eventIndex] = updatedEvent;
              
              set({
                events: newEvents,
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
  
  deleteEvent: async (eventId) => {
    set({ isLoading: true, error: null });
    
    try {
      const events = get().events;
      const event = events.find(e => e.id === eventId);
      
      if (event && event.notificationIds && event.notificationIds.length > 0) {
        // Cancel notifications for the event
        await cancelEventNotifications(event.notificationIds);
      }
      
      const db = getDatabase();
      
      // Delete event from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM events WHERE id = ?',
            [eventId],
            () => {
              set(state => ({
                events: state.events.filter(event => event.id !== eventId),
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
  
  // Calendar actions
  fetchCustomCalendars: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query custom calendars from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM custom_calendars WHERE userId = ?',
          [userId],
          (_, { rows }) => {
            const calendars: CustomCalendar[] = [];
            for (let i = 0; i < rows.length; i++) {
              const calendar = rows.item(i);
              calendars.push({
                ...calendar,
                isVisible: calendar.isVisible === 1,
                isDefault: calendar.isDefault === 1,
              });
            }
            set({ customCalendars: calendars, isLoading: false });
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
  
  addCustomCalendar: async (calendar) => {
    set({ isLoading: true, error: null });
    
    try {
      const calendarId = Date.now().toString();
      const now = new Date().toISOString();
      const newCalendar: CustomCalendar = {
        id: calendarId,
        ...calendar,
        createdAt: now,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Insert calendar into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          // If this calendar is set as default, update others to not be default
          if (newCalendar.isDefault) {
            tx.executeSql(
              'UPDATE custom_calendars SET isDefault = 0 WHERE userId = ?',
              [newCalendar.userId],
              () => {},
              (_, error) => {
                console.error('Error updating default calendars:', error);
                return false;
              }
            );
          }
          
          tx.executeSql(
            `INSERT INTO custom_calendars (
              id, name, color, isVisible, isDefault, userId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newCalendar.id,
              newCalendar.name,
              newCalendar.color,
              newCalendar.isVisible ? 1 : 0,
              newCalendar.isDefault ? 1 : 0,
              newCalendar.userId,
              newCalendar.createdAt,
              newCalendar.updatedAt,
            ],
            () => {
              set(state => ({
                customCalendars: newCalendar.isDefault
                  ? [...state.customCalendars.map(cal => ({ ...cal, isDefault: false })), newCalendar]
                  : [...state.customCalendars, newCalendar],
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
      
      return newCalendar;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateCustomCalendar: async (calendarId, updatedCalendarData) => {
    set({ isLoading: true, error: null });
    
    try {
      const calendars = get().customCalendars;
      const calendarIndex = calendars.findIndex(calendar => calendar.id === calendarId);
      
      if (calendarIndex === -1) {
        throw new Error('Calendar not found');
      }
      
      const calendar = calendars[calendarIndex];
      const now = new Date().toISOString();
      const updatedCalendar: CustomCalendar = {
        ...calendar,
        ...updatedCalendarData,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Update calendar in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          // If this calendar is being set as default, update others to not be default
          if (updatedCalendar.isDefault && !calendar.isDefault) {
            tx.executeSql(
              'UPDATE custom_calendars SET isDefault = 0 WHERE userId = ?',
              [calendar.userId],
              () => {},
              (_, error) => {
                console.error('Error updating default calendars:', error);
                return false;
              }
            );
          }
          
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedCalendarData).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'createdAt' && key !== 'userId') {
              updates.push(`${key} = ?`);
              
              if (key === 'isVisible' || key === 'isDefault') {
                values.push(value ? 1 : 0);
              } else {
                values.push(value);
              }
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(calendarId);
          
          tx.executeSql(
            `UPDATE custom_calendars SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              let newCalendars = [...calendars];
              
              // If this calendar is being set as default, update all calendars
              if (updatedCalendar.isDefault && !calendar.isDefault) {
                newCalendars = newCalendars.map(cal => ({
                  ...cal,
                  isDefault: cal.id === calendarId,
                }));
              } else {
                newCalendars[calendarIndex] = updatedCalendar;
              }
              
              set({
                customCalendars: newCalendars,
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
  
  deleteCustomCalendar: async (calendarId) => {
    set({ isLoading: true, error: null });
    
    try {
      const calendars = get().customCalendars;
      const calendar = calendars.find(cal => cal.id === calendarId);
      
      if (!calendar) {
        throw new Error('Calendar not found');
      }
      
      const db = getDatabase();
      
      // Delete calendar from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM custom_calendars WHERE id = ?',
            [calendarId],
            () => {
              // Update events to remove this calendar ID
              tx.executeSql(
                'UPDATE events SET calendarId = NULL WHERE calendarId = ?',
                [calendarId],
                () => {
                  // If this was the default calendar, set a new default
                  if (calendar.isDefault && calendars.length > 1) {
                    const remainingCalendars = calendars.filter(cal => cal.id !== calendarId);
                    const newDefaultId = remainingCalendars[0].id;
                    
                    tx.executeSql(
                      'UPDATE custom_calendars SET isDefault = 1 WHERE id = ?',
                      [newDefaultId],
                      () => {
                        set(state => ({
                          customCalendars: state.customCalendars
                            .filter(cal => cal.id !== calendarId)
                            .map(cal => cal.id === newDefaultId 
                              ? { ...cal, isDefault: true } 
                              : cal),
                          events: state.events.map(event => 
                            event.calendarId === calendarId 
                              ? { ...event, calendarId: undefined } 
                              : event
                          ),
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
                  } else {
                    set(state => ({
                      customCalendars: state.customCalendars.filter(cal => cal.id !== calendarId),
                      events: state.events.map(event => 
                        event.calendarId === calendarId 
                          ? { ...event, calendarId: undefined } 
                          : event
                      ),
                      isLoading: false,
                    }));
                    resolve();
                  }
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
  
  // Device Calendar actions
  fetchDeviceCalendars: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (Platform.OS === 'web') {
        set({ deviceCalendars: [], isLoading: false });
        return;
      }
      
      const hasPermission = await getCalendarPermissions();
      if (!hasPermission) {
        set({ 
          error: 'Calendar permissions not granted',
          isLoading: false, 
          deviceCalendars: []
        });
        return;
      }
      
      const deviceCalendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      
      const db = getDatabase();
      
      // Get visibility preferences for device calendars
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM device_calendar_prefs',
          [],
          (_, { rows }) => {
            const preferences: Record<string, boolean> = {};
            
            for (let i = 0; i < rows.length; i++) {
              const pref = rows.item(i);
              preferences[pref.id] = pref.isVisible === 1;
            }
            
            // Map device calendars with their visibility preference
            const mappedCalendars: DeviceCalendar[] = deviceCalendars.map(calendar => ({
              id: calendar.id,
              title: calendar.title,
              entityType: calendar.entityType,
              source: {
                id: calendar.source.id,
                name: calendar.source.name,
                type: calendar.source.type,
              },
              color: calendar.color,
              allowsModifications: calendar.allowsModifications,
              isVisible: preferences[calendar.id] !== undefined 
                ? preferences[calendar.id] 
                : true, // Default to visible
            }));
            
            set({ deviceCalendars: mappedCalendars, isLoading: false });
            
            // Set default visibility preferences for any new calendars
            mappedCalendars.forEach(calendar => {
              if (preferences[calendar.id] === undefined) {
                tx.executeSql(
                  'INSERT OR IGNORE INTO device_calendar_prefs (id, isVisible) VALUES (?, ?)',
                  [calendar.id, 1],
                  () => {},
                  () => false
                );
              }
            });
          },
          (_, error) => {
            set({ 
              error: error.message,
              isLoading: false,
              deviceCalendars: deviceCalendars.map(calendar => ({
                id: calendar.id,
                title: calendar.title,
                entityType: calendar.entityType,
                source: {
                  id: calendar.source.id,
                  name: calendar.source.name,
                  type: calendar.source.type,
                },
                color: calendar.color,
                allowsModifications: calendar.allowsModifications,
                isVisible: true, // Default to visible
              })),
            });
            return false;
          }
        );
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
        deviceCalendars: [],
      });
    }
  },
  
  toggleDeviceCalendarVisibility: (calendarId) => {
    set(state => {
      const deviceCalendars = [...state.deviceCalendars];
      const calendarIndex = deviceCalendars.findIndex(
        calendar => calendar.id === calendarId
      );
      
      if (calendarIndex !== -1) {
        const calendar = deviceCalendars[calendarIndex];
        deviceCalendars[calendarIndex] = {
          ...calendar,
          isVisible: !calendar.isVisible,
        };
        
        // Update preference in database
        const db = getDatabase();
        db.transaction(tx => {
          tx.executeSql(
            'INSERT OR REPLACE INTO device_calendar_prefs (id, isVisible) VALUES (?, ?)',
            [calendarId, deviceCalendars[calendarIndex].isVisible ? 1 : 0],
            () => {},
            () => false
          );
        });
        
        return { deviceCalendars };
      }
      
      return state;
    });
  },
  
  // Date selection and filter actions
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },
  
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

export default useCalendarStore;
