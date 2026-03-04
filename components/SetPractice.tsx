import React, { useState, useEffect } from 'react';
import { StudySet, QuizQuestion, PracticeMode } from '../types';
import { Button, Card, Modal, Badge } from './UIComponents';
import { documentService } from '../services/documents';
import { notesService } from '../services/notes';
import { generateQuizFromNote, generateTestFromNote, generateExamFromNote } from '../services/gemini';

interface SetPracticeProps {
  userId: string;
  set: StudySet;
  onStartAssessment: (questions: QuizQuestion[], mode: PracticeMode, title: string, sourceIds: string[]) => void;
}

export const SetPractice: React.FC<SetPracticeProps> = ({ userId, set, onStartAssessment }) => {
  const [loading, setLoading] = useState(true);
  
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourceData, setSourceData] = useState<{id: string; title: string; content: string; type: 'document' | 'note'}[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<PracticeMode | null>(null);

  useEffect(() => {
    prepareSourceData();
  }, [userId, set]);

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
    } finally {
        setLoading(false);
    }
  };

  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (mode: PracticeMode) => {
    if (selectedSourceIds.length === 0) return;
    setIsGenerating(true);
    setGenerationMode(mode);

    try {
        const selectedItems = sourceData.filter(d => selectedSourceIds.includes(d.id));
        const combinedText = selectedItems.map(item => `--- SOURCE: ${item.title} ---\n${item.content}`).join('\n\n');
        
        let questions: QuizQuestion[] = [];
        // Pass userId for logging
        if (mode === 'quiz') questions = await generateQuizFromNote(combinedText, userId);
        else if (mode === 'test') questions = await generateTestFromNote(combinedText, userId);
        else if (mode === 'exam') questions = await generateExamFromNote(combinedText, userId);

        const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
        const title = `${modeLabel}: Set Snapshot (${selectedItems.length} sources)`;
        
        onStartAssessment(questions, mode, title, selectedSourceIds);

    } catch (e) {
        console.error(e);
        alert("This is taking longer than expected. Please try again.");
    } finally {
        setIsGenerating(false);
        setGenerationMode(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading sources...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Practice & Assess</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Create a quiz, test, or exam from your set sources.</p>
         </div>
      </div>

      {sourceData.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No content available</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Add documents to this set in the <strong>Sources</strong> tab to start practicing.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                 <div className="flex items-center justify-between mb-2">
                     <h3 className="font-bold text-slate-700 dark:text-slate-300">Select Sources</h3>
                     <button 
                        onClick={() => setSelectedSourceIds(selectedSourceIds.length === sourceData.length ? [] : sourceData.map(d => d.id))}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                     >
                        {selectedSourceIds.length === sourceData.length ? 'Deselect All' : 'Select All'}
                     </button>
                 </div>
                 
                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {sourceData.map(item => (
                        <label key={item.id} className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors bg-white dark:bg-slate-800">
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
                                    <p className="font-medium text-slate-900 dark:text-white text-xs leading-tight">{item.title}</p>
                                </div>
                            </div>
                        </label>
                    ))}
                 </div>
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                    <span className="font-bold">Note:</span> Assessments are generated from a "snapshot" of the currently selected sources.
                 </div>
            </div>

            <div className="lg:col-span-2">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="flex flex-col justify-between hover:border-green-300 dark:hover:border-green-700 transition-colors border-green-100 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10">
                        <div className="mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center font-bold text-xl mb-3">⚡️</div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Quick Quiz</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">5 Questions • Immediate feedback • Great for warm-ups.</p>
                        </div>
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none border-transparent text-white"
                            onClick={() => handleGenerate('quiz')}
                            disabled={selectedSourceIds.length === 0 || isGenerating}
                            isLoading={isGenerating && generationMode === 'quiz'}
                        >
                            Start Quiz
                        </Button>
                    </Card>

                    <Card className="flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-colors border-amber-100 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-900/10">
                        <div className="mb-4">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold text-xl mb-3">📝</div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Standard Test</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">15 Questions • Review at end • Good for checking progress.</p>
                        </div>
                        <Button 
                            className="w-full bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none border-transparent text-white"
                            onClick={() => handleGenerate('test')}
                            disabled={selectedSourceIds.length === 0 || isGenerating}
                            isLoading={isGenerating && generationMode === 'test'}
                        >
                            Start Test
                        </Button>
                    </Card>

                    <Card className="flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/10">
                        <div className="mb-4">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xl mb-3">⏱</div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Final Exam</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">20 Questions • 45 min Timer • Comprehensive evaluation.</p>
                        </div>
                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none border-transparent text-white"
                            onClick={() => handleGenerate('exam')}
                            disabled={selectedSourceIds.length === 0 || isGenerating}
                            isLoading={isGenerating && generationMode === 'exam'}
                        >
                            Start Exam (Beta)
                        </Button>
                    </Card>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};