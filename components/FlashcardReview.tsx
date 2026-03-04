import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, ProgressBar } from './UIComponents';
import { FeedbackWidget } from './FeedbackWidget';
import { Flashcard } from '../types';

interface FlashcardReviewProps {
  title: string;
  cards: Flashcard[];
  onComplete: (masteredCount: number, durationSeconds: number) => void;
  onExit: (durationSeconds: number) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ 
  title, 
  cards, 
  onComplete, 
  onExit 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [sessionOver, setSessionOver] = useState(false);
  
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const getDuration = () => {
    return (Date.now() - startTimeRef.current) / 1000;
  };

  if (!cards || cards.length === 0) {
     return <div className="p-8 text-center text-slate-500 dark:text-slate-400">No flashcards available in this set.</div>;
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionOver(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRate = (mastered: boolean) => {
    if (mastered) {
      setMasteredCount(prev => prev + 1);
    }
    handleNext();
  };

  const handleFinish = () => {
    onComplete(masteredCount, getDuration());
  };
  
  const handleExit = () => {
    onExit(getDuration());
  };

  if (sessionOver) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in zoom-in-95">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Review Complete!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You mastered <span className="font-bold text-indigo-600 dark:text-indigo-400">{masteredCount}</span> out of <span className="font-bold text-slate-900 dark:text-white">{cards.length}</span> cards.
        </p>
        <Button onClick={handleFinish} size="lg">Return to Notes</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleExit}>Exit Review</Button>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Card {currentIndex + 1} of {cards.length}
        </span>
      </div>

      <ProgressBar value={currentIndex} max={cards.length} className="mb-8" />

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-4 md:gap-8 justify-center min-h-[420px] w-full">
            {/* Left Arrow - Hidden on mobile */}
            <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="hidden md:block p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous card"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>

            {/* Card Container */}
            <div 
            className="relative w-full max-w-lg h-96 cursor-pointer group [perspective:1000px]"
            onClick={handleFlip}
            >
            <div className={`
                w-full h-full transition-all duration-500 [transform-style:preserve-3d]
                ${isFlipped ? '[transform:rotateY(180deg)]' : ''}
            `}>
                {/* Front */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
                <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8 border-2 border-indigo-50 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 rounded-2xl transition-colors">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Question</span>
                    <p className="text-2xl font-medium text-slate-900 dark:text-white leading-relaxed overflow-y-auto max-h-60 scrollbar-hide">
                    {currentCard.front}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-8 absolute bottom-6">Tap to flip</p>
                </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8 bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none rounded-2xl border-2 border-indigo-500 dark:border-indigo-600">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-6">Answer</span>
                    <p className="text-xl font-medium leading-relaxed overflow-y-auto max-h-60 scrollbar-hide">
                    {currentCard.back}
                    </p>
                </div>
                </div>
            </div>
            </div>

            {/* Right Arrow - Hidden on mobile */}
            <button 
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="hidden md:block p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next card"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden w-full justify-between items-center mt-6 px-2">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                className="text-slate-500 dark:text-slate-400"
            >
                ← Previous
            </Button>
            <Button 
                variant="ghost" 
                size="sm"
                onClick={handleNext} 
                disabled={currentIndex === cards.length - 1}
                className="text-slate-500 dark:text-slate-400"
            >
                Next →
            </Button>
        </div>

        {/* Feedback for current card */}
        <div className="mt-4 mb-2">
            <FeedbackWidget 
                key={currentIndex} 
                contentId="" 
                contentType="flashcard"
                contentText={`${currentCard.front} | ${currentCard.back}`}
            />
        </div>

        {/* Grading Controls */}
        <div className="h-16 flex justify-center items-center w-full max-w-sm">
            {isFlipped ? (
            <div className="flex gap-4 animate-in slide-in-from-bottom-4 duration-300 w-full">
                <Button 
                variant="outline" 
                className="flex-1 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400"
                onClick={(e) => { e.stopPropagation(); handleRate(false); }}
                >
                Not yet
                </Button>
                <Button 
                variant="primary" 
                className="flex-1 bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none border-transparent"
                onClick={(e) => { e.stopPropagation(); handleRate(true); }}
                >
                Got it!
                </Button>
            </div>
            ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium animate-pulse">
                Tap card to see answer
            </p>
            )}
        </div>
      </div>
    </div>
  );
};