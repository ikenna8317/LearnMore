import React, { useEffect, useState } from 'react';
import { Document, GeneratedNote, FlashcardDeck } from '../types';
import { Card, Button, Badge, Modal } from './UIComponents';
import { documentService } from '../services/documents';
import { notesService } from '../services/notes';
import { flashcardsService } from '../services/flashcards';
import { assessmentService } from '../services/assessment';

interface LibraryViewProps {
  userId: string;
  onRead: (doc: Document, note?: GeneratedNote) => void;
  onViewOverview: (doc: Document, note: GeneratedNote) => void;
  onPractice: (doc: Document, note?: GeneratedNote) => void;
  onViewHistory: (doc: Document, note: GeneratedNote) => void;
  onUploadNew: () => void;
  onCreateDeck: (doc: Document, note: GeneratedNote) => void;
  onOpenDeck: (deck: FlashcardDeck) => void;
}

interface LibraryItem {
  doc: Document;
  note?: GeneratedNote;
  decks: FlashcardDeck[];
}

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  userId, 
  onRead, 
  onViewOverview, 
  onPractice, 
  onViewHistory, 
  onUploadNew,
  onCreateDeck,
  onOpenDeck
}) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Menu & Action States for Documents
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; doc: Document | null; newTitle: string }>({ isOpen: false, doc: null, newTitle: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; doc: Document | null }>({ isOpen: false, doc: null });
  
  // Deck Selection & Management State
  const [deckModal, setDeckModal] = useState<{ isOpen: boolean; item: LibraryItem | null }>({ isOpen: false, item: null });
  const [activeDeckMenuId, setActiveDeckMenuId] = useState<string | null>(null);
  const [renameDeckModal, setRenameDeckModal] = useState<{ isOpen: boolean; deck: FlashcardDeck | null; newTitle: string }>({ isOpen: false, deck: null, newTitle: '' });
  const [deleteDeckModal, setDeleteDeckModal] = useState<{ isOpen: boolean; deck: FlashcardDeck | null }>({ isOpen: false, deck: null });

  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    fetchLibraryData();
    
    const closeMenu = () => {
      setActiveMenuId(null);
      setActiveDeckMenuId(null);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [userId]);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    try {
      const [docs, notes, decks] = await Promise.all([
        documentService.list(userId),
        notesService.getAllNotes(userId),
        flashcardsService.getAllDecks(userId)
      ]);

      // Filter out documents that belong to a Set (have setId)
      const libraryItems: LibraryItem[] = docs
        .filter(doc => !doc.setId)
        .map(doc => {
          const note = notes.find(n => n.documentId === doc.id);
          const docDecks = note ? decks.filter(d => d.noteId === note.id).sort((a,b) => b.createdAt - a.createdAt) : [];
          return { doc, note, decks: docDecks };
        });

      setItems(libraryItems);
    } catch (error) {
      console.error("Failed to load library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄 PDF';
      case 'docx': return '📝 DOCX';
      default: return '📃 TXT';
    }
  };

  // --- Document Handlers ---

  const handleCardClick = (item: LibraryItem) => {
    if (item.note) {
      onViewOverview(item.doc, item.note);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === docId ? null : docId);
    setActiveDeckMenuId(null);
  };

  const openRename = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setRenameModal({ isOpen: true, doc, newTitle: doc.title });
    setActiveMenuId(null);
  };

  const openDelete = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, doc });
    setActiveMenuId(null);
  };

  const handleRenameConfirm = async () => {
    if (!renameModal.doc || !renameModal.newTitle.trim()) return;
    
    setIsProcessingAction(true);
    try {
      await documentService.rename(userId, renameModal.doc.id, renameModal.newTitle);
      
      // Update local state to avoid full refetch flicker
      setItems(prev => prev.map(item => 
        item.doc.id === renameModal.doc?.id 
          ? { ...item, doc: { ...item.doc, title: renameModal.newTitle } }
          : item
      ));
      
      setRenameModal({ ...renameModal, isOpen: false });
    } catch (err) {
      alert("Failed to rename document");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.doc) return;
    
    setIsProcessingAction(true);
    try {
      // Clean up related data if it exists
      const item = items.find(i => i.doc.id === deleteModal.doc?.id);
      
      if (item?.note) {
        await Promise.all([
           flashcardsService.deleteByNoteId(userId, item.note.id),
           notesService.deleteByDocumentId(userId, item.doc.id)
        ]);
        assessmentService.deleteByNoteId(userId, item.note.id);
      }
      
      // Delete actual document
      await documentService.delete(userId, deleteModal.doc.id);
      
      // Update local state
      setItems(prev => prev.filter(i => i.doc.id !== deleteModal.doc?.id));
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (err) {
      alert("Failed to delete document");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // --- Deck Handlers ---
  const handleFlashcardsClick = (e: React.MouseEvent, item: LibraryItem) => {
    e.stopPropagation(); // Prevent card click
    if (!item.note) return;
    
    if (item.decks.length === 0) {
        // Direct create if none exist
        onCreateDeck(item.doc, item.note);
    } else {
        // Open modal if decks exist
        setDeckModal({ isOpen: true, item });
    }
  };

  const handleDeckMenuToggle = (e: React.MouseEvent, deckId: string) => {
      e.stopPropagation();
      setActiveDeckMenuId(activeDeckMenuId === deckId ? null : deckId);
      setActiveMenuId(null);
  };

  const handleRenameDeckConfirm = async () => {
    if (!renameDeckModal.deck || !renameDeckModal.newTitle.trim()) return;
    setIsProcessingAction(true);

    try {
        await flashcardsService.rename(userId, renameDeckModal.deck.id, renameDeckModal.newTitle);
        
        // Update local state
        setItems(prev => prev.map(item => {
            if (item.doc.id === deckModal.item?.doc.id) {
                const updatedDecks = item.decks.map(d => 
                    d.id === renameDeckModal.deck?.id ? { ...d, title: renameDeckModal.newTitle } : d
                );
                return { ...item, decks: updatedDecks };
            }
            return item;
        }));

        // Update modal state item reference to reflect changes immediately
        setDeckModal(prev => {
            if (!prev.item) return prev;
            return {
                ...prev,
                item: { 
                    ...prev.item, 
                    decks: prev.item.decks.map(d => d.id === renameDeckModal.deck?.id ? { ...d, title: renameDeckModal.newTitle } : d)
                }
            };
        });

        setRenameDeckModal({ ...renameDeckModal, isOpen: false });
    } catch (e) {
        console.error("Failed to rename deck", e);
    } finally {
        setIsProcessingAction(false);
    }
  };

  const openDeleteDeck = (e: React.MouseEvent, deck: FlashcardDeck) => {
      e.stopPropagation();
      setDeleteDeckModal({ isOpen: true, deck });
      setActiveDeckMenuId(null);
  };

  const handleDeleteDeckConfirm = async () => {
    if (!deleteDeckModal.deck) return;
    setIsProcessingAction(true);

    try {
        await flashcardsService.delete(userId, deleteDeckModal.deck.id);
        
        const deckId = deleteDeckModal.deck.id;

        // Update local state
        setItems(prev => prev.map(item => {
            if (item.doc.id === deckModal.item?.doc.id) {
                const updatedDecks = item.decks.filter(d => d.id !== deckId);
                return { ...item, decks: updatedDecks };
            }
            return item;
        }));
        
        // Update modal state item reference
        setDeckModal(prev => {
            if (!prev.item) return prev;
            return {
                ...prev,
                item: { ...prev.item, decks: prev.item.decks.filter(d => d.id !== deckId) }
            };
        });
        
        setDeleteDeckModal({ isOpen: false, deck: null });

    } catch (e) {
        console.error("Failed to delete deck", e);
    } finally {
        setIsProcessingAction(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-20 text-slate-400 dark:text-slate-500">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Library</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your documents and study materials</p>
        </div>
        <Button onClick={onUploadNew}>+ Upload Document</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-4xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Your library is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">Upload a document to generate AI notes, flashcards, and quizzes.</p>
          <Button variant="outline" onClick={onUploadNew}>Upload your first document</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card 
                key={item.doc.id} 
                className={`flex flex-col h-full transition-all duration-200 border border-slate-100 dark:border-slate-700 shadow-sm relative group
                    ${item.note ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-600'}
                `}
                onClick={() => handleCardClick(item)}
            >
              <div className="flex justify-between items-start mb-4">
                <Badge color={item.doc.sourceType === 'pdf' ? 'indigo' : item.doc.sourceType === 'docx' ? 'indigo' : 'slate'}>
                  {getFileIcon(item.doc.sourceType)}
                </Badge>
                
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 mr-1">
                    {new Date(item.doc.createdAt).toLocaleDateString()}
                  </span>
                  
                  {/* Kebab Menu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => handleMenuToggle(e, item.doc.id)}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {activeMenuId === item.doc.id && (
                      <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                        <button 
                          onClick={(e) => openRename(e, item.doc)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          Rename
                        </button>
                        <button 
                          onClick={(e) => openDelete(e, item.doc)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={item.doc.title}>
                  {item.doc.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {(item.doc.contentText.length / 1000).toFixed(1)}k chars
                </p>

                <div className="flex flex-wrap gap-2">
                  {item.note ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">
                      ✓ Overview Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md">
                      ⚠ Needs Generation
                    </span>
                  )}
                  
                  {item.decks.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                      🗂 {item.decks.length} Deck{item.decks.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons - Stop Propagation to prevent opening overview when clicking specific actions */}
              <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        variant={item.note ? "primary" : "outline"} 
                        size="sm"
                        onClick={() => onRead(item.doc, item.note)}
                        className="w-full"
                    >
                        {item.note ? "Read Notes" : "Generate"}
                    </Button>
                    
                    {/* Practice Button */}
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onPractice(item.doc, item.note)}
                        disabled={!item.note}
                        className="w-full"
                        title={!item.note ? "Generate notes first to practice" : ""}
                    >
                        Practice
                    </Button>
                </div>
                
                {item.note && (
                    <div className="grid grid-cols-2 gap-3">
                         {/* Flashcards Button */}
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleFlashcardsClick(e, item)}
                            className={`w-full ${item.decks.length > 0 ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40' : ''}`}
                         >
                            {item.decks.length > 0 ? `Cards (${item.decks.length})` : 'Flashcards'}
                         </Button>

                         {/* More Options */}
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onViewHistory(item.doc, item.note!)}
                            className="w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                         >
                            History
                         </Button>
                    </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deck Selection Modal */}
      <Modal
        isOpen={deckModal.isOpen}
        onClose={() => setDeckModal({ ...deckModal, isOpen: false })}
        title="Flashcard Decks"
        footer={
            <Button variant="ghost" onClick={() => setDeckModal({ ...deckModal, isOpen: false })}>Close</Button>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
             <div className="flex justify-between items-center mb-2">
                 <p className="text-sm text-slate-500 dark:text-slate-400">Select a deck to study or create a new one.</p>
                 <Button 
                    size="sm" 
                    onClick={() => {
                        if (deckModal.item && deckModal.item.note) {
                            onCreateDeck(deckModal.item.doc, deckModal.item.note);
                            setDeckModal({ ...deckModal, isOpen: false });
                        }
                    }}
                 >
                    + New Deck
                 </Button>
             </div>

             <div className="space-y-3">
                {deckModal.item?.decks.map(deck => (
                    <div key={deck.id} className="relative p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                        <div className="cursor-pointer flex-1" onClick={() => onOpenDeck(deck)}>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{deck.title || 'Untitled Deck'}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>{deck.cards.length} cards</span>
                                <span>•</span>
                                <span>{new Date(deck.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        {/* Deck Kebab Menu */}
                        <div className="relative">
                            <button 
                                onClick={(e) => handleDeckMenuToggle(e, deck.id)}
                                className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>

                            {activeDeckMenuId === deck.id && (
                                <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-20 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setRenameDeckModal({ isOpen: true, deck, newTitle: deck.title || '' }); setActiveDeckMenuId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        Rename
                                    </button>
                                    <button 
                                        onClick={(e) => openDeleteDeck(e, deck)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </Modal>

      {/* Rename Document Modal */}
      <Modal 
        isOpen={renameModal.isOpen} 
        onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
        title="Rename Document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameModal({ ...renameModal, isOpen: false })} disabled={isProcessingAction}>Cancel</Button>
            <Button onClick={handleRenameConfirm} isLoading={isProcessingAction} disabled={!renameModal.newTitle.trim()}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Update the title of your document. This will not affect the generated content.</p>
          <input 
            type="text" 
            value={renameModal.newTitle}
            onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Document Title"
            autoFocus
          />
        </div>
      </Modal>

      {/* Rename Deck Modal */}
      <Modal 
        isOpen={renameDeckModal.isOpen} 
        onClose={() => setRenameDeckModal({ ...renameDeckModal, isOpen: false })}
        title="Rename Deck"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameDeckModal({ ...renameDeckModal, isOpen: false })} disabled={isProcessingAction}>Cancel</Button>
            <Button onClick={handleRenameDeckConfirm} isLoading={isProcessingAction} disabled={!renameDeckModal.newTitle.trim()}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <input 
            type="text" 
            value={renameDeckModal.newTitle}
            onChange={(e) => setRenameDeckModal({ ...renameDeckModal, newTitle: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Deck Title"
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Document Confirmation Modal */}
      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        title="Delete Document"
        variant="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} disabled={isProcessingAction}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isProcessingAction}>Delete Permanently</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{deleteModal.doc?.title}</span>?
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-sm text-red-800 dark:text-red-300">
            <p className="font-bold mb-1">⚠️ Warning</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>This action cannot be undone.</li>
              <li>All generated notes will be lost.</li>
              <li>Flashcards and quiz history will be deleted.</li>
            </ul>
          </div>
        </div>
      </Modal>

       {/* Delete Deck Confirmation Modal */}
       <Modal 
        isOpen={deleteDeckModal.isOpen} 
        onClose={() => setDeleteDeckModal({ ...deleteDeckModal, isOpen: false })}
        title="Delete Deck"
        variant="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteDeckModal({ ...deleteDeckModal, isOpen: false })} disabled={isProcessingAction}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteDeckConfirm} isLoading={isProcessingAction}>Delete</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{deleteDeckModal.deck?.title}</span>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
             This will permanently delete this flashcard deck.
          </p>
        </div>
      </Modal>

    </div>
  );
};
