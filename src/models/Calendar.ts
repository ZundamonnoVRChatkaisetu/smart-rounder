export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO format date string
  endDate: string; // ISO format date string
  allDay: boolean;
  color?: string;
  calendarId?: string;
  recurrence?: RecurrenceRule;
  reminders?: Reminder[];
  url?: string;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
  userId: string;
  syncId?: string; // ID for synced events (from device calendar)
  notificationIds?: string[]; // IDs for scheduled notifications
}

export interface CustomCalendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCalendar {
  id: string;
  title: string;
  entityType?: string;
  source: {
    id: string;
    name: string;
    type: string;
  };
  color?: string;
  allowsModifications: boolean;
  isVisible: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: string;
  count?: number;
  byDay?: Array<'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'>;
  byMonthDay?: number[];
  byMonth?: number[];
}

export interface Reminder {
  id: string;
  minutes: number;
  notificationId?: string;
}

export type EventFilter = {
  calendarId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};

export type EventSortOption = 
  | 'startDate-asc' 
  | 'startDate-desc' 
  | 'title-asc' 
  | 'title-desc'
  | 'createdAt-asc'
  | 'createdAt-desc';
