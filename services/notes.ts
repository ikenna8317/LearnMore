import { GeneratedNote, DocumentOverview } from '../types';

const NOTES_STORAGE_KEY = 'learn_more_notes_db';

export const notesService = {
  async saveNote(userId: string, documentId: string, contentText: string, overview?: DocumentOverview): Promise<GeneratedNote> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    
    const newNote: GeneratedNote = {
      id: crypto.randomUUID(),
      userId,
      documentId,
      contentText,
      createdAt: Date.now(),
      overview // Save the overview within the note
    };

    allNotes.push(newNote);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
    return newNote;
  },

  async saveSetNote(userId: string, setId: string, title: string, contentText: string, sourceSummary: string, sourceIds: string[] = []): Promise<GeneratedNote> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');

    const newNote: GeneratedNote = {
        id: crypto.randomUUID(),
        userId,
        setId,
        title,
        sourceSummary,
        sourceIds,
        contentText,
        createdAt: Date.now()
    };

    allNotes.push(newNote);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
    return newNote;
  },

  async getNote(noteId: string, userId: string): Promise<GeneratedNote | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    
    // Enforce User Ownership: Only return if note exists AND belongs to the user
    const note = allNotes.find(n => n.id === noteId);
    
    if (!note || note.userId !== userId) {
      return null;
    }
    
    return note;
  },

  async getNoteByDocumentId(userId: string, documentId: string): Promise<GeneratedNote | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    // Enforce ownership via userId check
    return allNotes.find(n => n.userId === userId && n.documentId === documentId) || null;
  },

  async getNotesBySetId(userId: string, setId: string): Promise<GeneratedNote[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    return allNotes
        .filter(n => n.userId === userId && n.setId === setId)
        .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getAllNotes(userId: string): Promise<GeneratedNote[]> {
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    // Only return notes belonging to the user
    return allNotes.filter(n => n.userId === userId);
  },

  async rename(userId: string, noteId: string, newTitle: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const index = allNotes.findIndex(n => n.id === noteId && n.userId === userId);
    if (index !== -1) {
        allNotes[index].title = newTitle;
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
    }
  },

  async delete(userId: string, noteId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const filtered = allNotes.filter(n => !(n.id === noteId && n.userId === userId));
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filtered));
  },

  async deleteByDocumentId(userId: string, documentId: string): Promise<void> {
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const filtered = allNotes.filter(n => !(n.userId === userId && n.documentId === documentId));
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filtered));
  },

  async deleteBySetId(userId: string, setId: string): Promise<void> {
    const allNotes: GeneratedNote[] = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const filtered = allNotes.filter(n => !(n.userId === userId && n.setId === setId));
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filtered));
  }
};