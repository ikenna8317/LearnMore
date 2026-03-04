import React, { useState, useEffect, useRef } from 'react';
import { StudySet, Document, SetContentItem } from '../types';
import { Button, Card, Modal, Badge } from './UIComponents';
import { documentService } from '../services/documents';
import { setsService } from '../services/sets';

interface SetSourcesProps {
  userId: string;
  set: StudySet;
  onUpdateSet: (updatedSet: StudySet) => void;
}

export const SetSources: React.FC<SetSourcesProps> = ({ userId, set, onUpdateSet }) => {
  const [loading, setLoading] = useState(true);
  const [setDocuments, setSetDocuments] = useState<Document[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemToRemove, setItemToRemove] = useState<SetContentItem | null>(null);

  useEffect(() => {
    fetchSetDocuments();
  }, [userId, set.items]);

  const fetchSetDocuments = async () => {
    try {
      const allDocs = await documentService.list(userId);
      const docsInSet = allDocs.filter(d => set.items?.some(i => i.id === d.id && i.type === 'document'));
      setSetDocuments(docsInSet);
    } catch (e) {
      console.error("Failed to load set documents", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const newItems: SetContentItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const doc = await documentService.upload(userId, file, set.id);
        newItems.push({ id: doc.id, type: 'document', addedAt: Date.now() });
      }

      const updatedSet = await setsService.addItems(userId, set.id, newItems);
      onUpdateSet(updatedSet);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!itemToRemove) return;
    setIsProcessing(true);
    try {
      if (itemToRemove.type === 'document') {
         await documentService.delete(userId, itemToRemove.id);
      }
      const updatedSet = await setsService.removeItem(userId, set.id, itemToRemove.id);
      onUpdateSet(updatedSet);
      setItemToRemove(null);
    } catch (e) {
      alert("Failed to remove item");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-slate-400 dark:text-slate-500">Loading sources...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set Documents</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Upload documents directly to this set.</p>
         </div>
         <div className="relative">
             <input 
                type="file" 
                multiple 
                accept=".txt,.pdf,.docx"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="set-upload-input"
                disabled={isProcessing}
             />
             <Button 
                onClick={() => fileInputRef.current?.click()} 
                isLoading={isProcessing}
                disabled={isProcessing}
             >
                + Add Sources
             </Button>
         </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
            {error}
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Uploaded Documents</h3>
             <Badge color="slate">{setDocuments.length}</Badge>
        </div>
        
        {setDocuments.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-slate-500 dark:text-slate-400 mb-2">No documents in this set.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Upload PDF, DOCX, or TXT files to get started.</p>
            </div>
        ) : (
            <div className="grid gap-3">
                {setDocuments.map(doc => (
                    <Card key={doc.id} className="flex items-center justify-between p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                                {doc.sourceType}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                    Added {new Date(doc.createdAt).toLocaleDateString()} • {(doc.contentText.length / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setItemToRemove({ id: doc.id, type: 'document', addedAt: doc.createdAt })}
                            className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete from set"
                        >
                            ✕
                        </button>
                    </Card>
                ))}
            </div>
        )}
      </section>

      <Modal
         isOpen={!!itemToRemove}
         onClose={() => setItemToRemove(null)}
         title="Delete Source"
         variant="danger"
         footer={
            <>
                <Button variant="ghost" onClick={() => setItemToRemove(null)}>Cancel</Button>
                <Button variant="danger" onClick={handleRemoveConfirm} isLoading={isProcessing}>Delete</Button>
            </>
         }
      >
        <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this document from the set?
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <p>
                    This will <strong>permanently delete</strong> the document and any notes generated specifically from it.
                </p>
            </div>
        </div>
      </Modal>

    </div>
  );
};