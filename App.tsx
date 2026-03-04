import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { UploadWizard } from './components/UploadWizard';
import { MaterialViewer } from './components/MaterialViewer';
import { NoteViewer } from './components/NoteViewer';
import { PastAttemptsView } from './components/PastAttemptsView';
import { PracticeSession } from './components/PracticeSession';
import { FlashcardReview } from './components/FlashcardReview';
import { StatsView } from './components/StatsView';
import { LibraryView } from './components/LibraryView';
import { AssessmentResult } from './components/AssessmentResult';
import { SetOverview } from './components/SetOverview';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { FeedbackView } from './components/FeedbackView';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfUse } from './components/TermsOfUse';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Card, Button, Modal } from './components/UIComponents';
import { UserStats, AppView, PracticeMode, Document, GeneratedNote, QuizQuestion, FlashcardDeck, AssessmentAttempt, StudySet } from './types';
import { generateStudyNotes, generateDocumentOverview, generateQuizFromNote, generateTestFromNote, generateExamFromNote, generateFlashcardsFromNote } from './services/gemini';
import { notesService } from './services/notes';
import { progressService, XP_VALUES, XP_CONFIG } from './services/progress';
import { assessmentService } from './services/assessment';
import { flashcardsService } from './services/flashcards';
import { loggingService } from './services/logging';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState<AppView>('dashboard');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Selection State
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedNote, setSelectedNote] = useState<GeneratedNote | null>(null);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [showPracticeSelection, setShowPracticeSelection] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Practice State
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('quiz');
  const [practiceQuestions, setPracticeQuestions] = useState<QuizQuestion[]>([]);
  const [practiceTitle, setPracticeTitle] = useState<string>('');
  const [practiceStartTime, setPracticeStartTime] = useState<number>(0);
  const [practiceDuration, setPracticeDuration] = useState<number | undefined>(undefined);
  
  // Context for where the practice came from (Note or Set)
  const [practiceContext, setPracticeContext] = useState<{
    type: 'note' | 'set';
    id: string; // noteId or setId
    sourceIds?: string[];
  } | null>(null);

  // Flashcard State
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);

  // Results & History State
  const [completedAttempt, setCompletedAttempt] = useState<AssessmentAttempt | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<AssessmentAttempt | null>(null);
  const [xpGained, setXpGained] = useState(0);

  // Load stats on mount and view change
  useEffect(() => {
    if (user) {
      setStats(progressService.getStats(user.id));
    }
  }, [user, view, completedAttempt]);

  if (!user) return <AuthPage />;

  // --- Handlers ---

  const handleNavigate = (newView: AppView) => {
    // Clear set context if navigating to top-level pages
    if (['dashboard', 'library', 'stats', 'upload', 'profile', 'settings', 'feedback', 'privacy', 'terms'].includes(newView)) {
        setSelectedSet(null);
    }
    
    // Logging for Note View
    if (newView === 'note-viewer' && selectedNote) {
        loggingService.log('note_opened', user.id, { noteId: selectedNote.id });
    }

    setView(newView);
  };

  const handleUploadSuccess = (doc: Document) => {
    setSelectedDoc(doc);
    // Automatically start note generation or go to library
    handleNavigate('library');
  };

  const handleRecordTime = async (durationSeconds: number, type: 'reading' | 'flashcard') => {
      if (!user || durationSeconds < 5) return; // Ignore very short interactions
      
      let earnedXp = 0;
      
      // Only calculate XP if enabled in config (e.g. for events/weekends)
      if (XP_CONFIG.studyTimeXpEnabled) {
          // Base: 1 XP per minute, min 1
          const baseXp = Math.max(1, Math.floor(durationSeconds / 60));
          earnedXp = Math.floor(baseXp * XP_CONFIG.studyTimeXpMultiplier);
      }
      
      const newStats = await progressService.recordActivity(
          user.id, 
          type, 
          earnedXp, 
          durationSeconds
      );
      setStats(newStats);
  };

  const handleGenerateNote = async (doc: Document) => {
    setIsLoading(true);
    try {
      // 1. Generate Content
      const noteContent = await generateStudyNotes(doc.contentText, user.id);
      const overview = await generateDocumentOverview(doc.contentText, user.id);
      
      // 2. Save Note
      const note = await notesService.saveNote(user.id, doc.id, noteContent, overview);
      
      // 3. Award XP
      await progressService.recordActivity(user.id, 'note_gen', XP_VALUES.GENERATE_NOTE);
      
      setSelectedDoc(doc);
      setSelectedNote(note);
      handleNavigate('note-viewer');
    } catch (error) {
      console.error(error);
      alert("This is taking longer than expected. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadNotes = (doc: Document, note?: GeneratedNote) => {
    setSelectedDoc(doc);
    if (note) {
      setSelectedNote(note);
      handleNavigate('note-viewer');
    } else {
      handleGenerateNote(doc);
    }
  };

  const handleViewOverview = (doc: Document, note: GeneratedNote) => {
    setSelectedDoc(doc);
    setSelectedNote(note);
    handleNavigate('overview');
  };
  
  const handleViewHistory = (doc: Document, note: GeneratedNote) => {
    setSelectedDoc(doc);
    setSelectedNote(note);
    handleNavigate('history');
  };

  const startPractice = async (mode: PracticeMode, note: GeneratedNote) => {
    setShowPracticeSelection(false); // Close modal
    setIsLoading(true);
    try {
      let questions: QuizQuestion[] = [];
      let duration: number | undefined = undefined;

      if (mode === 'quiz') {
        questions = await generateQuizFromNote(note.contentText, user.id);
      } else if (mode === 'test') {
        questions = await generateTestFromNote(note.contentText, user.id);
      } else if (mode === 'exam') {
        questions = await generateExamFromNote(note.contentText, user.id);
        duration = 45 * 60; // 45 minutes for exam
      }

      setPracticeMode(mode);
      setPracticeQuestions(questions);
      setPracticeTitle(`${mode.charAt(0).toUpperCase() + mode.slice(1)}: ${selectedDoc?.title || note.title || 'Untitled'}`);
      setPracticeStartTime(Date.now());
      setPracticeDuration(duration);
      
      setPracticeContext({ type: 'note', id: note.id });
      
      loggingService.log('assessment_started', user.id, { mode, noteId: note.id });
      setView('practice'); // Direct set to preserve context
    } catch (error) {
      console.error(error);
      alert("This is taking longer than expected. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetAssessment = (questions: QuizQuestion[], mode: PracticeMode, title: string, sourceIds: string[]) => {
      if (!selectedSet) return;
      
      setPracticeMode(mode);
      setPracticeQuestions(questions);
      setPracticeTitle(title);
      setPracticeStartTime(Date.now());
      setPracticeDuration(mode === 'exam' ? 45 * 60 : undefined);
      
      setPracticeContext({ type: 'set', id: selectedSet.id, sourceIds });

      loggingService.log('assessment_started', user.id, { mode, setId: selectedSet.id });
      setView('practice');
  };

  const handlePracticeComplete = async (score: number, maxScore: number, answers: number[]) => {
    if (!user) return;

    // Calculate XP
    let earnedXp = 0;
    if (practiceMode === 'quiz') earnedXp = score * XP_VALUES.QUIZ_CORRECT;
    if (practiceMode === 'test') earnedXp = (score * XP_VALUES.QUIZ_CORRECT) + XP_VALUES.TEST_COMPLETION_BONUS;
    if (practiceMode === 'exam') earnedXp = (score * XP_VALUES.QUIZ_CORRECT) + XP_VALUES.EXAM_COMPLETION_BONUS;

    // Create Attempt Record
    const attempt: AssessmentAttempt = {
      id: crypto.randomUUID(),
      userId: user.id,
      noteId: practiceContext?.type === 'note' ? practiceContext.id : undefined,
      setId: practiceContext?.type === 'set' ? practiceContext.id : undefined,
      sourceIds: practiceContext?.sourceIds,
      title: practiceTitle,
      mode: practiceMode,
      questions: practiceQuestions,
      userAnswers: answers,
      score,
      maxScore,
      timestamp: Date.now(),
      durationSeconds: Math.floor((Date.now() - practiceStartTime) / 1000)
    };

    // Save Attempt
    const shouldPersist = practiceMode === 'test' || practiceMode === 'exam' || true; 
    
    if (shouldPersist) {
        assessmentService.saveAttempt(attempt);
    }

    // Record Activity for Stats
    await progressService.recordActivity(user.id, practiceMode, earnedXp, attempt.durationSeconds);
    
    loggingService.log('assessment_completed', user.id, { 
        mode: practiceMode, 
        score, 
        maxScore,
        duration: attempt.durationSeconds,
        noteId: attempt.noteId,
        setId: attempt.setId
    });

    // Update State
    setXpGained(earnedXp);
    setCompletedAttempt(attempt);
    setView('results');
  };

  const handleCreateFlashcards = async (note: GeneratedNote) => {
    setIsLoading(true);
    try {
      // Generate new cards
      const cards = await generateFlashcardsFromNote(note.contentText, user.id);
      const deck = await flashcardsService.saveDeck(user.id, note.id, cards);
      
      setCurrentDeck(deck);
      loggingService.log('flashcards_started', user.id, { deckId: deck.id, noteId: note.id });
      setView('flashcards');
    } catch (error) {
      console.error(error);
      alert("This is taking longer than expected. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeck = (deck: FlashcardDeck) => {
      setCurrentDeck(deck);
      loggingService.log('flashcards_started', user.id, { deckId: deck.id });
      setView('flashcards');
  };

  const handleFlashcardsComplete = async (masteredCount: number, durationSeconds: number) => {
    if (currentDeck) {
       const xp = masteredCount * XP_VALUES.FLASHCARD_REVIEW;
       await progressService.recordActivity(user.id, 'flashcard', xp, durationSeconds, currentDeck.cards.length);
    }
    // Return to correct view
    if (selectedSet && view === 'flashcards') {
        setView('set-overview');
    } else {
        setView('library'); // Changed to Library for broader access, or note-viewer
    }
  };
  
  const handleFlashcardsExit = async (durationSeconds: number) => {
      // Record time even on early exit
      await handleRecordTime(durationSeconds, 'flashcard');
      
      if (selectedSet) {
          setView('set-overview');
      } else {
          setView('library');
      }
  };

  // History Review Handler
  const handleReviewAttempt = (attempt: AssessmentAttempt) => {
    setReviewAttempt(attempt);
    setView('results'); 
  };

  const handleBackFromResults = () => {
    // Determine where to go back to based on if it was a review or fresh completion
    if (reviewAttempt) {
      // If we were reviewing history:
      if (selectedSet) {
         setReviewAttempt(null);
         setView('set-overview');
      } else {
         setReviewAttempt(null);
         setView('history');
      }
    } else {
      // If just finished a test
      setCompletedAttempt(null);
      if (practiceContext?.type === 'set') {
          setView('set-overview');
      } else {
          setView('note-viewer');
      }
    }
  };

  // --- Set Handlers ---
  const handleOpenSet = (set: StudySet) => {
    setSelectedSet(set);
    setView('set-overview');
  };

  const handlePracticeSet = (set: StudySet) => {
    setSelectedSet(set);
    setView('set-overview');
  };

  const handleOpenSetNote = (note: GeneratedNote) => {
    setSelectedNote(note);
    setSelectedDoc(null);
    setView('note-viewer');
  };

  const handleOpenSetDeck = (deck: FlashcardDeck) => {
      setCurrentDeck(deck);
      loggingService.log('flashcards_started', user.id, { deckId: deck.id, setId: selectedSet?.id });
      setView('flashcards');
  };

  // --- Render ---

  // Loading Overlay
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-50">
        <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-900 dark:text-white font-medium text-lg mb-2">Generating study material...</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center">
            This feature is in beta — results may vary as we improve the experience.
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300`}>
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => handleNavigate('dashboard')}
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 dark:shadow-none shadow-md">L</div>
                <span className="font-bold text-slate-900 dark:text-white hidden sm:block">Learn More</span>
                <span 
                    title="You’re using an early version of Learn More. Some features may change."
                    className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 uppercase tracking-wide ml-1 select-none"
                >
                    Beta
                </span>
              </div>
              
              <div className="hidden md:flex gap-1">
                <button 
                    onClick={() => handleNavigate('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => handleNavigate('library')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'library' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Library
                </button>
                <button 
                    onClick={() => handleNavigate('stats')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'stats' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Stats
                </button>
                <button 
                    onClick={() => handleNavigate('feedback')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'feedback' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Feedback
                </button>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              {/* Standalone Streak Badge */}
              {stats && stats.streakDays > 0 && (
                  <div className="hidden md:flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 px-3 py-1.5 rounded-full shadow-sm animate-in fade-in">
                      <span className="text-sm">🔥</span>
                      <span className="text-xs font-bold text-orange-700 dark:text-orange-300">{stats.streakDays} day streak</span>
                  </div>
              )}

              <div className="flex items-center gap-4">
                <button 
                    onClick={() => handleNavigate('profile')}
                    className="hidden sm:flex flex-col items-end hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1 rounded-lg transition-colors cursor-pointer text-right"
                >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Lvl {stats?.level || 1} Scholar</span>
                </button>
                
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                <button 
                    onClick={() => setShowLogoutModal(true)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                >
                    Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative pb-24 md:pb-8">
        {view === 'dashboard' && stats && (
          <Dashboard 
            userId={user.id}
            stats={stats} 
            documents={[]} // Dashboard doesn't need docs list anymore
            onNewUpload={() => handleNavigate('upload')}
            onSelectDocument={() => handleNavigate('library')}
            onOpenSet={handleOpenSet}
            onPracticeSet={handlePracticeSet}
          />
        )}

        {view === 'set-overview' && selectedSet && (
            <SetOverview 
                set={selectedSet}
                onBack={() => handleNavigate('dashboard')}
                onOpenSetNote={handleOpenSetNote}
                onOpenSetDeck={handleOpenSetDeck}
                onReviewAttempt={handleReviewAttempt}
                onStartSetAssessment={handleStartSetAssessment}
            />
        )}

        {view === 'library' && (
          <LibraryView 
            userId={user.id}
            onRead={handleReadNotes}
            onViewOverview={handleViewOverview}
            onPractice={(doc, note) => {
                 setSelectedDoc(doc);
                 if (note) setSelectedNote(note);
                 // Open modal instead of auto-start
                 if (note) setShowPracticeSelection(true);
            }}
            onViewHistory={handleViewHistory}
            onUploadNew={() => handleNavigate('upload')}
            onCreateDeck={(doc, note) => {
                setSelectedDoc(doc);
                setSelectedNote(note);
                handleCreateFlashcards(note);
            }}
            onOpenDeck={handleOpenDeck}
          />
        )}

        {view === 'upload' && (
          <UploadWizard 
            userId={user.id} 
            onSuccess={handleUploadSuccess}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {view === 'overview' && selectedDoc && selectedNote && (
          <MaterialViewer 
            document={selectedDoc}
            note={selectedNote}
            onReadNotes={() => handleNavigate('note-viewer')}
            onBack={() => handleNavigate('library')}
          />
        )}

        {view === 'note-viewer' && selectedNote && (
          <NoteViewer 
            note={selectedNote}
            documentTitle={selectedDoc?.title || selectedNote.title || 'Study Note'}
            onBack={() => selectedSet ? setView('set-overview') : handleNavigate('library')}
            onViewHistory={() => selectedNote && selectedDoc && handleViewHistory(selectedDoc, selectedNote)}
            onStartQuiz={(note) => startPractice('quiz', note)}
            onStartTest={(note) => startPractice('test', note)}
            onStartExam={(note) => startPractice('exam', note)}
            onStartFlashcards={(note) => handleCreateFlashcards(note)}
            onRecordTime={(duration) => handleRecordTime(duration, 'reading')}
          />
        )}

        {view === 'history' && selectedDoc && selectedNote && (
          <PastAttemptsView 
            document={selectedDoc}
            attempts={assessmentService.getAttempts(user.id, selectedNote.id)}
            onBack={() => handleNavigate('note-viewer')}
            onReviewAttempt={handleReviewAttempt}
          />
        )}

        {view === 'practice' && (
            <PracticeSession 
                title={practiceTitle}
                questions={practiceQuestions}
                mode={practiceMode}
                startTime={practiceStartTime}
                durationSeconds={practiceDuration}
                onComplete={handlePracticeComplete}
                onExit={() => selectedSet ? setView('set-overview') : handleNavigate('note-viewer')}
            />
        )}

        {view === 'results' && (
            <AssessmentResult 
                attempt={reviewAttempt || completedAttempt!}
                xpGained={reviewAttempt ? undefined : xpGained}
                onBack={handleBackFromResults}
            />
        )}

        {view === 'flashcards' && currentDeck && (
            <FlashcardReview 
                title={currentDeck.title || "Flashcards"}
                cards={currentDeck.cards}
                onComplete={handleFlashcardsComplete}
                onExit={handleFlashcardsExit}
            />
        )}

        {view === 'stats' && stats && (
            <StatsView 
                stats={stats}
                onBack={() => handleNavigate('dashboard')}
            />
        )}

        {view === 'profile' && (
            <ProfileView 
                onNavigateSettings={() => handleNavigate('settings')}
            />
        )}

        {view === 'settings' && (
            <SettingsView 
                onBack={() => handleNavigate('profile')}
                onViewPrivacy={() => handleNavigate('privacy')}
                onViewTerms={() => handleNavigate('terms')}
            />
        )}

        {view === 'feedback' && (
            <FeedbackView 
                userId={user.id}
            />
        )}

        {view === 'privacy' && (
            <PrivacyPolicy 
                onBack={() => handleNavigate('settings')}
            />
        )}

        {view === 'terms' && (
            <TermsOfUse 
                onBack={() => handleNavigate('settings')}
            />
        )}

        {/* Practice Selection Modal */}
        {showPracticeSelection && selectedNote && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <Card className="max-w-md w-full p-6 relative shadow-2xl dark:shadow-none dark:border-slate-700">
                    <button 
                        onClick={() => setShowPracticeSelection(false)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        ✕
                    </button>
                    
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                            🎯
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Choose Practice Mode</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select how you want to test your knowledge.</p>
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => startPractice('quiz', selectedNote)}
                            className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-green-800 dark:group-hover:text-green-400">⚡️ Quick Quiz</span>
                                <span className="text-xs bg-slate-100 dark:bg-slate-700 group-hover:bg-green-200 dark:group-hover:bg-green-900 text-slate-500 dark:text-slate-400 group-hover:text-green-800 dark:group-hover:text-green-300 px-2 py-1 rounded-full">5 Questions</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-green-700 dark:group-hover:text-green-400">Immediate feedback. Low pressure. Best for quick review.</p>
                        </button>

                        <button 
                            onClick={() => startPractice('test', selectedNote)}
                            className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-800 dark:group-hover:text-amber-400">📝 Standard Test</span>
                                <span className="text-xs bg-slate-100 dark:bg-slate-700 group-hover:bg-amber-200 dark:group-hover:bg-amber-900 text-slate-500 dark:text-slate-400 group-hover:text-amber-800 dark:group-hover:text-amber-300 px-2 py-1 rounded-full">15 Questions</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400">No immediate feedback. Review answers at the end.</p>
                        </button>

                        <button 
                            onClick={() => startPractice('exam', selectedNote)}
                            className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-800 dark:group-hover:text-indigo-400">⏱ Final Exam</span>
                                <span className="text-xs bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 text-slate-500 dark:text-slate-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 px-2 py-1 rounded-full">20 Questions • 45m</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Timed session. Comprehensive coverage. High XP rewards.</p>
                        </button>
                    </div>
                </Card>
            </div>
        )}

        {/* Logout Confirmation Modal */}
        <Modal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            title="Sign Out"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={() => { logout(); setShowLogoutModal(false); }}>Sign Out</Button>
                </>
            }
        >
            <p className="text-slate-600 dark:text-slate-300">
                Are you sure you want to sign out? You will need to log in again to access your study materials.
            </p>
        </Modal>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav currentView={view} onNavigate={handleNavigate} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;