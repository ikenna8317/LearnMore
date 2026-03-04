import React, { useState, useEffect } from 'react';
import { Button, Card, Modal } from './UIComponents';
import { LevelProgress } from './LevelProgress';
import { Document, UserStats, StudySet } from '../types';
import { setsService } from '../services/sets';

interface DashboardProps {
  userId: string;
  stats: UserStats;
  documents: Document[];
  onNewUpload: () => void;
  onSelectDocument: (doc: Document) => void;
  onOpenSet: (set: StudySet) => void;
  onPracticeSet: (set: StudySet) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  userId,
  stats, 
  onNewUpload,
  onOpenSet,
  onPracticeSet
}) => {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; set: StudySet | null; newTitle: string }>({ isOpen: false, set: null, newTitle: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; set: StudySet | null }>({ isOpen: false, set: null });
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSets();
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [userId]);

  const loadSets = async () => {
    try {
      const data = await setsService.list(userId);
      setSets(data);
    } catch (e) {
      console.error("Failed to load sets", e);
    } finally {
      setIsLoadingSets(false);
    }
  };

  const handleCreateSet = async () => {
    if (!newSetTitle.trim()) return;
    setIsProcessing(true);
    try {
      const newSet = await setsService.create(userId, newSetTitle);
      setSets(prev => [newSet, ...prev]);
      setCreateModalOpen(false);
      setNewSetTitle('');
      onOpenSet(newSet); // Navigate to the new set immediately
    } catch (e) {
      alert("Failed to create set");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenameConfirm = async () => {
    if (!renameModal.set || !renameModal.newTitle.trim()) return;
    setIsProcessing(true);
    try {
      await setsService.rename(userId, renameModal.set.id, renameModal.newTitle);
      setSets(prev => prev.map(s => s.id === renameModal.set?.id ? { ...s, title: renameModal.newTitle } : s));
      setRenameModal({ ...renameModal, isOpen: false });
    } catch (e) {
      alert("Failed to rename set");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.set) return;
    setIsProcessing(true);
    try {
      await setsService.delete(userId, deleteModal.set.id);
      setSets(prev => prev.filter(s => s.id !== deleteModal.set?.id));
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (e) {
      alert("Failed to delete set");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === setId ? null : setId);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      
      {/* Welcome & Stats Header */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            Hey there! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Ready to learn? Check your sets or add new material.
          </p>
        </div>
        
        <LevelProgress xp={stats.xp} />
      </section>

      {/* Action Bar */}
      <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Quick Actions</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start a new study session by adding material.</p>
        </div>
        <Button onClick={onNewUpload} size="lg">
          <span className="mr-2">+</span> Add Document
        </Button>
      </section>

      {/* Sets Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Your Sets</h2>
          <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)}>
            + New Set
          </Button>
        </div>

        {isLoadingSets ? (
           <div className="flex justify-center py-12">
             <div className="w-8 h-8 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
           </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't created any Sets yet.</p>
            <Button variant="ghost" onClick={() => setCreateModalOpen(true)}>Create your first Set</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map(set => (
              <Card 
                key={set.id} 
                className="group relative hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full"
                onClick={() => onOpenSet(set)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-3">
                       📚
                    </div>
                    
                    {/* Menu */}
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleMenu(e, set.id)}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      
                      {activeMenuId === set.id && (
                        <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setRenameModal({ isOpen: true, set, newTitle: set.title }); setActiveMenuId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            Rename
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, set }); setActiveMenuId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{set.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {set.documentCount} documents · {set.noteCount} notes
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
                   <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 group-hover:border-indigo-200 dark:group-hover:border-indigo-700"
                    onClick={(e) => { e.stopPropagation(); onPracticeSet(set); }}
                   >
                     Practice Set
                   </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Set"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSet} disabled={!newSetTitle.trim() || isProcessing} isLoading={isProcessing}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
           <p className="text-sm text-slate-500 dark:text-slate-400">Organize your documents and notes into a set for focused study.</p>
           <input 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Set Name (e.g. Biology 101)"
              value={newSetTitle}
              onChange={(e) => setNewSetTitle(e.target.value)}
              autoFocus
           />
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
        title="Rename Set"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>Cancel</Button>
            <Button onClick={handleRenameConfirm} disabled={!renameModal.newTitle.trim() || isProcessing} isLoading={isProcessing}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
           <input 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={renameModal.newTitle}
              onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
              autoFocus
           />
        </div>
      </Modal>

       {/* Delete Modal */}
       <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        title="Delete Set"
        variant="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isProcessing}>Delete</Button>
          </>
        }
      >
        <div className="space-y-4">
           <p className="text-sm text-slate-600 dark:text-slate-300">
             Are you sure you want to delete <span className="font-bold">{deleteModal.set?.title}</span>?
           </p>
           <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
             This will verify deletion of the set container. Your original documents and notes will <strong>not</strong> be deleted.
           </p>
        </div>
      </Modal>

    </div>
  );
};
