import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, ProgressBar, Badge } from './UIComponents';
import { FeedbackWidget } from './FeedbackWidget';
import { PracticeMode, QuizQuestion } from '../types';

interface PracticeSessionProps {
  title: string;
  questions: QuizQuestion[];
  mode: PracticeMode;
  initialAnswers?: number[];
  initialIndex?: number;
  startTime?: number;
  durationSeconds?: number;
  onUpdateProgress?: (answers: number[], currentIndex: number) => void;
  onComplete: (score: number, maxScore: number, answers: number[]) => void;
  onExit: () => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({ 
  title, 
  questions, 
  mode, 
  initialAnswers,
  initialIndex = 0,
  startTime,
  durationSeconds,
  onUpdateProgress,
  onComplete, 
  onExit 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    initialAnswers || new Array(questions.length).fill(-1)
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  // Calculate initial remaining time if in exam mode
  const calculateRemainingTime = () => {
    if (mode === 'exam' && startTime && durationSeconds) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, durationSeconds - elapsedSeconds);
    }
    return 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemainingTime());
  
  const answersRef = useRef(selectedAnswers);
  useEffect(() => {
    answersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    if (onUpdateProgress && !isFinished) {
      onUpdateProgress(selectedAnswers, currentQuestionIndex);
    }
  }, [selectedAnswers, currentQuestionIndex, onUpdateProgress, isFinished]);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold mb-4 dark:text-white">No questions available</h3>
        <Button onClick={onExit}>Return</Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  useEffect(() => {
    if (mode !== 'exam' || !startTime || !durationSeconds || isFinished) return;

    const timer = setInterval(() => {
      const remaining = calculateRemainingTime();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        if (!isFinished) {
           handleFinish(true); 
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, startTime, durationSeconds, isFinished]);

  useEffect(() => {
    if ((mode === 'test' || mode === 'exam') && !isFinished) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [mode, isFinished]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isFinished) return;
    if (mode === 'quiz' && showFeedback) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);

    if (mode === 'quiz') {
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      if (mode === 'quiz') {
        const isAnswered = selectedAnswers[nextIndex] !== -1;
        setShowFeedback(isAnswered);
      } else {
        setShowFeedback(false);
      }
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      if (mode === 'quiz') {
        const isAnswered = selectedAnswers[prevIndex] !== -1;
        setShowFeedback(isAnswered);
      }
    }
  };

  const handleExitAttempt = () => {
    if (isFinished) {
      onExit();
    } else {
      setShowExitConfirmation(true);
    }
  };

  const handleFinish = (autoSubmit = false) => {
    setIsFinished(true);
    const finalAnswers = autoSubmit ? answersRef.current : selectedAnswers;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correctIndex) correctCount++;
    });
    
    if (autoSubmit) {
       onComplete(correctCount, questions.length, finalAnswers);
    } else {
       setTimeout(() => {
           onComplete(correctCount, questions.length, finalAnswers);
       }, 1500);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeBadge = () => {
    switch(mode) {
        case 'quiz': return <Badge color="green">Quiz Mode • Low Pressure</Badge>;
        case 'test': return <Badge color="amber">Test Mode • Delayed Feedback</Badge>;
        case 'exam': 
          const isUrgent = timeLeft < 60; 
          return <Badge color={isUrgent ? 'amber' : 'indigo'}>Exam Mode • {formatTime(timeLeft)}</Badge>;
    }
  };

  if (isFinished && !startTime) {
      return (
          <div className="max-w-md mx-auto text-center py-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Submitting Results...</h2>
              <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleExitAttempt}>Exit</Button>
        <div className="flex flex-col items-end">
           <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 truncate max-w-[200px]">{title}</span>
           {getModeBadge()}
        </div>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      <ProgressBar value={currentQuestionIndex + 1} max={questions.length} className="mb-8" />

      <Card className="min-h-[400px] flex flex-col relative">
        <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed pr-8">
                {currentQ.question}
            </h3>
        </div>

        <div className="space-y-3 flex-1">
            {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                const isCorrect = idx === currentQ.correctIndex;
                
                let buttonStyle = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ";
                
                // Styling logic
                if (mode === 'quiz' && showFeedback) {
                    if (isCorrect) buttonStyle += "bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300";
                    else if (isSelected && !isCorrect) buttonStyle += "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300";
                    else buttonStyle += "border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-50";
                } else {
                    if (isSelected) buttonStyle += "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-medium";
                    else buttonStyle += "border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300";
                }

                return (
                    <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        className={buttonStyle}
                        disabled={(mode === 'quiz' && showFeedback) || isFinished}
                    >
                        <span className={`inline-block w-6 h-6 rounded-full border text-xs leading-6 text-center mr-3 
                            ${isSelected ? 'border-current' : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'}`}>
                            {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                    </button>
                );
            })}
        </div>

        {/* Quiz Mode Immediate Feedback Explanation */}
        {mode === 'quiz' && showFeedback && (
            <div className={`mt-6 p-4 rounded-xl text-sm ${
                selectedAnswers[currentQuestionIndex] === currentQ.correctIndex 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300'
            }`}>
                <p className="font-bold mb-1">
                    {selectedAnswers[currentQuestionIndex] === currentQ.correctIndex ? 'Correct! 🎉' : 'Explanation:'}
                </p>
                {currentQ.explanation}
            </div>
        )}

        <div className="mt-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Button 
                    onClick={handlePrev} 
                    variant="ghost" 
                    disabled={currentQuestionIndex === 0 || isFinished}
                    className={currentQuestionIndex === 0 ? "invisible" : ""}
                >
                    Previous
                </Button>
                
                <FeedbackWidget 
                    key={currentQuestionIndex} 
                    contentId=""
                    contentType="question"
                    contentText={currentQ.question}
                />
            </div>

            {(mode !== 'quiz' || showFeedback) && (
                 <Button onClick={handleNext} size="lg" disabled={isFinished}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish & Submit' : 'Next Question'}
                 </Button>
            )}
        </div>
      </Card>

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <Card className="max-w-sm w-full p-6 shadow-2xl dark:shadow-none border dark:border-slate-700 relative">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Exit Assessment?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                 Are you sure you want to leave? Your current progress will be lost and this attempt cannot be resumed.
              </p>
              <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setShowExitConfirmation(false)}>Continue assessment</Button>
                  <Button variant="danger" onClick={onExit}>Exit anyway</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};