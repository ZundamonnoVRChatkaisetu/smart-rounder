import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  Text,
  FAB,
  Divider,
  Menu,
  IconButton,
  useTheme as usePaperTheme,
  Card,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CalendarStackParamList } from '../../navigation/feature/CalendarNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useCalendarStore from '../../stores/useCalendarStore';
import { CalendarEvent, CustomCalendar } from '../../models/Calendar';
import {
  format,
  isToday,
  isSameDay,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getYear,
  getMonth,
  addDays,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type CalendarScreenNavigationProp = StackNavigationProp<CalendarStackParamList, 'CalendarMain'>;

type CalendarViewMode = 'day' | 'week' | 'month';

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
    fetchEvents,
    fetchCustomCalendars,
    fetchDeviceCalendars,
    setSelectedDate,
  } = useCalendarStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMenuVisible, setViewMenuVisible] = useState(false);
  const [calendarMenuVisible, setCalendarMenuVisible] = useState(false);
  
  // Fetch events and calendars when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const now = new Date();
        const startDate = startOfMonth(now).toISOString();
        const endDate = endOfMonth(now).toISOString();
        
        fetchEvents(user.id, startDate, endDate);
        fetchCustomCalendars(user.id);
        fetchDeviceCalendars();
      }
    }, [user, fetchEvents, fetchCustomCalendars, fetchDeviceCalendars])
  );
  
  // Effect to update view date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate));
    }
  }, [selectedDate]);
  
  // Handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (user) {
      setRefreshing(true);
      
      // Determine date range based on current view mode
      let startDate: string;
      let endDate: string;
      
      if (viewMode === 'day') {
        startDate = startOfWeek(viewDate).toISOString();
        endDate = endOfWeek(viewDate).toISOString();
      } else if (viewMode === 'week') {
        startDate = startOfMonth(viewDate).toISOString();
        endDate = endOfMonth(viewDate).toISOString();
      } else {
        // For month view, get events for a three-month period
        startDate = startOfMonth(subMonths(viewDate, 1)).toISOString();
        endDate = endOfMonth(addMonths(viewDate, 1)).toISOString();
      }
      
      await Promise.all([
        fetchEvents(user.id, startDate, endDate),
        fetchCustomCalendars(user.id),
        fetchDeviceCalendars(),
      ]);
      
      setRefreshing(false);
    }
  }, [user, fetchEvents, fetchCustomCalendars, fetchDeviceCalendars, viewDate, viewMode]);
  
  // Get visible calendars (custom and device)
  const visibleCalendars = [
    ...customCalendars.filter(cal => cal.isVisible),
    ...deviceCalendars.filter(cal => cal.isVisible),
  ];
  
  // Get calendar by ID (custom or device)
  const getCalendarById = (calendarId?: string) => {
    if (!calendarId) return undefined;
    
    // Check custom calendars first
    const customCal = customCalendars.find(cal => cal.id === calendarId);
    if (customCal) return customCal;
    
    // Then check device calendars
    const deviceCal = deviceCalendars.find(cal => cal.id === calendarId);
    if (deviceCal) return deviceCal;
    
    return undefined;
  };
  
  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      // Check if event is visible (calendar is visible)
      const calendar = getCalendarById(event.calendarId);
      if (calendar && 'isVisible' in calendar && !calendar.isVisible) {
        return false;
      }
      
      // Check if the date is within the event's time range
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };
  
  // Navigate to previous period
  const goToPrevious = () => {
    if (viewMode === 'day') {
      setViewDate(addDays(viewDate, -1));
    } else if (viewMode === 'week') {
      setViewDate(addDays(viewDate, -7));
    } else {
      setViewDate(subMonths(viewDate, 1));
    }
  };
  
  // Navigate to next period
  const goToNext = () => {
    if (viewMode === 'day') {
      setViewDate(addDays(viewDate, 1));
    } else if (viewMode === 'week') {
      setViewDate(addDays(viewDate, 7));
    } else {
      setViewDate(addMonths(viewDate, 1));
    }
  };
  
  // Go to today
  const goToToday = () => {
    setViewDate(new Date());
  };
  
  // Format event time
  const formatEventTime = (event: CalendarEvent): string => {
    if (event.allDay) {
      return 'All day';
    }
    
    const startTime = format(new Date(event.startDate), 'h:mm a');
    const endTime = format(new Date(event.endDate), 'h:mm a');
    
    return `${startTime} - ${endTime}`;
  };
  
  // Change view mode
  const changeViewMode = (mode: CalendarViewMode) => {
    setViewMode(mode);
    setViewMenuVisible(false);
    
    // Fetch events for the new view mode
    if (user) {
      let startDate: string;
      let endDate: string;
      
      if (mode === 'day') {
        startDate = startOfWeek(viewDate).toISOString();
        endDate = endOfWeek(viewDate).toISOString();
      } else if (mode === 'week') {
        startDate = startOfMonth(viewDate).toISOString();
        endDate = endOfMonth(viewDate).toISOString();
      } else {
        // For month view, get events for a three-month period
        startDate = startOfMonth(subMonths(viewDate, 1)).toISOString();
        endDate = endOfMonth(addMonths(viewDate, 1)).toISOString();
      }
      
      fetchEvents(user.id, startDate, endDate);
    }
  };
  
  // Render Day View
  const renderDayView = () => {
    const dayEvents = getEventsForDate(viewDate);
    
    if (dayEvents.length === 0) {
      return (
        <View style={styles.emptyEventsContainer}>
          <Text style={[styles.emptyEventsText, { color: theme.colors.text }]}>
            No events scheduled for this day
          </Text>
        </View>
      );
    }
    
    // Sort events by start time
    const sortedEvents = [...dayEvents].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    return (
      <FlatList
        data={sortedEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => renderEventItem(item)}
        contentContainerStyle={styles.eventsList}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    );
  };
  
  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(viewDate);
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(viewDate),
    });
    
    return (
      <View style={styles.weekViewContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekHeaderScroll}
        >
          <View style={styles.weekHeader}>
            {weekDays.map(day => (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.weekDayHeader,
                  isToday(day) && { backgroundColor: theme.colors.primary + '40' },
                  isSameDay(day, viewDate) && styles.selectedDay,
                ]}
                onPress={() => {
                  setViewDate(day);
                  setSelectedDate(day.toISOString());
                }}
              >
                <Text style={[styles.weekDayName, { color: theme.colors.text }]}>
                  {format(day, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.weekDayNumber,
                    isToday(day) && { fontWeight: 'bold', color: theme.colors.primary },
                    isSameDay(day, viewDate) && { color: theme.colors.primary },
                    { color: theme.colors.text },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <Divider />
        
        {renderDayView()}
      </View>
    );
  };
  
  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group days into weeks
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    days.forEach((day, i) => {
      week.push(day);
      if (i % 7 === 6) {
        weeks.push(week);
        week = [];
      }
    });
    
    return (
      <View style={styles.monthViewContainer}>
        <View style={styles.weekdayHeaderRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text
              key={day}
              style={[styles.weekdayHeaderText, { color: theme.colors.text }]}
            >
              {day}
            </Text>
          ))}
        </View>
        
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.monthDaysContainer}>
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = getMonth(day) === getMonth(viewDate);
                  
                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[
                        styles.dayCell,
                        isSameDay(day, viewDate) && styles.selectedDayCell,
                        !isCurrentMonth && styles.otherMonthDay,
                      ]}
                      onPress={() => {
                        setViewDate(day);
                        setSelectedDate(day.toISOString());
                        setViewMode('day');
                      }}
                    >
                      <View
                        style={[
                          styles.dayCellContent,
                          isToday(day) && styles.todayCell,
                          isSameDay(day, viewDate) && styles.selectedDayCell,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            !isCurrentMonth && { opacity: 0.4 },
                            isToday(day) && styles.todayText,
                            isSameDay(day, viewDate) && { color: theme.colors.primary },
                            { color: theme.colors.text },
                          ]}
                        >
                          {format(day, 'd')}
                        </Text>
                        
                        {dayEvents.length > 0 && (
                          <View style={styles.eventDots}>
                            {dayEvents.slice(0, 3).map((event, i) => {
                              const calendar = getCalendarById(event.calendarId);
                              return (
                                <View
                                  key={`dot-${i}`}
                                  style={[
                                    styles.eventDot,
                                    {
                                      backgroundColor:
                                        event.color ||
                                        (calendar && 'color' in calendar
                                          ? calendar.color
                                          : theme.colors.primary),
                                    },
                                  ]}
                                />
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };
  
  // Render Event Item
  const renderEventItem = (event: CalendarEvent) => {
    const calendar = getCalendarById(event.calendarId);
    const eventColor = event.color || (calendar && 'color' in calendar ? calendar.color : theme.colors.primary);
    
    return (
      <TouchableOpacity
        style={styles.eventItem}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      >
        <View style={[styles.eventColorIndicator, { backgroundColor: eventColor }]} />
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
            {event.title}
          </Text>
          
          <Text style={[styles.eventTime, { color: theme.colors.text }]}>
            {formatEventTime(event)}
          </Text>
          
          {event.location && (
            <View style={styles.eventLocationRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.text} />
              <Text style={[styles.eventLocation, { color: theme.colors.text }]}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render view title
  const renderViewTitle = () => {
    if (viewMode === 'day') {
      return format(viewDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(viewDate);
      const weekEnd = endOfWeek(viewDate);
      
      if (getMonth(weekStart) === getMonth(weekEnd)) {
        return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`;
      } else if (getYear(weekStart) === getYear(weekEnd)) {
        return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'MMMM d, yyyy')}`;
      } else {
        return `${format(weekStart, 'MMMM d, yyyy')} - ${format(weekEnd, 'MMMM d, yyyy')}`;
      }
    } else {
      return format(viewDate, 'MMMM yyyy');
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerControls}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={goToPrevious}
            color={theme.colors.text}
          />
          
          <TouchableOpacity 
            style={styles.titleContainer}
            onPress={() => setViewMenuVisible(true)}
          >
            <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
              {renderViewTitle()}
            </Text>
            <MaterialCommunityIcons 
              name="chevron-down" 
              size={20} 
              color={theme.colors.primary} 
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
          
          <Menu
            visible={viewMenuVisible}
            onDismiss={() => setViewMenuVisible(false)}
            anchor={<View />}
            style={{ marginTop: 50 }}
          >
            <Menu.Item
              onPress={() => changeViewMode('day')}
              title="Day View"
              icon="calendar-day"
            />
            <Menu.Item
              onPress={() => changeViewMode('week')}
              title="Week View"
              icon="calendar-week"
            />
            <Menu.Item
              onPress={() => changeViewMode('month')}
              title="Month View"
              icon="calendar-month"
            />
            <Divider />
            <Menu.Item
              onPress={goToToday}
              title="Go to Today"
              icon="calendar-today"
            />
          </Menu>
          
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={goToNext}
            color={theme.colors.text}
          />
        </View>
        
        <View style={styles.headerActions}>
          <IconButton
            icon="calendar-check"
            size={24}
            onPress={() => setCalendarMenuVisible(true)}
            color={theme.colors.primary}
          />
          
          <Menu
            visible={calendarMenuVisible}
            onDismiss={() => setCalendarMenuVisible(false)}
            anchor={<View />}
            style={{ marginTop: 50 }}
          >
            <Menu.Item
              onPress={() => navigation.navigate('CalendarSettings')}
              title="Calendar Settings"
              icon="cog"
            />
            <Divider />
            <Menu.Item
              onPress={goToToday}
              title="Go to Today"
              icon="calendar-today"
            />
          </Menu>
        </View>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading events...
          </Text>
        </View>
      ) : viewMode === 'day' ? (
        renderDayView()
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        renderMonthView()
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateEvent', { date: viewDate.toISOString() })}
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
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEventsText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  eventsList: {
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    padding: 16,
  },
  eventColorIndicator: {
    width: 4,
    marginRight: 12,
    borderRadius: 2,
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
    opacity: 0.7,
    marginBottom: 4,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 4,
  },
  divider: {
    marginLeft: 16,
  },
  weekViewContainer: {
    flex: 1,
  },
  weekHeaderScroll: {
    maxHeight: 80,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  weekDayHeader: {
    width: 60,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedDay: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  weekDayName: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '500',
  },
  monthViewContainer: {
    flex: 1,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  weekdayHeaderText: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  monthDaysContainer: {
    flex: 1,
    padding: 8,
  },
  weekRow: {
    flexDirection: 'row',
    height: 70,
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    margin: 2,
    borderRadius: 8,
  },
  dayCellContent: {
    flex: 1,
    padding: 4,
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    marginBottom: 2,
  },
  todayCell: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
  },
  todayText: {
    fontWeight: 'bold',
  },
  selectedDayCell: {
    borderWidth: 1,
    borderColor: 'rgba(0, 123, 255, 0.5)',
    borderRadius: 8,
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  eventDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  moreEvents: {
    fontSize: 8,
    marginLeft: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CalendarScreen;
