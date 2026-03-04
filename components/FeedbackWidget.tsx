import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackService } from '../services/feedback';
import { Modal, Button } from './UIComponents';
import { FeedbackType, FeedbackReason, ContentFeedback } from '../types';

interface FeedbackWidgetProps {
  contentId: string;
  contentText?: string;
  contentType: 'note' | 'flashcard' | 'question';
  className?: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ 
  contentId: explicitId, 
  contentText, 
  contentType,
  className = "" 
}) => {
  const { user } = useAuth();
  
  const contentId = explicitId || (contentText ? feedbackService.generateContentId(contentText) : '');
  
  const [currentFeedback, setCurrentFeedback] = useState<ContentFeedback | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<FeedbackReason>('inaccurate');
  const [reportComment, setReportComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && contentId) {
      const existing = feedbackService.getFeedback(user.id, contentId);
      setCurrentFeedback(existing);
    }
  }, [user, contentId]);

  if (!user || !contentId) return null;

  const handleRate = async (type: FeedbackType) => {
    const tempFeedback = { 
        ...currentFeedback, 
        type, 
        userId: user.id, 
        contentId, 
        contentType, 
        timestamp: Date.now(),
        id: 'temp' 
    } as ContentFeedback;
    
    setCurrentFeedback(tempFeedback);

    if (type === 'negative') {
        setIsReportModalOpen(true);
    }

    await feedbackService.saveFeedback(user.id, contentId, contentType, type, contentText);
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
        const saved = await feedbackService.saveFeedback(
            user.id, 
            contentId, 
            contentType, 
            'negative', 
            contentText,
            reportReason, 
            reportComment
        );
        setCurrentFeedback(saved);
        setIsReportModalOpen(false);
    } catch (e) {
        console.error("Failed to submit report", e);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
      setIsReportModalOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mr-1">Feedback:</span>
        
        <button 
            onClick={() => handleRate('positive')}
            className={`p-1.5 rounded-full transition-all duration-200 ${
                currentFeedback?.type === 'positive' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Helpful / Accurate"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
        </button>

        <button 
            onClick={() => handleRate('negative')}
            className={`p-1.5 rounded-full transition-all duration-200 ${
                currentFeedback?.type === 'negative' 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Report Issue"
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
        </button>

        <Modal 
            isOpen={isReportModalOpen} 
            onClose={handleCloseModal}
            title="Report Issue"
            footer={
                <>
                    <Button variant="ghost" onClick={handleCloseModal}>Skip</Button>
                    <Button variant="danger" onClick={handleSubmitReport} isLoading={isSubmitting}>Submit Report</Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Help us improve! What's wrong with this content?
                </p>
                
                <div className="space-y-2">
                    {[
                        { id: 'inaccurate', label: 'Factually Incorrect' },
                        { id: 'formatting', label: 'Formatting Issue' },
                        { id: 'irrelevant', label: 'Irrelevant / Poor Quality' },
                        { id: 'other', label: 'Other' }
                    ].map(reason => (
                        <label key={reason.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <input 
                                type="radio" 
                                name="reason" 
                                value={reason.id} 
                                checked={reportReason === reason.id}
                                onChange={(e) => setReportReason(e.target.value as FeedbackReason)}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{reason.label}</span>
                        </label>
                    ))}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Details (Optional)</label>
                    <textarea 
                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none dark:bg-slate-800 dark:text-white"
                        placeholder="Please describe the issue..."
                        value={reportComment}
                        onChange={(e) => setReportComment(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    </div>
  );
};