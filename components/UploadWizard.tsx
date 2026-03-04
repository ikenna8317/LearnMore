import React, { useState } from 'react';
import { Button, Card } from './UIComponents';
import { documentService } from '../services/documents';
import { Document } from '../types';

interface UploadWizardProps {
  userId: string;
  onSuccess: (doc: Document) => void;
  onCancel: () => void;
}

export const UploadWizard: React.FC<UploadWizardProps> = ({ userId, onSuccess, onCancel }) => {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateDocument = async () => {
    if (!text.trim() || text.length < 50) {
      setError("Please enter at least 50 characters of content.");
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const title = text.split('\n')[0].substring(0, 40) || "Untitled Note";
      const doc = await documentService.create(userId, title, "Pasted Text", text, 'txt');
      onSuccess(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsReadingFile(true);

    try {
      const doc = await documentService.upload(userId, file);
      onSuccess(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file.");
      setIsReadingFile(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center mb-6">
        <button onClick={onCancel} className="mr-4 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
          ←
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Document</h2>
      </div>

      <Card className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Paste your content manually
            </label>
            <textarea
                className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
                placeholder="Paste your study material here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isProcessing || isReadingFile}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">
                {text.length} characters
            </p>
        </div>

        <div className="relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">Or upload a file</span>
            </div>
        </div>

        <div className="flex flex-col items-center gap-2">
            <input 
                type="file" 
                accept=".txt,.pdf,.docx" 
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300
                  hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50
                "
                disabled={isProcessing || isReadingFile}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">Supported formats: .txt, .pdf (text-based), .docx</p>
        </div>

        {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                ⚠️ {error}
            </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} disabled={isProcessing || isReadingFile}>Cancel</Button>
            <Button onClick={handleCreateDocument} isLoading={isProcessing || isReadingFile} disabled={text.length < 50}>
                {isReadingFile ? 'Reading File...' : 'Create Document'}
            </Button>
        </div>
      </Card>
    </div>
  );
};