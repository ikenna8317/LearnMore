import React, { useEffect, useRef } from 'react';
import { Button } from './UIComponents';
import { FeedbackWidget } from './FeedbackWidget';
import { GeneratedNote } from '../types';

interface NoteViewerProps {
  note: GeneratedNote | null;
  documentTitle: string;
  onBack: () => void;
  onViewHistory: () => void;
  onStartQuiz: (note: GeneratedNote) => void;
  onStartTest: (note: GeneratedNote) => void;
  onStartExam: (note: GeneratedNote) => void;
  onStartFlashcards: (note: GeneratedNote) => void;
  onRecordTime?: (durationSeconds: number) => void;
}

// Simple Markdown Renderer for Read Mode
const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return <p className="text-slate-400 italic">No content available.</p>;

  const lines = content.split('\n');
  
  return (
    <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold text-indigo-900 dark:text-indigo-400 mt-8 mb-3">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4">{line.replace('# ', '')}</h1>;
        }

        // Lists
        if (line.trim().startsWith('- ')) {
          return (
            <div key={index} className="flex gap-3 ml-2">
              <span className="text-indigo-500 dark:text-indigo-400 font-bold">•</span>
              <p className="flex-1">{parseBold(line.replace('- ', ''))}</p>
            </div>
          );
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }

        // Paragraphs
        return <p key={index}>{parseBold(line)}</p>;
      })}
    </div>
  );
};

// Helper to parse **bold** text
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
};

export const NoteViewer: React.FC<NoteViewerProps> = ({ 
  note, 
  documentTitle, 
  onBack, 
  onViewHistory,
  onStartQuiz, 
  onStartTest, 
  onStartExam, 
  onStartFlashcards,
  onRecordTime
}) => {
  // Time Tracking
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    return () => {
      // Calculate duration on unmount (or note change)
      const duration = (Date.now() - startTimeRef.current) / 1000;
      // Record if session was meaningful (> 5 seconds)
      if (duration > 5 && onRecordTime) {
        onRecordTime(duration);
      }
    };
  }, [note?.id]); // Reset timer if note changes

  // Handle missing or unauthorized notes gracefully
  if (!note) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ?
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Note Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">The note you are trying to view does not exist or you do not have permission to view it.</p>
        <Button onClick={onBack}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 sticky top-4 z-20 shadow-sm transition-all">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                ← Back
            </Button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                {documentTitle}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                   <span>AI Study Notes</span>
                </p>
            </div>
            </div>
            {/* Desktop Actions */}
            <div className="hidden lg:flex gap-2">
                <Button variant="outline" size="sm" onClick={onViewHistory} className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    📜 Past Attempts
                </Button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <Button variant="outline" size="sm" onClick={() => onStartFlashcards(note)} className="border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                    🗂 Flashcards
                </Button>
                <Button variant="outline" size="sm" onClick={() => onStartTest(note)} className="dark:text-white dark:border-slate-600 dark:hover:bg-slate-800">
                    📝 Take Test
                </Button>
                <Button variant="outline" size="sm" onClick={() => onStartExam(note)} className="dark:text-white dark:border-slate-600 dark:hover:bg-slate-800">
                    ⏱ Exam
                </Button>
                <Button variant="primary" size="sm" onClick={() => onStartQuiz(note)}>
                    ⚡️ Quiz Me
                </Button>
            </div>
        </div>

        {/* Mobile Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:hidden">
            <Button variant="outline" size="sm" onClick={onViewHistory} className="dark:text-slate-300 dark:border-slate-700">
                📜 History
            </Button>
            <Button variant="outline" size="sm" onClick={() => onStartFlashcards(note)} className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                🗂 Cards
            </Button>
            <Button variant="primary" size="sm" onClick={() => onStartQuiz(note)}>
                ⚡️ Quiz
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[500px]">
                <SimpleMarkdownRenderer content={note.contentText} />
            </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm sticky top-24">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Note Info</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Source</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{note.sourceSummary || 'Document Upload'}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <FeedbackWidget 
                            contentId="" 
                            contentType="note" 
                            contentText={note.contentText.substring(0, 500)} 
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};