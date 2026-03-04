import React, { useState, useEffect } from 'react';
import { StudySet, FlashcardDeck } from '../types';
import { Button, Card, Modal, Badge } from './UIComponents';
import { flashcardsService } from '../services/flashcards';
import { notesService } from '../services/notes';
import { documentService } from '../services/documents';
import { generateFlashcardsFromNote } from '../services/gemini';
import { loggingService } from '../services/logging';

interface SetFlashcardsProps {
  userId: string;
  set: StudySet;
  onOpenDeck: (deck: FlashcardDeck) => void;
}

export const SetFlashcards: React.FC<SetFlashcardsProps> = ({ userId, set, onOpenDeck }) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [sourceData, setSourceData] = useState<{id: string; title: string; content: string; type: 'document' | 'note'}[]>([]);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; deck: FlashcardDeck | null; newTitle: string }>({ isOpen: false, deck: null, newTitle: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; deck: FlashcardDeck | null }>({ isOpen: false, deck: null });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    loadDecks();
    prepareSourceData();
    
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [userId, set]);

  const loadDecks = async () => {
    try {
      const data = await flashcardsService.getDecksBySetId(userId, set.id);
      setDecks(data);
    } catch (e) {
      console.error("Failed to load set decks", e);
    } finally {
      setLoading(false);
    }
  };

  const prepareSourceData = async () => {
    try {
        const allDocs = await documentService.list(userId);
        const setNotes = await notesService.getNotesBySetId(userId, set.id);

        const setDocsData = (set.items || [])
            .filter(item => item.type === 'document')
            .map(item => {
                const doc = allDocs.find(d => d.id === item.id);
                return doc ? { id: item.id, title: doc.title, content: doc.contentText, type: 'document' as const } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
        
        const setNotesData = setNotes.map(note => ({
            id: note.id,
            title: note.title || 'Untitled Note',
            content: note.contentText,
            type: 'note' as const
        }));

        const combinedData = [...setDocsData, ...setNotesData];
        setSourceData(combinedData);
        setSelectedSourceIds(combinedData.map(d => d.id));
    } catch (e) {
        console.error("Failed to prepare source data", e);
    }
  };

  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedSourceIds.length === 0) return;
    setIsGenerating(true);

    try {
        const selectedItems = sourceData.filter(d => selectedSourceIds.includes(d.id));
        const combinedText = selectedItems.map(item => `--- SOURCE: ${item.title} ---\n${item.content}`).join('\n\n');
        
        // Pass userId for logging
        const cards = await generateFlashcardsFromNote(combinedText, userId);
        
        const finalTitle = customTitle.trim() || `Combined Deck (${selectedItems.length} sources)`;
        const summary = `Generated from ${selectedItems.length} source${selectedItems.length !== 1 ? 's' : ''}`;
        
        const newDeck = await flashcardsService.saveSetDeck(userId, set.id, finalTitle, summary, cards, selectedSourceIds);
        
        setDecks(prev => [newDeck, ...prev]);
        setIsGenerateModalOpen(false);
        setSelectedSourceIds([]);
        setCustomTitle('');
    } catch (e) {
        console.error(e);
        alert("This is taking longer than expected. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === deckId ? null : deckId);
  };

  const handleRenameConfirm = async () => {
    if (!renameModal.deck || !renameModal.newTitle.trim()) return;
    setIsProcessingAction(true);
    try {
      await flashcardsService.rename(userId, renameModal.deck.id, renameModal.newTitle);
      setDecks(prev => prev.map(d => d.id === renameModal.deck?.id ? { ...d, title: renameModal.newTitle } : d));
      setRenameModal({ ...renameModal, isOpen: false });
    } catch (e) {
      alert("Failed to rename deck");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.deck) return;
    setIsProcessingAction(true);
    try {
      await flashcardsService.delete(userId, deleteModal.deck.id);
      setDecks(prev => prev.filter(d => d.id !== deleteModal.deck?.id));
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (e) {
      alert("Failed to delete deck");
    } finally {
      setIsProcessingAction(false);
    }
  };


  if (loading) return <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading flashcards...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set Flashcards</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Study decks generated from sources in this set.</p>
         </div>
         <Button onClick={() => setIsGenerateModalOpen(true)} disabled={sourceData.length === 0}>
            + Create Deck
         </Button>
      </div>

      {decks.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="text-4xl mb-4">🗂</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No flashcards created yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Create a custom deck from your set documents and notes.
            </p>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(true)} disabled={sourceData.length === 0}>
                Generate Deck
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
                <Card 
                    key={deck.id} 
                    className="flex flex-col justify-between h-full cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group relative"
                    onClick={() => { 
                         loggingService.log('flashcards_started', userId, { deckId: deck.id, setId: set.id });
                         onOpenDeck(deck); 
                    }}
                >
                    <div className="mb-4 pr-6">
                        <div className="flex justify-between items-start mb-2">
                            <Badge color="indigo">Deck</Badge>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(deck.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                            {deck.title || 'Untitled Deck'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {deck.sourceSummary || 'Generated Deck'}
                        </p>
                    </div>

                     <div className="absolute top-4 right-4">
                        <button 
                            onClick={(e) => toggleMenu(e, deck.id)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                        
                        {activeMenuId === deck.id && (
                            <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setRenameModal({ isOpen: true, deck, newTitle: deck.title || '' }); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                    Rename
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, deck }); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{deck.cards.length} Cards</span>
                         <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                            Study
                         </Button>
                    </div>
                </Card>
            ))}
        </div>
      )}

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Create Flashcard Deck"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsGenerateModalOpen(false)} disabled={isGenerating}>Cancel</Button>
                <Button 
                    onClick={handleGenerate} 
                    disabled={selectedSourceIds.length === 0 || isGenerating} 
                    isLoading={isGenerating}
                >
                    Generate Deck
                </Button>
            </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deck Title (Optional)</label>
                <input 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Chapter 1 Vocab"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Sources</label>
                {sourceData.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">No sources available. Upload documents to the set first.</p>
                ) : (
                    <div className="space-y-2">
                        {sourceData.map(item => (
                            <label key={item.id} className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                <input 
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    checked={selectedSourceIds.includes(item.id)}
                                    onChange={() => toggleSourceSelection(item.id)}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === 'document' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'}`}>
                                            {item.type.toUpperCase()}
                                        </span>
                                        <p className="font-medium text-slate-900 dark:text-white text-sm">{item.title}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.content.substring(0, 100)}...</p>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
             </div>
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <span className="font-bold">Snapshot:</span> Flashcards will be generated based on the current content of the selected sources.
             </div>
        </div>
      </Modal>

      <Modal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
        title="Rename Deck"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameModal({ ...renameModal, isOpen: false })} disabled={isProcessingAction}>Cancel</Button>
            <Button onClick={handleRenameConfirm} disabled={!renameModal.newTitle.trim() || isProcessingAction} isLoading={isProcessingAction}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
           <input 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={renameModal.newTitle}
              onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
              autoFocus
              placeholder="Deck Title"
           />
        </div>
      </Modal>

       <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        title="Delete Deck"
        variant="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} disabled={isProcessingAction}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isProcessingAction}>Delete</Button>
          </>
        }
      >
        <div className="space-y-4">
           <p className="text-sm text-slate-600 dark:text-slate-300">
             Are you sure you want to delete <span className="font-bold">{deleteModal.deck?.title}</span>?
           </p>
           <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
             This will permanently delete this flashcard deck. Other materials will not be affected.
           </p>
        </div>
      </Modal>

    </div>
  );
};