import { FlashcardDeck, Flashcard } from '../types';

const FLASHCARDS_STORAGE_KEY = 'learn_more_flashcards_db';

export const flashcardsService = {
  async saveDeck(userId: string, noteId: string, cards: Flashcard[], title?: string): Promise<FlashcardDeck> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    
    // Create new deck (Append-only to allow multiple decks per note)
    const newDeck: FlashcardDeck = {
      id: crypto.randomUUID(),
      userId,
      noteId,
      title: title || `Deck ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      cards,
      createdAt: Date.now()
    };

    allDecks.push(newDeck);
    
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(allDecks));
    return newDeck;
  },

  async saveSetDeck(userId: string, setId: string, title: string, sourceSummary: string, cards: Flashcard[], sourceIds: string[] = []): Promise<FlashcardDeck> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');

    const newDeck: FlashcardDeck = {
        id: crypto.randomUUID(),
        userId,
        setId,
        title,
        sourceSummary,
        sourceIds,
        cards,
        createdAt: Date.now()
    };

    allDecks.push(newDeck);
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(allDecks));
    return newDeck;
  },

  // Keep for backward compatibility (returns the most recent deck)
  async getDeckByNoteId(userId: string, noteId: string): Promise<FlashcardDeck | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    // Return the most recently created deck for this note
    const decks = allDecks
        .filter(d => d.userId === userId && d.noteId === noteId)
        .sort((a, b) => b.createdAt - a.createdAt);
    
    return decks.length > 0 ? decks[0] : null;
  },

  // New method to get all decks for a note
  async getDecksByNoteId(userId: string, noteId: string): Promise<FlashcardDeck[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    return allDecks
        .filter(d => d.userId === userId && d.noteId === noteId)
        .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getDecksBySetId(userId: string, setId: string): Promise<FlashcardDeck[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    return allDecks
        .filter(d => d.userId === userId && d.setId === setId)
        .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getAllDecks(userId: string): Promise<FlashcardDeck[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    return allDecks.filter(d => d.userId === userId);
  },

  async rename(userId: string, deckId: string, newTitle: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    const index = allDecks.findIndex(d => d.id === deckId && d.userId === userId);
    if (index !== -1) {
        allDecks[index].title = newTitle;
        localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(allDecks));
    }
  },

  async delete(userId: string, deckId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    const filtered = allDecks.filter(d => !(d.id === deckId && d.userId === userId));
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(filtered));
  },

  async deleteByNoteId(userId: string, noteId: string): Promise<void> {
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    const filtered = allDecks.filter(d => !(d.userId === userId && d.noteId === noteId));
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(filtered));
  },

  async deleteBySetId(userId: string, setId: string): Promise<void> {
    const allDecks: FlashcardDeck[] = JSON.parse(localStorage.getItem(FLASHCARDS_STORAGE_KEY) || '[]');
    const filtered = allDecks.filter(d => !(d.userId === userId && d.setId === setId));
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(filtered));
  }
};