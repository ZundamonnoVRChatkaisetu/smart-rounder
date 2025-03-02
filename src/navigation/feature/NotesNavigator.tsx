import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';

// Import screens
import NotesScreen from '../../screens/notes/NotesScreen';
import NoteDetailScreen from '../../screens/notes/NoteDetailScreen';
import CreateNoteScreen from '../../screens/notes/CreateNoteScreen';
import NoteFoldersScreen from '../../screens/notes/NoteFoldersScreen';
import NoteSearchScreen from '../../screens/notes/NoteSearchScreen';

// Define the notes stack navigator param list
export type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
  CreateNote: { folderId?: string };
  NoteFolders: undefined;
  NoteSearch: undefined;
};

const Stack = createStackNavigator<NotesStackParamList>();

const NotesNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="NotesList"
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="NotesList"
        component={NotesScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ 
          title: 'Note Details',
        }}
      />
      <Stack.Screen
        name="CreateNote"
        component={CreateNoteScreen}
        options={{ 
          title: 'New Note',
        }}
      />
      <Stack.Screen
        name="NoteFolders"
        component={NoteFoldersScreen}
        options={{ 
          title: 'Folders',
        }}
      />
      <Stack.Screen
        name="NoteSearch"
        component={NoteSearchScreen}
        options={{ 
          title: 'Search Notes',
        }}
      />
    </Stack.Navigator>
  );
};

export default NotesNavigator;
