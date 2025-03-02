import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Checkbox,
  Searchbar,
  FAB,
  Divider,
  Menu,
  IconButton,
  useTheme as usePaperTheme,
  List,
  Avatar,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TasksStackParamList } from '../../navigation/feature/TasksNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useTaskStore from '../../stores/useTaskStore';
import { Task, TaskCategory, TaskFilter, TaskSortOption } from '../../models/Task';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';

type TasksScreenNavigationProp = StackNavigationProp<TasksStackParamList, 'TasksList'>;

const TasksScreen: React.FC = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const {
    tasks,
    categories,
    isLoading,
    error,
    filter,
    sortOption,
    fetchTasks,
    fetchCategories,
    toggleTaskCompletion,
    setFilter,
    setSortOption,
    resetFilter,
  } = useTaskStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  
  // Fetch tasks and categories when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchTasks(user.id);
        fetchCategories(user.id);
      }
    }, [user, fetchTasks, fetchCategories])
  );
  
  // Effect to update search filter when search query changes
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setFilter({ ...filter, search: searchQuery.trim() });
    } else if (filter.search) {
      const { search, ...restFilter } = filter;
      setFilter(restFilter);
    }
  }, [searchQuery, setFilter, filter]);
  
  // Handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await Promise.all([
        fetchTasks(user.id),
        fetchCategories(user.id),
      ]);
      setRefreshing(false);
    }
  }, [user, fetchTasks, fetchCategories]);
  
  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Skip if task is marked as completed if we're filtering for incomplete tasks
    if (filter.completed !== undefined && task.completed !== filter.completed) {
      return false;
    }
    
    // Skip if task doesn't match the category filter
    if (filter.categoryId && task.categoryId !== filter.categoryId) {
      return false;
    }
    
    // Skip if task doesn't match the priority filter
    if (filter.priority && task.priority !== filter.priority) {
      return false;
    }
    
    // Skip if task doesn't match the search query
    if (filter.search && !task.title.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    
    // Skip if task doesn't match the due date filter
    if (filter.dueDate && task.dueDate) {
      const filterDate = new Date(filter.dueDate);
      const taskDate = new Date(task.dueDate);
      
      // Compare dates ignoring time
      if (
        filterDate.getFullYear() !== taskDate.getFullYear() ||
        filterDate.getMonth() !== taskDate.getMonth() ||
        filterDate.getDate() !== taskDate.getDate()
      ) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortOption) {
      case 'dueDate-asc':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        
      case 'dueDate-desc':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        
      case 'priority-asc':
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
        
      case 'priority-desc':
        const priorityOrderDesc = { low: 2, medium: 1, high: 0 };
        return priorityOrderDesc[a.priority] - priorityOrderDesc[b.priority];
        
      case 'title-asc':
        return a.title.localeCompare(b.title);
        
      case 'title-desc':
        return b.title.localeCompare(a.title);
        
      case 'createdAt-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        
      case 'createdAt-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
      default:
        return 0;
    }
  });
  
  // Group tasks by date for section list
  const groupedTasks: { [key: string]: Task[] } = {};
  
  sortedTasks.forEach(task => {
    let group = 'No Due Date';
    
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      
      if (isPast(date) && !isToday(date)) {
        group = 'Overdue';
      } else if (isToday(date)) {
        group = 'Today';
      } else if (isTomorrow(date)) {
        group = 'Tomorrow';
      } else if (date <= addDays(new Date(), 7)) {
        group = 'This Week';
      } else {
        group = 'Later';
      }
    }
    
    if (!groupedTasks[group]) {
      groupedTasks[group] = [];
    }
    
    groupedTasks[group].push(task);
  });
  
  // Convert grouped tasks to sections for section list
  const sections = Object.entries(groupedTasks).map(([title, data]) => ({
    title,
    data,
  }));
  
  // Get category by ID
  const getCategoryById = (categoryId?: string): TaskCategory | undefined => {
    if (!categoryId) return undefined;
    return categories.find(category => category.id === categoryId);
  };
  
  // Format due date
  const formatDueDate = (dueDate?: string): string => {
    if (!dueDate) return '';
    
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  // Render priority icon
  const renderPriorityIcon = (priority: 'low' | 'medium' | 'high') => {
    const size = 16;
    
    switch (priority) {
      case 'high':
        return <MaterialIcons name="priority-high" size={size} color="red" />;
      case 'medium':
        return <MaterialIcons name="fiber-manual-record" size={size} color="orange" />;
      case 'low':
        return <MaterialIcons name="arrow-downward" size={size} color="green" />;
      default:
        return null;
    }
  };
  
  // Render task item
  const renderTaskItem = ({ item }: { item: Task }) => {
    const category = getCategoryById(item.categoryId);
    const isDueDatePast = item.dueDate ? isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) : false;
    
    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          { backgroundColor: theme.colors.card }
        ]}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
      >
        <View style={styles.taskHeader}>
          <Checkbox
            status={item.completed ? 'checked' : 'unchecked'}
            onPress={() => toggleTaskCompletion(item.id)}
            color={theme.colors.primary}
          />
          <View style={styles.taskTitleContainer}>
            <Text
              style={[
                styles.taskTitle,
                { color: theme.colors.text },
                item.completed && styles.completedTask,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            
            {item.description ? (
              <Text
                style={[
                  styles.taskDescription,
                  { color: theme.colors.text },
                  item.completed && styles.completedTask,
                ]}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>
        
        <View style={styles.taskFooter}>
          {category ? (
            <View
              style={[
                styles.categoryTag,
                { backgroundColor: category.color || theme.colors.primary }
              ]}
            >
              <Text style={styles.categoryText} numberOfLines={1}>
                {category.name}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.taskMeta}>
            {renderPriorityIcon(item.priority)}
            
            {item.dueDate ? (
              <Text
                style={[
                  styles.dueDate,
                  isDueDatePast && !item.completed && styles.overdueDueDate,
                ]}
              >
                {formatDueDate(item.dueDate)}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render section header
  const renderSectionHeader = ({ section }: { section: { title: string; data: Task[] } }) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background }
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        {section.title} ({section.data.length})
      </Text>
      <Divider style={styles.divider} />
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search tasks"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.card }]}
          iconColor={theme.colors.primary}
          inputStyle={{ color: theme.colors.text }}
          placeholderTextColor={theme.colors.text + '80'}
        />
        
        <View style={styles.filterRow}>
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
                setFilter({ ...filter, completed: false });
                setFilterMenuVisible(false);
              }}
              title="Incomplete Tasks"
              icon="checkbox-blank-outline"
            />
            <Menu.Item
              onPress={() => {
                setFilter({ ...filter, completed: true });
                setFilterMenuVisible(false);
              }}
              title="Completed Tasks"
              icon="checkbox-marked"
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
                setSortOption('dueDate-asc');
                setSortMenuVisible(false);
              }}
              title="Due Date (Ascending)"
              icon="calendar-arrow-right"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('dueDate-desc');
                setSortMenuVisible(false);
              }}
              title="Due Date (Descending)"
              icon="calendar-arrow-left"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('priority-desc');
                setSortMenuVisible(false);
              }}
              title="Priority (High to Low)"
              icon="arrow-up-bold"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('priority-asc');
                setSortMenuVisible(false);
              }}
              title="Priority (Low to High)"
              icon="arrow-down-bold"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('title-asc');
                setSortMenuVisible(false);
              }}
              title="Title (A-Z)"
              icon="sort-alphabetical-ascending"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('title-desc');
                setSortMenuVisible(false);
              }}
              title="Title (Z-A)"
              icon="sort-alphabetical-descending"
            />
          </Menu>
        </View>
      </View>
      
      <FlatList
        data={sections}
        keyExtractor={section => section.title}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            {renderSectionHeader({ section })}
            <FlatList
              data={section.data}
              keyExtractor={item => item.id}
              renderItem={renderTaskItem}
              ItemSeparatorComponent={() => <Divider style={{ marginLeft: 58 }} />}
            />
          </View>
        )}
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
        onPress={() => navigation.navigate('CreateTask', {})}
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
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginTop: 8,
  },
  taskItem: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 42,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  overdueDueDate: {
    color: 'red',
    opacity: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TasksScreen;
