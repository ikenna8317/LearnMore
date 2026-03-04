import React from 'react';
import { Card, Button, Badge } from './UIComponents';
import { Document, GeneratedNote } from '../types';

interface DocumentOverviewProps {
  document: Document;
  note: GeneratedNote;
  onReadNotes: () => void;
  onBack: () => void;
}

export const MaterialViewer: React.FC<DocumentOverviewProps> = ({ document, note, onReadNotes, onBack }) => {
  const overview = note?.overview;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button onClick={onBack} className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 w-fit">
             ← Back to Library
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <Badge color="indigo">Document Overview</Badge>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{document.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                   Generated {new Date(note.createdAt).toLocaleDateString()}
                </p>
            </div>
            <div className="flex gap-2">
                <Button variant="primary" onClick={onReadNotes}>
                    📄 Read Detailed Notes
                </Button>
            </div>
        </div>
      </div>

      {!overview ? (
        <Card className="py-12 text-center bg-slate-50 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No overview information available in this note.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Executive Summary</h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {overview.summary}
                    </div>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
                    <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-3">Key Takeaways</h3>
                    <ul className="space-y-3">
                        {overview.keyPoints.map((point, i) => (
                            <li key={i} className="flex gap-3 text-sm text-indigo-800 dark:text-indigo-300">
                                <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</span>
                                {point}
                            </li>
                        ))}
                    </ul>
                 </Card>
                 
                 <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">Dive Deeper</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Ready to study the full details?
                    </p>
                    <Button variant="outline" size="sm" onClick={onReadNotes} className="w-full">Open Full Notes</Button>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};