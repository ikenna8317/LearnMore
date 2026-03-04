import React, { useState } from 'react';
import { StudySet, GeneratedNote, FlashcardDeck, AssessmentAttempt, QuizQuestion, PracticeMode } from '../types';
import { Button, Card, Badge } from './UIComponents';
import { SetSources } from './SetSources';
import { SetNotes } from './SetNotes';
import { SetFlashcards } from './SetFlashcards';
import { SetAttempts } from './SetAttempts';
import { SetPractice } from './SetPractice';

interface SetOverviewProps {
  set: StudySet;
  onBack: () => void;
  onOpenSetNote: (note: GeneratedNote) => void;
  onOpenSetDeck: (deck: FlashcardDeck) => void;
  onReviewAttempt: (attempt: AssessmentAttempt) => void;
  onStartSetAssessment: (questions: QuizQuestion[], mode: PracticeMode, title: string, sourceIds: string[]) => void;
}

type SetTab = 'sources' | 'notes' | 'flashcards' | 'practice' | 'attempts';

export const SetOverview: React.FC<SetOverviewProps> = ({ 
  set: initialSet, 
  onBack,
  onOpenSetNote,
  onOpenSetDeck,
  onReviewAttempt,
  onStartSetAssessment
}) => {
  const [activeTab, setActiveTab] = useState<SetTab>('sources');
  const [currentSet, setCurrentSet] = useState<StudySet>(initialSet);

  const tabs: { id: SetTab; label: string; icon: string }[] = [
    { id: 'sources', label: 'Sources', icon: '📂' },
    { id: 'notes', label: 'Notes', icon: '📄' },
    { id: 'flashcards', label: 'Flashcards', icon: '🗂' },
    { id: 'practice', label: 'Practice', icon: '🎯' },
    { id: 'attempts', label: 'Past Attempts', icon: '📊' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
       {/* Header */}
       <div className="flex flex-col gap-4">
         <Button variant="ghost" onClick={onBack} className="w-fit text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-0">
            ← Back to Dashboard
         </Button>
         
         <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{currentSet.title}</h1>
                    <Badge color="indigo">Study Set</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{currentSet.documentCount}</span> sources
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{currentSet.noteCount}</span> notes
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span>Created {new Date(currentSet.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
         </div>
       </div>

       {/* Tab Navigation */}
       <div>
         <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2
                        ${activeTab === tab.id 
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}
                    `}
                >
                    <span>{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
         </nav>
         <div className="h-px bg-slate-200 dark:bg-slate-700 w-full -mt-px"></div>
       </div>

       {/* Content Area */}
       <div className="min-h-[400px] animate-in slide-in-from-bottom-2 fade-in duration-300">
           {activeTab === 'sources' && (
               <SetSources 
                  userId={currentSet.userId} 
                  set={currentSet} 
                  onUpdateSet={setCurrentSet} 
               />
           )}
           {activeTab === 'notes' && (
               <SetNotes 
                  userId={currentSet.userId} 
                  set={currentSet}
                  onOpenNote={onOpenSetNote}
                  onUpdateSet={setCurrentSet}
               />
           )}
           {activeTab === 'flashcards' && (
               <SetFlashcards 
                  userId={currentSet.userId} 
                  set={currentSet}
                  onOpenDeck={onOpenSetDeck}
               />
           )}
           {activeTab === 'practice' && (
               <SetPractice 
                  userId={currentSet.userId}
                  set={currentSet}
                  onStartAssessment={onStartSetAssessment}
               />
           )}
           {activeTab === 'attempts' && (
               <SetAttempts
                  userId={currentSet.userId}
                  set={currentSet}
                  onReviewAttempt={onReviewAttempt}
               />
           )}
       </div>
    </div>
  );
};