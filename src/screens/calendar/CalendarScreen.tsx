import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  FAB,
  Divider,
  Menu,
  IconButton,
  useTheme as usePaperTheme,
  Chip,
  List,
  Avatar,
  Appbar,
  Button,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CalendarStackParamList } from '../../navigation/feature/CalendarNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useCalendarStore from '../../stores/useCalendarStore';
import { CalendarEvent, CustomCalendar, DeviceCalendar, EventFilter } from '../../models/Calendar';
import { format, parseISO, isToday, isSameDay, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import * as Calendar from 'expo-calendar';

type CalendarScreenNavigationProp = StackNavigationProp<CalendarStackParamList, 'CalendarMain'>;

// Calendar display modes
type CalendarViewMode = 'month' | 'week' | 'day';

// Event background colors based on color property or calendar colors
const getEventBackgroundColor = (event: CalendarEvent, calendars: CustomCalendar[]) => {
  if (event.color) {
    return event.color;
  } else if (event.calendarId) {
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    return calendar?.color || '#4285F4';
  }
  return '#4285F4';
};

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const {
    events,
    customCalendars,
    deviceCalendars,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    fetchEvents,
    fetchCustomCalendars,
    fetchDeviceCalendars,
    toggleDeviceCalendarVisibility,
  } = useCalendarStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [calendarMenuVisible, setCalendarMenuVisible] = useState(false);
  const [viewModeMenuVisible, setViewModeMenuVisible] = useState(false);
  
  // Dates for current view
  const selectedDateObj = parseISO(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(format(selectedDateObj, 'yyyy-MM'));
  const [displayDays, setDisplayDays] = useState<Date[]>([]);

  // Generate days for current view mode
  useEffect(() => {
    const selectedDateObj = parseISO(selectedDate);
    
    if (viewMode === 'month') {
      // Get first day of the month
      const firstDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
      // Get the start of the week containing the first day
      const startDay = startOfWeek(firstDay, { weekStartsOn: 0 });
      // Get last day of the month
      const lastDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0);
      // Get the end of the week containing the last day
      const endDay = endOfWeek(lastDay, { weekStartsOn: 0 });
      
      // Generate array of all days in the view
      const days = eachDayOfInterval({ start: startDay, end: endDay });
      setDisplayDays(days);
      setCurrentMonth(format(selectedDateObj, 'yyyy-MM'));
    } else if (viewMode === 'week') {
      // Get the start and end of the week
      const startDay = startOfWeek(selectedDateObj, { weekStartsOn: 0 });
      const endDay = endOfWeek(selectedDateObj, { weekStartsOn: 0 });
      
      // Generate array of all days in the week
      const days = eachDayOfInterval({ start: startDay, end: endDay });
      setDisplayDays(days);
    } else if (viewMode === 'day') {
      setDisplayDays([selectedDateObj]);
    }
  }, [selectedDate, viewMode]);
  
  // Fetch events and calendars when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchEvents(user.id);
        fetchCustomCalendars(user.id);
        fetchDeviceCalendars();
      }
    }, [user, fetchEvents, fetchCustomCalendars, fetchDeviceCalendars])
  );
  
  // Handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await Promise.all([
        fetchEvents(user.id),
        fetchCustomCalendars(user.id),
        fetchDeviceCalendars(),
      ]);
      setRefreshing(false);
    }
  }, [user, fetchEvents, fetchCustomCalendars, fetchDeviceCalendars]);
  
  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);
      
      // Check if day is between start and end dates (inclusive)
      return (
        (isSameDay(eventStart, day) || eventStart < day) &&
        (isSameDay(eventEnd, day) || eventEnd > day)
      );
    });
  };
  
  // Navigate to previous period
  const goToPrevious = () => {
    const selectedDateObj = parseISO(selectedDate);
    let newDate: Date;
    
    if (viewMode === 'month') {
      newDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() - 1, 1);
    } else if (viewMode === 'week') {
      newDate = addDays(selectedDateObj, -7);
    } else {
      newDate = addDays(selectedDateObj, -1);
    }
    
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };
  
  // Navigate to next period
  const goToNext = () => {
    const selectedDateObj = parseISO(selectedDate);
    let newDate: Date;
    
    if (viewMode === 'month') {
      newDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 1);
    } else if (viewMode === 'week') {
      newDate = addDays(selectedDateObj, 7);
    } else {
      newDate = addDays(selectedDateObj, 1);
    }
    
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };
  
  // Go to today
  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };
  
  // Handle day press
  const handleDayPress = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    if (viewMode === 'month') {
      setViewMode('day');
    }
  };
  
  // Render day in month view
  const renderMonthDay = (day: Date, index: number) => {
    const isSelected = isSameDay(day, selectedDateObj);
    const isCurrentMonth = isSameMonth(day, selectedDateObj);
    const dayEvents = getEventsForDay(day);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { 
            backgroundColor: isSelected 
              ? theme.colors.primary + '30' 
              : isToday(day)
                ? theme.colors.accent + '20'
                : theme.colors.background
          }
        ]}
        onPress={() => handleDayPress(day)}
      >
        <Text
          style={[
            styles.dayNumber,
            { 
              color: isCurrentMonth ? theme.colors.text : theme.colors.text + '50',
              fontWeight: isToday(day) ? 'bold' : 'normal'
            }
          ]}
        >
          {format(day, 'd')}
        </Text>
        
        {dayEvents.length > 0 && (
          <View style={styles.eventIndicatorContainer}>
            {dayEvents.slice(0, 3).map((event, i) => (
              <View
                key={i}
                style={[
                  styles.eventIndicator,
                  { backgroundColor: getEventBackgroundColor(event, customCalendars) }
                ]}
              />
            ))}
            {dayEvents.length > 3 && (
              <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  // Render day in week view
  const renderWeekDay = (day: Date, index: number) => {
    const isSelected = isSameDay(day, selectedDateObj);
    const dayEvents = getEventsForDay(day);
    
    return (
      <View key={index} style={styles.weekDayColumn}>
        <TouchableOpacity
          style={[
            styles.weekDayHeader,
            {
              backgroundColor: isSelected
                ? theme.colors.primary + '30'
                : isToday(day)
                  ? theme.colors.accent + '20'
                  : theme.colors.background
            }
          ]}
          onPress={() => handleDayPress(day)}
        >
          <Text style={[styles.weekDayName, { color: theme.colors.text }]}>
            {format(day, 'EEE')}
          </Text>
          <Text
            style={[
              styles.weekDayNumber,
              {
                color: theme.colors.text,
                fontWeight: isToday(day) ? 'bold' : 'normal'
              }
            ]}
          >
            {format(day, 'd')}
          </Text>
        </TouchableOpacity>
        
        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderEventItem(item, true)}
          contentContainerStyle={styles.weekDayEvents}
        />
      </View>
    );
  };
  
  // Render event item
  const renderEventItem = (event: CalendarEvent, isCompact: boolean = false) => {
    const startTime = format(parseISO(event.startDate), 'HH:mm');
    const endTime = format(parseISO(event.endDate), 'HH:mm');
    const backgroundColor = getEventBackgroundColor(event, customCalendars);
    
    if (isCompact) {
      return (
        <TouchableOpacity
          style={[
            styles.compactEventItem,
            { backgroundColor: backgroundColor + 'E6' }
          ]}
          onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        >
          <Text style={styles.compactEventTime}>
            {event.allDay ? 'All day' : startTime}
          </Text>
          <Text style={styles.compactEventTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          { backgroundColor: theme.colors.card }
        ]}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      >
        <View
          style={[
            styles.eventColorIndicator,
            { backgroundColor }
          ]}
        />
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
            {event.title}
          </Text>
          <Text style={[styles.eventTime, { color: theme.colors.text + 'CC' }]}>
            {event.allDay ? 'All day' : `${startTime} - ${endTime}`}
          </Text>
          {event.location && (
            <Text style={[styles.eventLocation, { color: theme.colors.text + 'CC' }]}>
              📍 {event.location}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render view based on mode
  const renderCalendarView = () => {
    switch (viewMode) {
      case 'month':
        return (
          <View style={styles.monthContainer}>
            {/* Weekday headers */}
            <View style={styles.weekdayHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <Text
                  key={index}
                  style={[styles.weekdayText, { color: theme.colors.text }]}
                >
                  {day}
                </Text>
              ))}
            </View>
            
            {/* Calendar grid */}
            <View style={styles.monthGrid}>
              {displayDays.map((day, index) => renderMonthDay(day, index))}
            </View>
            
            {/* Selected day events */}
            <View style={styles.selectedDayEvents}>
              <Text style={[styles.selectedDayTitle, { color: theme.colors.primary }]}>
                {format(selectedDateObj, 'EEEE, MMMM d, yyyy')}
              </Text>
              <Divider style={styles.divider} />
              
              <FlatList
                data={getEventsForDay(selectedDateObj)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderEventItem(item)}
                ListEmptyComponent={
                  <View style={styles.emptyEventsContainer}>
                    <Text style={{ color: theme.colors.text + '80' }}>
                      No events for this day
                    </Text>
                  </View>
                }
                contentContainerStyle={
                  getEventsForDay(selectedDateObj).length === 0
                    ? { flex: 1 }
                    : undefined
                }
              />
            </View>
          </View>
        );
        
      case 'week':
        return (
          <View style={styles.weekContainer}>
            <ScrollView horizontal>
              {displayDays.map((day, index) => renderWeekDay(day, index))}
            </ScrollView>
          </View>
        );
        
      case 'day':
        return (
          <View style={styles.dayContainer}>
            <Text style={[styles.selectedDayTitle, { color: theme.colors.primary }]}>
              {format(selectedDateObj, 'EEEE, MMMM d, yyyy')}
            </Text>
            <Divider style={styles.divider} />
            
            <FlatList
              data={getEventsForDay(selectedDateObj)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderEventItem(item)}
              ListEmptyComponent={
                <View style={styles.emptyEventsContainer}>
                  <Text style={{ color: theme.colors.text + '80' }}>
                    No events for this day
                  </Text>
                </View>
              }
              contentContainerStyle={
                getEventsForDay(selectedDateObj).length === 0
                  ? { flex: 1 }
                  : undefined
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
          </View>
        );
    }
  };
  
  // Get title for header based on view mode
  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(selectedDateObj, 'MMMM yyyy');
      case 'week':
        const startDay = startOfWeek(selectedDateObj, { weekStartsOn: 0 });
        const endDay = endOfWeek(selectedDateObj, { weekStartsOn: 0 });
        return `${format(startDay, 'MMM d')} - ${format(endDay, 'MMM d, yyyy')}`;
      case 'day':
        return format(selectedDateObj, 'MMMM d, yyyy');
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Calendar header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.card }}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { color: theme.colors.text }]}>
              {getHeaderTitle()}
            </Text>
          </View>
          
          <View style={styles.headerControls}>
            <IconButton
              icon="calendar-today"
              size={24}
              onPress={goToToday}
              color={theme.colors.primary}
            />
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={goToPrevious}
              color={theme.colors.text}
            />
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={goToNext}
              color={theme.colors.text}
            />
            <IconButton
              icon={
                viewMode === 'month'
                  ? 'calendar-month'
                  : viewMode === 'week'
                    ? 'calendar-week'
                    : 'calendar-today'
              }
              size={24}
              onPress={() => setViewModeMenuVisible(true)}
              color={theme.colors.text}
            />
            <Menu
              visible={viewModeMenuVisible}
              onDismiss={() => setViewModeMenuVisible(false)}
              anchor={<View />}
            >
              <Menu.Item
                onPress={() => {
                  setViewMode('month');
                  setViewModeMenuVisible(false);
                }}
                title="Month View"
                icon="calendar-month"
              />
              <Menu.Item
                onPress={() => {
                  setViewMode('week');
                  setViewModeMenuVisible(false);
                }}
                title="Week View"
                icon="calendar-week"
              />
              <Menu.Item
                onPress={() => {
                  setViewMode('day');
                  setViewModeMenuVisible(false);
                }}
                title="Day View"
                icon="calendar-today"
              />
            </Menu>
            <IconButton
              icon="calendar-multiple"
              size={24}
              onPress={() => setCalendarMenuVisible(true)}
              color={theme.colors.text}
            />
            <Menu
              visible={calendarMenuVisible}
              onDismiss={() => setCalendarMenuVisible(false)}
              anchor={<View />}
            >
              <Menu.Item
                onPress={() => navigation.navigate('CalendarSettings')}
                title="Calendar Settings"
                icon="cog"
              />
              <Divider />
              {customCalendars.map(calendar => (
                <Menu.Item
                  key={calendar.id}
                  onPress={() => {
                    // This would be implemented if we had a toggleCustomCalendarVisibility function
                    // toggleCustomCalendarVisibility(calendar.id);
                  }}
                  title={calendar.name}
                  icon={({ size, color }) => (
                    <View
                      style={[
                        styles.calendarColorIcon,
                        { backgroundColor: calendar.color }
                      ]}
                    />
                  )}
                  right={({ size, color }) => (
                    <IconButton
                      icon={calendar.isVisible ? 'eye' : 'eye-off'}
                      size={size}
                      color={color}
                    />
                  )}
                />
              ))}
              {deviceCalendars.map(calendar => (
                <Menu.Item
                  key={calendar.id}
                  onPress={() => toggleDeviceCalendarVisibility(calendar.id)}
                  title={calendar.title}
                  icon={({ size, color }) => (
                    <View
                      style={[
                        styles.calendarColorIcon,
                        { backgroundColor: calendar.color || '#909090' }
                      ]}
                    />
                  )}
                  right={({ size, color }) => (
                    <IconButton
                      icon={calendar.isVisible ? 'eye' : 'eye-off'}
                      size={size}
                      color={color}
                    />
                  )}
                />
              ))}
            </Menu>
          </View>
        </View>
      </Appbar.Header>
      
      {/* Calendar view */}
      {renderCalendarView()}
      
      {/* FAB for adding new events */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateEvent', { date: selectedDate })}
        color={paperTheme.colors.surface}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    paddingLeft: 16,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekdayHeader: {
    flexDirection: 'row',
    padding: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  monthContainer: {
    flex: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '400',
  },
  eventIndicatorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 2,
    marginBottom: 2,
  },
  moreEventsText: {
    fontSize: 10,
    color: '#666',
  },
  selectedDayEvents: {
    flex: 1,
    padding: 16,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  eventItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  eventColorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
  },
  emptyEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekContainer: {
    flex: 1,
  },
  weekDayColumn: {
    width: 150,
    borderRightWidth: 0.5,
    borderColor: '#ddd',
  },
  weekDayHeader: {
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  weekDayName: {
    fontSize: 14,
    fontWeight: '500',
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '400',
  },
  weekDayEvents: {
    padding: 4,
  },
  compactEventItem: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  compactEventTime: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  compactEventTitle: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  dayContainer: {
    flex: 1,
    padding: 16,
  },
  calendarColorIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CalendarScreen;
