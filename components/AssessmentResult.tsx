import React from 'react';
import { Card, Button, Badge } from './UIComponents';
import { FeedbackWidget } from './FeedbackWidget';
import { AssessmentAttempt } from '../types';

interface AssessmentResultProps {
  attempt: AssessmentAttempt;
  xpGained?: number;
  onBack: () => void;
  onRetry?: () => void;
}

export const AssessmentResult: React.FC<AssessmentResultProps> = ({ attempt, xpGained, onBack, onRetry }) => {
  const percentage = Math.round((attempt.score / attempt.maxScore) * 100);
  const isReview = xpGained === undefined;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in zoom-in-95 duration-300">
      
      {isReview && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl mb-8 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="text-xl">🕰</span>
              <span className="font-bold text-sm">You are reviewing a past attempt</span>
           </div>
           <span className="text-xs opacity-75">
              Completed on {new Date(attempt.timestamp).toLocaleString()}
           </span>
        </div>
      )}

      <div className="text-center mb-10">
        {!isReview && (
            <div className="mb-4 text-6xl animate-bounce">
                {percentage >= 90 ? '🏆' : percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
            </div>
        )}
        
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {isReview 
            ? `${attempt.title}`
            : percentage >= 80 ? 'Outstanding Performance!' : percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
        </h2>
        
        {!isReview && (
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
               You answered {attempt.score} out of {attempt.questions.length} questions correctly.
            </p>
        )}

        <Card className="mb-8 bg-white dark:bg-slate-800 border border-indigo-50 dark:border-slate-700 shadow-lg shadow-indigo-100/50 dark:shadow-none max-w-lg mx-auto overflow-hidden relative">
          <div className={`grid ${!isReview ? 'grid-cols-2' : 'grid-cols-1'} gap-0`}>
            <div className="p-6">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Final Score</p>
              <p className={`text-5xl font-extrabold ${percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500'}`}>
                  {percentage}%
              </p>
            </div>
            {!isReview && (
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-l border-indigo-100 dark:border-indigo-800 flex flex-col justify-center">
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">XP Earned</p>
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">+{xpGained}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-center gap-3 max-w-xs mx-auto">
          <Button onClick={onBack} variant="outline" className="w-full">
            {isReview ? '← Back to Notes' : 'Return to Library'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Review</h3>
            <div className="flex gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Correct</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Incorrect</span>
            </div>
        </div>

        {attempt.questions.map((q, idx) => {
          const userAnswer = attempt.userAnswers[idx];
          const isCorrect = userAnswer === q.correctIndex;
          const isSkipped = userAnswer === -1;

          return (
            <Card key={idx} className={`border-l-4 overflow-hidden transition-all duration-200 hover:shadow-md ${isCorrect ? 'border-l-green-500' : isSkipped ? 'border-l-slate-300' : 'border-l-red-500'}`}>
              <div className="flex items-start gap-4">
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm ${isCorrect ? 'bg-green-500' : isSkipped ? 'bg-slate-300 dark:bg-slate-600' : 'bg-red-500'}`}>
                  {isCorrect ? '✓' : isSkipped ? '-' : '✕'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Question {idx + 1}</span>
                      <FeedbackWidget 
                        contentId=""
                        contentType="question"
                        contentText={q.question}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                      />
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-lg mb-6 leading-relaxed">{q.question}</p>
                  
                  <div className="space-y-3 mb-6">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = optIdx === userAnswer;
                      const isTheCorrectAnswer = optIdx === q.correctIndex;
                      
                      let style = "p-3 rounded-lg text-sm flex justify-between items-center border ";
                      
                      if (isTheCorrectAnswer) {
                        style += "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 font-medium ring-1 ring-green-200 dark:ring-green-800"; 
                      } else if (isSelected && !isCorrect) {
                        style += "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800";
                      } else {
                        style += "border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800";
                      }
                      
                      return (
                        <div key={optIdx} className={style}>
                          <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${isTheCorrectAnswer || isSelected ? 'border-current' : 'border-slate-300 dark:border-slate-600'}`}>
                                  {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                          </div>
                          {isSelected && <span className="text-xs font-bold uppercase tracking-wider bg-white/50 dark:bg-black/20 px-2 py-1 rounded">Your Answer</span>}
                          {isTheCorrectAnswer && !isSelected && <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Correct Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {(!isCorrect || isSkipped) && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-200 font-bold">
                         <span>💡 Explanation</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};