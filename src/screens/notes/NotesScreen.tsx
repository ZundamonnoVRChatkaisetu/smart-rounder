import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
  Chip,
  Card,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NotesStackParamList } from '../../navigation/feature/NotesNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useNoteStore from '../../stores/useNoteStore';
import { Note, NoteFolder, NoteFilter, NoteSortOption } from '../../models/Note';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';

type NotesScreenNavigationProp = StackNavigationProp<NotesStackParamList, 'NotesList'>;

const { width } = Dimensions.get('window');
const numColumns = width > 600 ? 3 : 2;

const NotesScreen: React.FC = () => {
  const navigation = useNavigation<NotesScreenNavigationProp>();
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const {
    notes,
    folders,
    isLoading,
    error,
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
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
    // Skip if note is archived and we're not explicitly viewing archived notes
    if (filter.isArchived === undefined && note.isArchived) {
      return false;
    }
    
    // Skip if note doesn't match the archive filter
    if (filter.isArchived !== undefined && note.isArchived !== filter.isArchived) {
      return false;
    }
    
    // Skip if note doesn't match the folder filter
    if (filter.folderId && note.folderId !== filter.folderId) {
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
  
  // Separate pinned notes
  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);
  
  // Sort notes
  const sortNotes = (notesToSort: Note[]): Note[] => {
    return [...notesToSort].sort((a, b) => {
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
  };
  
  const sortedPinnedNotes = sortNotes(pinnedNotes);
  const sortedUnpinnedNotes = sortNotes(unpinnedNotes);
  
  // Get folder by ID
  const getFolderById = (folderId?: string): NoteFolder | undefined => {
    if (!folderId) return undefined;
    return folders.find(folder => folder.id === folderId);
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Handle note long press
  const handleNoteLongPress = (note: Note) => {
    setSelectedNote(note);
    setMenuVisible(true);
  };
  
  // Render note card
  const renderNoteCard = ({ item }: { item: Note }) => {
    const folder = getFolderById(item.folderId);
    const cardColor = item.color || (folder?.color ? `${folder.color}40` : undefined);
    
    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        onLongPress={() => handleNoteLongPress(item)}
      >
        <Card
          style={[
            styles.card,
            {
              backgroundColor: cardColor || theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Card.Content style={styles.cardContent}>
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
                />
              )}
            </View>
            
            <Text
              style={[styles.noteContent, { color: theme.colors.text }]}
              numberOfLines={5}
            >
              {item.content}
            </Text>
            
            <View style={styles.noteFooter}>
              {folder && (
                <Chip
                  style={[styles.folderChip, { backgroundColor: folder.color }]}
                  textStyle={styles.folderChipText}
                  compact
                >
                  {folder.name}
                </Chip>
              )}
              
              <Text style={[styles.dateText, { color: theme.colors.text + '80' }]}>
                {formatDate(item.updatedAt)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  // Render section header
  const renderSectionHeader = (title: string) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background }
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        {title}
      </Text>
      <Divider style={styles.divider} />
    </View>
  );
  
  // Render folder chips
  const renderFolderChips = () => {
    if (folders.length === 0) return null;
    
    return (
      <View style={styles.folderChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={!filter.folderId}
            onPress={() => {
              const { folderId, ...restFilter } = filter;
              setFilter(restFilter);
            }}
            style={[
              styles.filterChip,
              { backgroundColor: !filter.folderId ? theme.colors.primary : theme.colors.card }
            ]}
            textStyle={{
              color: !filter.folderId ? 'white' : theme.colors.text
            }}
          >
            All Notes
          </Chip>
          
          {folders.map(folder => (
            <Chip
              key={folder.id}
              selected={filter.folderId === folder.id}
              onPress={() => setFilter({ ...filter, folderId: folder.id })}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter.folderId === folder.id
                    ? folder.color
                    : theme.colors.card
                }
              ]}
              textStyle={{
                color: filter.folderId === folder.id ? 'white' : theme.colors.text
              }}
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
        
        <View style={styles.filterRow}>
          <IconButton
            icon={filter.isArchived ? "archive" : "note"}
            size={24}
            onPress={() => setFilterMenuVisible(true)}
            color={filter.isArchived ? theme.colors.primary : theme.colors.text}
          />
          
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={<View />}
            style={{ marginTop: 50 }}
          >
            <Menu.Item
              onPress={() => {
                const { isArchived, ...restFilter } = filter;
                setFilter(restFilter);
                setFilterMenuVisible(false);
              }}
              title="Active Notes"
              icon="note"
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
              title="Last Modified"
              icon="clock-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortOption('createdAt-desc');
                setSortMenuVisible(false);
              }}
              title="Date Created"
              icon="calendar-plus"
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
        data={[
          ...(sortedPinnedNotes.length > 0 ? [{ type: 'header', title: 'Pinned' }] : []),
          ...(sortedPinnedNotes.length > 0
            ? sortedPinnedNotes.map(note => ({ type: 'note', data: note }))
            : []),
          ...(sortedPinnedNotes.length > 0 && sortedUnpinnedNotes.length > 0
            ? [{ type: 'header', title: 'Other Notes' }]
            : []),
          ...sortedUnpinnedNotes.map(note => ({ type: 'note', data: note })),
        ]}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        numColumns={numColumns}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title);
          } else {
            return renderNoteCard({ item: item.data });
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
      
      <Menu
        visible={menuVisible && selectedNote !== null}
        onDismiss={() => {
          setMenuVisible(false);
          setSelectedNote(null);
        }}
        anchor={<View />}
      >
        <Menu.Item
          onPress={() => {
            if (selectedNote) {
              togglePinned(selectedNote.id);
              setMenuVisible(false);
              setSelectedNote(null);
            }
          }}
          title={selectedNote?.isPinned ? 'Unpin' : 'Pin'}
          icon={selectedNote?.isPinned ? 'pin-off' : 'pin'}
        />
        <Menu.Item
          onPress={() => {
            if (selectedNote) {
              toggleArchived(selectedNote.id);
              setMenuVisible(false);
              setSelectedNote(null);
            }
          }}
          title={selectedNote?.isArchived ? 'Unarchive' : 'Archive'}
          icon={selectedNote?.isArchived ? 'package-up' : 'archive'}
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            if (selectedNote) {
              navigation.navigate('NoteDetail', { noteId: selectedNote.id });
              setMenuVisible(false);
              setSelectedNote(null);
            }
          }}
          title="Edit"
          icon="pencil"
        />
        <Menu.Item
          onPress={() => {
            if (selectedNote) {
              Alert.alert(
                'Delete Note',
                'Are you sure you want to delete this note?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // We would call deleteNote here if it was implemented
                        // await deleteNote(selectedNote.id);
                        Alert.alert('Delete functionality to be implemented');
                      } catch (error) {
                        console.error('Failed to delete note:', error);
                        Alert.alert('Error', 'Failed to delete note');
                      }
                    },
                  },
                ]
              );
              setMenuVisible(false);
              setSelectedNote(null);
            }
          }}
          title="Delete"
          icon="delete"
        />
      </Menu>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateNote', {})}
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
  folderChipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginTop: 8,
  },
  cardContainer: {
    width: `${100 / numColumns}%`,
    padding: 8,
  },
  card: {
    borderWidth: 1,
    elevation: 1,
  },
  cardContent: {
    padding: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  pinIcon: {
    margin: 0,
    padding: 0,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  folderChip: {
    height: 20,
  },
  folderChipText: {
    fontSize: 10,
    color: 'white',
  },
  dateText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default NotesScreen;
