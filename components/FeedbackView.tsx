import React, { useState } from 'react';
import { Card, Button } from './UIComponents';
import { feedbackService } from '../services/feedback';

interface FeedbackViewProps {
  userId: string;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ userId }) => {
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() && rating === undefined) return;

    setIsSubmitting(true);
    try {
      await feedbackService.saveGeneralFeedback(userId, message, rating);
      setIsSuccess(true);
      setMessage('');
      setRating(undefined);
    } catch (e) {
      console.error("Failed to submit feedback", e);
      alert("Something went wrong submitting your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            🙌
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thanks!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Your feedback helps us improve Learn More.
          </p>
          <Button variant="outline" onClick={handleReset}>
            Send more feedback
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Feedback</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Help us improve Learn More.</p>
      </div>

      <Card className="space-y-8">
        {/* Rating Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            How’s your experience so far?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${
                  (rating || 0) >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'
                }`}
                title={`${star} stars`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Message Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Your feedback
          </label>
          <textarea
            className="w-full h-40 p-4 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="What's working well? What could be better? Anything confusing or frustrating?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            isLoading={isSubmitting} 
            disabled={(!message.trim() && rating === undefined) || isSubmitting}
          >
            Send feedback
          </Button>
        </div>
      </Card>
    </div>
  );
};
