import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from './UIComponents';
import { Document, GeneratedNote } from '../types';
import { documentService } from '../services/documents';
import { notesService } from '../services/notes';

interface DocumentManagerProps {
  userId: string;
  onGenerateNote: (doc: Document) => void;
  onViewNote: (note: GeneratedNote, doc: Document) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ userId, onGenerateNote, onViewNote }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [existingNotes, setExistingNotes] = useState<Record<string, GeneratedNote>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [docs, notes] = await Promise.all([
        documentService.list(userId),
        notesService.getAllNotes(userId)
      ]);
      setDocuments(docs);
      
      const notesMap: Record<string, GeneratedNote> = {};
      notes.forEach(note => {
        notesMap[note.documentId] = note;
      });
      setExistingNotes(notesMap);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      await documentService.upload(userId, file);
      await fetchData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.delete(userId, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error(err);
      setError('Failed to delete document');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'docx': return 'DOC';
      default: return 'TXT';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Your Documents</h2>
        
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="doc-upload"
                disabled={isUploading}
            />
            <label 
                htmlFor="doc-upload" 
                className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isUploading ? 'Uploading...' : 'Upload File'}
            </label>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 -mt-4 text-right">
        Supported: .txt, .pdf (text), .docx
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 bg-slate-50/50">
            <p className="text-slate-500 mb-2">No documents uploaded yet.</p>
            <p className="text-xs text-slate-400">Upload a .txt, .pdf, or .docx file to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
            {documents.map(doc => {
              const hasNote = !!existingNotes[doc.id];
              const fileType = doc.sourceType || 'txt';
              return (
                <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 
                              ${fileType === 'pdf' ? 'bg-red-50 text-red-600' : 
                                fileType === 'docx' ? 'bg-blue-50 text-blue-600' : 
                                'bg-indigo-50 text-indigo-600'}`}>
                                {getFileIcon(fileType)}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-slate-900 truncate pr-4">{doc.title}</h4>
                                <p className="text-xs text-slate-500">
                                    {new Date(doc.createdAt).toLocaleDateString()} • {(doc.contentText.length / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-600 -mr-2">
                            <span className="sr-only">Delete</span>
                            🗑
                        </Button>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      {hasNote ? (
                        <Button size="sm" variant="secondary" onClick={() => onViewNote(existingNotes[doc.id], doc)} className="w-full">
                           📄 View Notes
                        </Button>
                      ) : (
                        <Button size="sm" variant="primary" onClick={() => onGenerateNote(doc)} className="w-full">
                           ✨ Generate Notes
                        </Button>
                      )}
                    </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};