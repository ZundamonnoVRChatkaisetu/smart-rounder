import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Switch,
  Text,
  IconButton,
  Menu,
  Divider,
  Chip,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TasksStackParamList } from '../../navigation/feature/TasksNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useTaskStore from '../../stores/useTaskStore';
import { Task, TaskCategory } from '../../models/Task';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, isValid } from 'date-fns';

type CreateTaskScreenNavigationProp = StackNavigationProp<TasksStackParamList, 'CreateTask'>;
type CreateTaskScreenRouteProp = RouteProp<TasksStackParamList, 'CreateTask'>;

const CreateTaskScreen: React.FC = () => {
  const navigation = useNavigation<CreateTaskScreenNavigationProp>();
  const route = useRoute<CreateTaskScreenRouteProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { notificationsEnabled } = useNotifications();
  
  const { categories, addTask } = useTaskStore();
  
  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(
    route.params?.dueDate ? parseISO(route.params.dueDate) : null
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [categoryId, setCategoryId] = useState<string | undefined>(route.params?.categoryId);
  const [tags, setTags] = useState<string[]>([]);
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [repeatMenuVisible, setRepeatMenuVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Create task
  const handleCreateTask = async () => {
    if (!title) {
      setError('Please enter a task title');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a task');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        description: description || undefined,
        completed: false,
        dueDate: dueDate?.toISOString(),
        priority,
        categoryId,
        tags: tags.length > 0 ? tags : undefined,
        remindAt: reminder && reminderTime ? reminderTime.toISOString() : undefined,
        userId: user.id,
        repeatType: repeat === 'none' ? undefined : repeat,
      };
      
      await addTask(task);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create task:', error);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Date picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setDueDate(selectedDate);
      
      // If we set a due date and reminder is enabled but no reminder time,
      // set a default reminder time (1 hour before due date)
      if (reminder && !reminderTime) {
        const defaultReminderTime = new Date(selectedDate);
        defaultReminderTime.setHours(defaultReminderTime.getHours() - 1);
        setReminderTime(defaultReminderTime);
      }
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };
  
  // Tag handling
  const addTag = () => {
    if (tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Get category by ID
  const getCategoryById = (id?: string): TaskCategory | undefined => {
    if (!id) return undefined;
    return categories.find(category => category.id === id);
  };
  
  // Priority colors
  const getPriorityColor = (priorityLevel: 'low' | 'medium' | 'high'): string => {
    switch (priorityLevel) {
      case 'low':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FF9800'; // Orange
      case 'high':
        return '#F44336'; // Red
      default:
        return '#FF9800'; // Default to medium
    }
  };
  
  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not set';
    return format(date, 'EEE, MMM d, yyyy');
  };
  
  // Format time for display
  const formatTime = (date: Date | null): string => {
    if (!date) return 'Not set';
    return format(date, 'h:mm a');
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <TextInput
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: theme.colors.primary } }}
          />
          
          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}
          
          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            theme={{ colors: { primary: theme.colors.primary } }}
          />
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Due Date</Text>
            <View style={styles.dateContainer}>
              <Text style={{ color: theme.colors.text }}>
                {dueDate ? formatDate(dueDate) : 'Not set'}
              </Text>
              <IconButton
                icon="calendar"
                size={24}
                color={theme.colors.primary}
                onPress={() => setShowDatePicker(true)}
              />
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Priority</Text>
            <View style={styles.menuContainer}>
              <Button
                mode="outlined"
                onPress={() => setPriorityMenuVisible(true)}
                style={[
                  styles.dropdown,
                  { borderColor: getPriorityColor(priority) }
                ]}
                color={getPriorityColor(priority)}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Button>
              <Menu
                visible={priorityMenuVisible}
                onDismiss={() => setPriorityMenuVisible(false)}
                anchor={<View />}
              >
                <Menu.Item
                  onPress={() => {
                    setPriority('low');
                    setPriorityMenuVisible(false);
                  }}
                  title="Low"
                  titleStyle={{ color: getPriorityColor('low') }}
                />
                <Menu.Item
                  onPress={() => {
                    setPriority('medium');
                    setPriorityMenuVisible(false);
                  }}
                  title="Medium"
                  titleStyle={{ color: getPriorityColor('medium') }}
                />
                <Menu.Item
                  onPress={() => {
                    setPriority('high');
                    setPriorityMenuVisible(false);
                  }}
                  title="High"
                  titleStyle={{ color: getPriorityColor('high') }}
                />
              </Menu>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Category</Text>
            <View style={styles.menuContainer}>
              <Button
                mode="outlined"
                onPress={() => setCategoryMenuVisible(true)}
                style={styles.dropdown}
                color={getCategoryById(categoryId)?.color || theme.colors.primary}
              >
                {getCategoryById(categoryId)?.name || 'No Category'}
              </Button>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={<View />}
              >
                <Menu.Item
                  onPress={() => {
                    setCategoryId(undefined);
                    setCategoryMenuVisible(false);
                  }}
                  title="No Category"
                />
                <Divider />
                {categories.map(category => (
                  <Menu.Item
                    key={category.id}
                    onPress={() => {
                      setCategoryId(category.id);
                      setCategoryMenuVisible(false);
                    }}
                    title={category.name}
                    titleStyle={{ color: category.color }}
                    left={props => (
                      <View
                        style={[
                          styles.categoryIndicator,
                          { backgroundColor: category.color }
                        ]}
                      />
                    )}
                  />
                ))}
              </Menu>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tagInput}>
                <TextInput
                  label="Add Tag"
                  value={tagInput}
                  onChangeText={setTagInput}
                  style={styles.smallInput}
                  mode="outlined"
                  theme={{ colors: { primary: theme.colors.primary } }}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <IconButton
                  icon="plus"
                  size={24}
                  color={theme.colors.primary}
                  onPress={addTag}
                  disabled={!tagInput.trim()}
                />
              </View>
              
              <View style={styles.tagChips}>
                {tags.map(tag => (
                  <Chip
                    key={tag}
                    mode="outlined"
                    style={styles.tagChip}
                    onClose={() => removeTag(tag)}
                    onPress={() => removeTag(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Reminder</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              color={theme.colors.primary}
              disabled={!notificationsEnabled}
            />
          </View>
          
          {reminder && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Reminder Time</Text>
              <View style={styles.dateContainer}>
                <Text style={{ color: theme.colors.text }}>
                  {reminderTime ? formatTime(reminderTime) : 'Not set'}
                </Text>
                <IconButton
                  icon="clock-outline"
                  size={24}
                  color={theme.colors.primary}
                  onPress={() => setShowTimePicker(true)}
                />
              </View>
              {showTimePicker && (
                <DateTimePicker
                  value={reminderTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Repeat</Text>
            <View style={styles.menuContainer}>
              <Button
                mode="outlined"
                onPress={() => setRepeatMenuVisible(true)}
                style={styles.dropdown}
                color={theme.colors.primary}
              >
                {repeat === 'none' ? 'No Repeat' : repeat.charAt(0).toUpperCase() + repeat.slice(1)}
              </Button>
              <Menu
                visible={repeatMenuVisible}
                onDismiss={() => setRepeatMenuVisible(false)}
                anchor={<View />}
              >
                <Menu.Item
                  onPress={() => {
                    setRepeat('none');
                    setRepeatMenuVisible(false);
                  }}
                  title="No Repeat"
                />
                <Menu.Item
                  onPress={() => {
                    setRepeat('daily');
                    setRepeatMenuVisible(false);
                  }}
                  title="Daily"
                />
                <Menu.Item
                  onPress={() => {
                    setRepeat('weekly');
                    setRepeatMenuVisible(false);
                  }}
                  title="Weekly"
                />
                <Menu.Item
                  onPress={() => {
                    setRepeat('monthly');
                    setRepeatMenuVisible(false);
                  }}
                  title="Monthly"
                />
                <Menu.Item
                  onPress={() => {
                    setRepeat('yearly');
                    setRepeatMenuVisible(false);
                  }}
                  title="Yearly"
                />
              </Menu>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
              color={theme.colors.text}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateTask}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading || !title}
            >
              Create Task
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  smallInput: {
    flex: 1,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuContainer: {
    position: 'relative',
  },
  dropdown: {
    minWidth: 150,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  divider: {
    marginVertical: 8,
  },
  tagsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    margin: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default CreateTaskScreen;
