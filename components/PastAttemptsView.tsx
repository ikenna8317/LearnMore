import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from './UIComponents';
import { AssessmentAttempt, Document } from '../types';
import { assessmentService } from '../services/assessment';
import { useAuth } from '../contexts/AuthContext';

interface PastAttemptsViewProps {
  document: Document;
  attempts: AssessmentAttempt[];
  onBack: () => void;
  onReviewAttempt: (attempt: AssessmentAttempt) => void;
}

export const PastAttemptsView: React.FC<PastAttemptsViewProps> = ({ document, attempts: initialAttempts, onBack, onReviewAttempt }) => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState(initialAttempts);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; attempt: AssessmentAttempt | null }>({ isOpen: false, attempt: null });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    setAttempts(initialAttempts);
  }, [initialAttempts]);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.attempt || !user) return;
    setIsProcessingAction(true);
    try {
        await assessmentService.deleteAttempt(user.id, deleteModal.attempt.id);
        setAttempts(prev => prev.filter(a => a.id !== deleteModal.attempt?.id));
        setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (e) {
        alert("Failed to delete attempt");
    } finally {
        setIsProcessingAction(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>← Back to Note</Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Past Attempts</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">History for <span className="font-semibold">{document.title}</span></p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No attempts yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Take a quiz, test, or exam to start tracking your performance on this document.
            </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map(attempt => {
            const percent = Math.round((attempt.score / attempt.maxScore) * 100);
            let badgeColor: 'green' | 'amber' | 'indigo' | 'slate' = 'slate';
            let icon = '📝';
            
            if (attempt.mode === 'quiz') { badgeColor = 'green'; icon = '⚡️'; }
            if (attempt.mode === 'test') { badgeColor = 'amber'; icon = '📝'; }
            if (attempt.mode === 'exam') { badgeColor = 'indigo'; icon = '⏱'; }

            return (
              <div 
                key={attempt.id}
                onClick={() => onReviewAttempt(attempt)}
                className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative pr-12"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-${badgeColor}-50 dark:bg-${badgeColor}-900/30 text-${badgeColor}-600 dark:text-${badgeColor}-400`}>
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white">{attempt.title}</h3>
                      <Badge color={badgeColor}>{attempt.mode.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(attempt.timestamp).toLocaleDateString()} at {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-4 sm:pt-0">
                  <div className="text-right">
                    <span className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Score</span>
                    <span className={`text-xl font-bold ${percent >= 80 ? 'text-green-600 dark:text-green-400' : percent >= 50 ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}`}>
                      {percent}%
                    </span>
                  </div>
                  
                  <Button variant="outline" size="sm" className="group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-800">
                    Review Details →
                  </Button>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, attempt }); }}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Attempt"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        title="Delete Attempt"
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
             Are you sure you want to delete this attempt for <span className="font-bold">{deleteModal.attempt?.title}</span>?
           </p>
           <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
             This action cannot be undone. XP earned from this attempt will remain.
           </p>
        </div>
      </Modal>

    </div>
  );
};