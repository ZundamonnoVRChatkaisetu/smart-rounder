import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  Divider,
  Menu,
  IconButton,
  useTheme as usePaperTheme,
  Card,
  Chip,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NotesStackParamList } from '../../navigation/feature/NotesNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useNoteStore from '../../stores/useNoteStore';
import { Note, NoteFolder, NoteSortOption } from '../../models/Note';
import { format } from 'date-fns';

type NotesScreenNavigationProp = StackNavigationProp<NotesStackParamList, 'NotesList'>;

const NotesScreen: React.FC = () => {
  const navigation = useNavigation<NotesScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const {
    notes,
    folders,
    isLoading,
    filter,
    sortOption,
    fetchNotes,
    fetchFolders,
    togglePinned,
    toggleArchived,
    setFilter,
    setSortOption,
    resetFilter,
  } = useNoteStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  
  // Calculate the number of columns based on screen width
  const screenWidth = Dimensions.get('window').width;
  const numColumns = viewMode === 'grid' ? Math.floor(screenWidth / 180) : 1;
  
  // Fetch notes and folders when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchNotes(user.id);
        fetchFolders(user.id);
      }
    }, [user, fetchNotes, fetchFolders])
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
  
  // Effect to update folder filter when selected folder changes
  useEffect(() => {
    if (selectedFolder) {
      setFilter({ ...filter, folderId: selectedFolder });
    } else if (filter.folderId) {
      const { folderId, ...restFilter } = filter;
      setFilter(restFilter);
    }
  }, [selectedFolder, setFilter, filter]);
  
  // Handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await Promise.all([
        fetchNotes(user.id),
        fetchFolders(user.id),
      ]);
      setRefreshing(false);
    }
  }, [user, fetchNotes, fetchFolders]);
  
  // Filter notes based on current filters
  const filteredNotes = notes.filter(note => {
    // Skip if note is archived and we're not showing archived notes
    if (filter.isArchived !== true && note.isArchived) {
      return false;
    }
    
    // Skip if we're showing only archived notes but the note is not archived
    if (filter.isArchived === true && !note.isArchived) {
      return false;
    }
    
    // Skip if note doesn't match the folder filter
    if (filter.folderId && note.folderId !== filter.folderId) {
      return false;
    }
    
    // Skip if note doesn't match the pinned filter
    if (filter.isPinned === true && !note.isPinned) {
      return false;
    }
    
    // Skip if note doesn't match the search query
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Sort filtered notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // Always put pinned notes at the top regardless of sort option
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch (sortOption) {
      case 'title-asc':
        return a.title.localeCompare(b.title);
        
      case 'title-desc':
        return b.title.localeCompare(a.title);
        
      case 'createdAt-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        
      case 'createdAt-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
      case 'updatedAt-asc':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        
      case 'updatedAt-desc':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
      default:
        return 0;
    }
  });
  
  // Get folder by ID
  const getFolderById = (folderId?: string): NoteFolder | undefined => {
    if (!folderId) return undefined;
    return folders.find(folder => folder.id === folderId);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Handle note press
  const handleNotePress = (noteId: string) => {
    navigation.navigate('NoteDetail', { noteId });
  };
  
  // Handle note long press
  const handleNoteLongPress = (note: Note) => {
    // Show options menu for the note
  };
  
  // Render note item in grid view
  const renderNoteGridItem = ({ item }: { item: Note }) => {
    const folder = getFolderById(item.folderId);
    const noteColor = item.color || theme.colors.card;
    
    return (
      <TouchableOpacity
        style={[styles.gridItem, { margin: 6 }]}
        onPress={() => handleNotePress(item.id)}
        onLongPress={() => handleNoteLongPress(item)}
      >
        <Card
          style={[
            styles.noteCard,
            { backgroundColor: noteColor }
          ]}
        >
          <Card.Content style={styles.noteContent}>
            <View style={styles.noteHeader}>
              <Text
                style={[styles.noteTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              
              {item.isPinned && (
                <IconButton
                  icon="pin"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.pinIcon}
                  onPress={() => togglePinned(item.id)}
                />
              )}
            </View>
            
            <Text
              style={[styles.notePreview, { color: theme.colors.text }]}
              numberOfLines={6}
            >
              {item.content}
            </Text>
            
            <View style={styles.noteFooter}>
              <Text style={[styles.noteDate, { color: theme.colors.text }]}>
                {formatDate(item.updatedAt)}
              </Text>
              
              {folder && (
                <Chip
                  style={[styles.folderChip, { backgroundColor: folder.color || theme.colors.primary }]}
                  textStyle={{ color: 'white', fontSize: 10 }}
                  onPress={() => setSelectedFolder(folder.id)}
                >
                  {folder.name}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  // Render note item in list view
  const renderNoteListItem = ({ item }: { item: Note }) => {
    const folder = getFolderById(item.folderId);
    const noteColor = item.color || theme.colors.card;
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleNotePress(item.id)}
        onLongPress={() => handleNoteLongPress(item)}
      >
        <Card
          style={[
            styles.noteListCard,
            { backgroundColor: noteColor }
          ]}
        >
          <Card.Content style={styles.noteListContent}>
            <View style={styles.noteListHeader}>
              <Text
                style={[styles.noteTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              
              <View style={styles.noteListActions}>
                {item.isPinned && (
                  <IconButton
                    icon="pin"
                    size={16}
                    color={theme.colors.primary}
                    style={styles.pinIcon}
                    onPress={() => togglePinned(item.id)}
                  />
                )}
              </View>
            </View>
            
            <Text
              style={[styles.notePreview, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
            
            <View style={styles.noteListFooter}>
              <Text style={[styles.noteDate, { color: theme.colors.text }]}>
                {formatDate(item.updatedAt)}
              </Text>
              
              {folder && (
                <Chip
                  style={[styles.folderChip, { backgroundColor: folder.color || theme.colors.primary }]}
                  textStyle={{ color: 'white', fontSize: 10 }}
                  onPress={() => setSelectedFolder(folder.id)}
                >
                  {folder.name}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  // Render empty list message
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyMessage, { color: theme.colors.text }]}>
        {searchQuery.trim() !== '' ? 'No notes match your search.' : 'No notes yet. Create your first note!'}
      </Text>
    </View>
  );
  
  // Render folder chips
  const renderFolderChips = () => {
    if (folders.length === 0) return null;
    
    return (
      <View style={styles.folderChipsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderChipsContent}
        >
          <Chip
            selected={selectedFolder === undefined}
            style={[
              styles.folderFilterChip,
              selectedFolder === undefined ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card }
            ]}
            textStyle={{ 
              color: selectedFolder === undefined ? 'white' : theme.colors.text,
              fontSize: 12
            }}
            onPress={() => setSelectedFolder(undefined)}
          >
            All Notes
          </Chip>
          
          {folders.map(folder => (
            <Chip
              key={folder.id}
              selected={selectedFolder === folder.id}
              style={[
                styles.folderFilterChip,
                selectedFolder === folder.id
                  ? { backgroundColor: folder.color || theme.colors.primary }
                  : { backgroundColor: theme.colors.card }
              ]}
              textStyle={{ 
                color: selectedFolder === folder.id ? 'white' : theme.colors.text,
                fontSize: 12
              }}
              onPress={() => setSelectedFolder(folder.id === selectedFolder ? undefined : folder.id)}
            >
              {folder.name}
            </Chip>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search notes"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.card }]}
          iconColor={theme.colors.primary}
          inputStyle={{ color: theme.colors.text }}
          placeholderTextColor={theme.colors.text + '80'}
        />
        
        <View style={styles.actionRow}>
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
                setFilter({ ...filter, isPinned: true });
                setFilterMenuVisible(false);
              }}
              title="Pinned Notes"
              icon="pin"
            />
            <Menu.Item
              onPress={() => {
                setFilter({ ...filter, isArchived: true });
                setFilterMenuVisible(false);
              }}
              title="Archived Notes"
              icon="archive"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                resetFilter();
                setSelectedFolder(undefined);
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
                setSortOption('updatedAt-desc');
                setSortMenuVisible(false);
              }}
              title="Last Updated"
              icon="update"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('createdAt-desc');
                setSortMenuVisible(false);
              }}
              title="Date Created"
              icon="creation"
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
          
          <IconButton
            icon={viewMode === 'grid' ? 'view-list' : 'view-grid'}
            size={24}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            color={theme.colors.text}
          />
        </View>
      </View>
      
      {renderFolderChips()}
      
      <FlatList
        data={sortedNotes}
        keyExtractor={item => item.id}
        renderItem={viewMode === 'grid' ? renderNoteGridItem : renderNoteListItem}
        numColumns={viewMode === 'grid' ? numColumns : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          styles.notesList,
          sortedNotes.length === 0 && styles.emptyList
        ]}
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
        onPress={() => navigation.navigate('CreateNote', {})}
        color={paperTheme.colors.surface}
      />
    </View>
  );
};

// Needed for the folder chips
import { ScrollView } from 'react-native';

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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  folderChipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  folderChipsContent: {
    paddingVertical: 4,
  },
  folderFilterChip: {
    marginRight: 8,
  },
  notesList: {
    padding: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItem: {
    flex: 1,
    maxWidth: `${100 / Math.floor(Dimensions.get('window').width / 180)}%`,
  },
  listItem: {
    marginBottom: 12,
    marginHorizontal: 6,
  },
  noteCard: {
    height: 200,
    overflow: 'hidden',
  },
  noteListCard: {
    overflow: 'hidden',
  },
  noteContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  noteListContent: {
    minHeight: 100,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  notePreview: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    flex: 1,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  noteListActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  folderChip: {
    height: 20,
    paddingHorizontal: 4,
  },
  pinIcon: {
    margin: 0,
    padding: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyMessage: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default NotesScreen;
