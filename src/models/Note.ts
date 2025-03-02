export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags?: string[];
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
  userId: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteFilter = {
  folderId?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  search?: string;
  tags?: string[];
};

export type NoteSortOption = 
  | 'title-asc' 
  | 'title-desc' 
  | 'createdAt-asc' 
  | 'createdAt-desc'
  | 'updatedAt-asc'
  | 'updatedAt-desc';
