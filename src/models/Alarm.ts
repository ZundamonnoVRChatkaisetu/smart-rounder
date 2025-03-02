export interface Alarm {
  id: string;
  name: string;
  hour: number; // 24-hour format (0-23)
  minute: number; // 0-59
  days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>; // 0 = Sunday, 1 = Monday, etc. Empty for one-time alarms
  enabled: boolean;
  soundName: string;
  vibrate: boolean;
  snoozeMinutes: number;
  gradualVolume: boolean;
  notes?: string;
  isOneTime: boolean;
  date?: string; // ISO date string for one-time alarms
  notificationIds: string[]; // IDs for scheduled notifications
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string;
}

export interface AlarmSound {
  id: string;
  name: string;
  url: string;
  isBuiltIn: boolean;
}

export type AlarmFilter = {
  enabled?: boolean;
  isOneTime?: boolean;
};

export type AlarmSortOption = 
  | 'time-asc' 
  | 'time-desc' 
  | 'name-asc' 
  | 'name-desc'
  | 'createdAt-asc'
  | 'createdAt-desc';
