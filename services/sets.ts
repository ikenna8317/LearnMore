import { StudySet, SetContentItem } from '../types';
import { notesService } from './notes';
import { flashcardsService } from './flashcards';
import { assessmentService } from './assessment';

const SETS_STORAGE_KEY = 'learn_more_sets_db';

export const setsService = {
  async list(userId: string): Promise<StudySet[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const sets: StudySet[] = JSON.parse(localStorage.getItem(SETS_STORAGE_KEY) || '[]');
    
    // Migration: ensure items array exists
    return sets
      .filter(s => s.userId === userId)
      .map(s => ({ ...s, items: s.items || [] }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async create(userId: string, title: string): Promise<StudySet> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const sets: StudySet[] = JSON.parse(localStorage.getItem(SETS_STORAGE_KEY) || '[]');
    
    const newSet: StudySet = {
      id: crypto.randomUUID(),
      userId,
      title,
      documentCount: 0,
      noteCount: 0,
      items: [],
      createdAt: Date.now()
    };
    
    sets.push(newSet);
    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
    return newSet;
  },

  async rename(userId: string, setId: string, newTitle: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 300));
     const sets: StudySet[] = JSON.parse(localStorage.getItem(SETS_STORAGE_KEY) || '[]');
     const index = sets.findIndex(s => s.id === setId && s.userId === userId);
     
     if (index !== -1) {
       sets[index].title = newTitle;
       localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
     }
  },

  async delete(userId: string, setId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // 1. Delete associated Set Notes
    await notesService.deleteBySetId(userId, setId);

    // 2. Delete associated Set Flashcards
    await flashcardsService.deleteBySetId(userId, setId);

    // 3. Delete associated Set Assessments/Attempts
    assessmentService.deleteBySetId(userId, setId);

    // 4. Delete the Set itself
    const sets: StudySet[] = JSON.parse(localStorage.getItem(SETS_STORAGE_KEY) || '[]');
    const filtered = sets.filter(s => !(s.id === setId && s.userId === userId));
    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(filtered));
  },

  async addItems(userId: string, setId: string, newItems: SetContentItem[]): Promise<StudySet> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const sets: StudySet[] = JSON.parse(localStorage.getItem(SETS_STORAGE_KEY) || '[]');
    const index = sets.findIndex(s => s.id === setId && s.userId === userId);

    if (index === -1) throw new Error("Set not found");

    const set = sets[index];
    // Initialize items if missing (migration)
    if (!set.items) set.items = [];

    // Filter duplicates
    const uniqueItems = newItems.filter(newItem => 
        !set.items.some(existing => existing.id === newItem.id && existing.type === newItem.type)
    );

    set.items = [...set.items, ...uniqueItems];
    
    // Update counts
    set.documentCount = set.items.filter(i => i.type === 'document').length;
    set.noteCount = set.items.filter(i => i.type === 'note').length;

    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
    return set;
  },

  async removeItem(userId: string, setId: string, itemId: string): Promise<StudySet> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const sets: StudySet[] = JSON.parse(localStorage.getItem(SETS_STORAGE_KEY) || '[]');
    const index = sets.findIndex(s => s.id === setId && s.userId === userId);

    if (index === -1) throw new Error("Set not found");

    const set = sets[index];
    if (!set.items) set.items = [];

    set.items = set.items.filter(i => i.id !== itemId);
    
    // Update counts
    set.documentCount = set.items.filter(i => i.type === 'document').length;
    set.noteCount = set.items.filter(i => i.type === 'note').length;

    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
    return set;
  }
};