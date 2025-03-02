import { create } from 'zustand';
import { Note, NoteFolder, NoteFilter, NoteSortOption } from '../models/Note';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

interface NoteState {
  notes: Note[];
  folders: NoteFolder[];
  isLoading: boolean;
  error: string | null;
  filter: NoteFilter;
  sortOption: NoteSortOption;
  
  // Note actions
  fetchNotes: (userId: string) => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (noteId: string, updatedNote: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  togglePinned: (noteId: string) => Promise<void>;
  toggleArchived: (noteId: string) => Promise<void>;
  
  // Folder actions
  fetchFolders: (userId: string) => Promise<void>;
  addFolder: (folder: Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NoteFolder>;
  updateFolder: (folderId: string, updatedFolder: Partial<NoteFolder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  
  // Filter actions
  setFilter: (filter: NoteFilter) => void;
  setSortOption: (sortOption: NoteSortOption) => void;
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
  
  // Create notes table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        folderId TEXT,
        tags TEXT,
        color TEXT,
        isPinned INTEGER NOT NULL,
        isArchived INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL
      )`,
      [],
      () => console.log('Notes table created successfully'),
      (_, error) => {
        console.error('Error creating notes table:', error);
        return false;
      }
    );
  });
  
  // Create folders table
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS note_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      [],
      () => console.log('Note folders table created successfully'),
      (_, error) => {
        console.error('Error creating note folders table:', error);
        return false;
      }
    );
  });
};

// Initialize database on store creation
initDatabase();

// Create note store
const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  folders: [],
  isLoading: false,
  error: null,
  filter: {},
  sortOption: 'updatedAt-desc',
  
  // Note actions
  fetchNotes: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query notes from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM notes WHERE userId = ?',
          [userId],
          (_, { rows }) => {
            const notes: Note[] = [];
            for (let i = 0; i < rows.length; i++) {
              const note = rows.item(i);
              notes.push({
                ...note,
                isPinned: note.isPinned === 1,
                isArchived: note.isArchived === 1,
                tags: note.tags ? JSON.parse(note.tags) : [],
              });
            }
            set({ notes, isLoading: false });
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
  
  addNote: async (note) => {
    set({ isLoading: true, error: null });
    
    try {
      const noteId = Date.now().toString();
      const now = new Date().toISOString();
      const newNote: Note = {
        id: noteId,
        ...note,
        isPinned: note.isPinned || false,
        isArchived: note.isArchived || false,
        createdAt: now,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Insert note into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO notes (
              id, title, content, folderId, tags, color, 
              isPinned, isArchived, createdAt, updatedAt, userId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newNote.id,
              newNote.title,
              newNote.content,
              newNote.folderId || null,
              newNote.tags ? JSON.stringify(newNote.tags) : null,
              newNote.color || null,
              newNote.isPinned ? 1 : 0,
              newNote.isArchived ? 1 : 0,
              newNote.createdAt,
              newNote.updatedAt,
              newNote.userId,
            ],
            () => {
              set(state => ({
                notes: [...state.notes, newNote],
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
      
      return newNote;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateNote: async (noteId, updatedNote) => {
    set({ isLoading: true, error: null });
    
    try {
      const notes = get().notes;
      const noteIndex = notes.findIndex(note => note.id === noteId);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      const note = notes[noteIndex];
      const now = new Date().toISOString();
      const updatedNoteData: Note = {
        ...note,
        ...updatedNote,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Update note in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedNote).forEach(([key, value]) => {
            if (key !== 'id') {
              updates.push(`${key} = ?`);
              
              if (key === 'isPinned' || key === 'isArchived') {
                values.push(value ? 1 : 0);
              } else if (key === 'tags' && Array.isArray(value)) {
                values.push(JSON.stringify(value));
              } else {
                values.push(value);
              }
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(noteId);
          
          tx.executeSql(
            `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              const newNotes = [...notes];
              newNotes[noteIndex] = updatedNoteData;
              
              set({
                notes: newNotes,
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
  
  deleteNote: async (noteId) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Delete note from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM notes WHERE id = ?',
            [noteId],
            () => {
              set(state => ({
                notes: state.notes.filter(note => note.id !== noteId),
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
  
  togglePinned: async (noteId) => {
    const notes = get().notes;
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      const note = notes[noteIndex];
      await get().updateNote(noteId, { isPinned: !note.isPinned });
    }
  },
  
  toggleArchived: async (noteId) => {
    const notes = get().notes;
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      const note = notes[noteIndex];
      await get().updateNote(noteId, { isArchived: !note.isArchived });
    }
  },
  
  // Folder actions
  fetchFolders: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Query folders from database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM note_folders WHERE userId = ?',
          [userId],
          (_, { rows }) => {
            const folders: NoteFolder[] = [];
            for (let i = 0; i < rows.length; i++) {
              folders.push(rows.item(i));
            }
            set({ folders, isLoading: false });
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
  
  addFolder: async (folder) => {
    set({ isLoading: true, error: null });
    
    try {
      const folderId = Date.now().toString();
      const now = new Date().toISOString();
      const newFolder: NoteFolder = {
        id: folderId,
        ...folder,
        createdAt: now,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Insert folder into database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO note_folders (
              id, name, color, icon, userId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              newFolder.id,
              newFolder.name,
              newFolder.color || null,
              newFolder.icon || null,
              newFolder.userId,
              newFolder.createdAt,
              newFolder.updatedAt,
            ],
            () => {
              set(state => ({
                folders: [...state.folders, newFolder],
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
      
      return newFolder;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateFolder: async (folderId, updatedFolder) => {
    set({ isLoading: true, error: null });
    
    try {
      const folders = get().folders;
      const folderIndex = folders.findIndex(folder => folder.id === folderId);
      
      if (folderIndex === -1) {
        throw new Error('Folder not found');
      }
      
      const folder = folders[folderIndex];
      const now = new Date().toISOString();
      const updatedFolderData: NoteFolder = {
        ...folder,
        ...updatedFolder,
        updatedAt: now,
      };
      
      const db = getDatabase();
      
      // Update folder in database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          const updates: string[] = [];
          const values: any[] = [];
          
          // Build dynamic update query
          Object.entries(updatedFolder).forEach(([key, value]) => {
            if (key !== 'id') {
              updates.push(`${key} = ?`);
              values.push(value);
            }
          });
          
          updates.push('updatedAt = ?');
          values.push(now);
          values.push(folderId);
          
          tx.executeSql(
            `UPDATE note_folders SET ${updates.join(', ')} WHERE id = ?`,
            values,
            () => {
              const newFolders = [...folders];
              newFolders[folderIndex] = updatedFolderData;
              
              set({
                folders: newFolders,
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
  
  deleteFolder: async (folderId) => {
    set({ isLoading: true, error: null });
    
    try {
      const db = getDatabase();
      
      // Delete folder from database
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM note_folders WHERE id = ?',
            [folderId],
            () => {
              // Remove folder from notes
              tx.executeSql(
                'UPDATE notes SET folderId = NULL WHERE folderId = ?',
                [folderId],
                () => {
                  set(state => ({
                    folders: state.folders.filter(folder => folder.id !== folderId),
                    notes: state.notes.map(note => 
                      note.folderId === folderId 
                        ? { ...note, folderId: undefined } 
                        : note
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
  
  // Filter actions
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

export default useNoteStore;
