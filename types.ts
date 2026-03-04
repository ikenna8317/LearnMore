
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
  username?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'system' | 'light' | 'dark';
  assessmentLength: 'short' | 'medium' | 'long';
  noteLength: 'short' | 'standard' | 'detailed';
  emailNotifications: boolean;
}

export interface DocumentOverview {
  summary: string; // Markdown supported
  keyPoints: string[];
}

export interface Document {
  id: string;
  userId: string;
  setId?: string; // Optional: linked to a study set (isolated from library)
  title: string;
  originalFilename: string;
  contentText: string;
  sourceType: "txt" | "pdf" | "docx";
  createdAt: number;
}

export interface GeneratedNote {
  id: string;
  userId: string;
  documentId?: string; // Optional: linked to single doc
  setId?: string;      // Optional: linked to a study set
  title?: string;      // Title for set-based notes
  sourceSummary?: string; // e.g. "Generated from 3 documents"
  sourceIds?: string[]; // IDs of sources used for this snapshot
  contentText: string; // Markdown
  createdAt: number;
  overview?: DocumentOverview; // Moved here from Document
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  noteId?: string; // Optional: linked to a specific note
  setId?: string;  // Optional: linked to a study set
  title?: string;  // Title for set-based decks
  sourceSummary?: string;
  sourceIds?: string[]; // IDs of sources used for this snapshot
  cards: Flashcard[];
  createdAt: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  noteId?: string; // Linked to single note (optional)
  setId?: string;  // Linked to study set (optional)
  sourceIds?: string[]; // IDs of sources used for this snapshot
  title: string;
  mode: PracticeMode;
  questions: QuizQuestion[];
  userAnswers: number[]; // Index of selected answer
  score: number;
  maxScore: number;
  timestamp: number;
  durationSeconds: number;
}

export interface DailyActivity {
  date: string; // ISO Date string (YYYY-MM-DD)
  xpEarned: number;
  minutesSpent: number;
  actionCount: number;
}

export interface UserStats {
  xp: number;
  level: number;
  
  // Totals
  materialsCreated: number;
  quizzesTaken: number;
  testsTaken: number;
  examsTaken: number;
  flashcardsReviewed: number; // Total number of cards flipped/rated
  
  // Engagement
  streakDays: number;
  highestStreak: number; // Added: Highest recorded streak
  lastStudyDate: string | null; // ISO Date string
  
  // History
  activityHistory: DailyActivity[];
}

export interface SetContentItem {
  id: string; // The ID of the document or note
  type: 'document' | 'note';
  addedAt: number;
}

export interface StudySet {
  id: string;
  userId: string;
  title: string;
  documentCount: number;
  noteCount: number;
  items: SetContentItem[];
  createdAt: number;
}

export type AppView = 'dashboard' | 'library' | 'upload' | 'overview' | 'practice' | 'results' | 'note-viewer' | 'flashcards' | 'stats' | 'history' | 'set-overview' | 'profile' | 'settings' | 'feedback' | 'privacy' | 'terms';

export type PracticeMode = 'quiz' | 'test' | 'exam';

export interface PracticeSession {
  mode: PracticeMode;
  materialId: string;
  answers: number[]; // Index of selected answer, -1 if unanswered
  startTime: number;
  isComplete: boolean;
  timeLimit?: number; // In seconds, for exam mode
}

export interface AssessmentSession {
  id: string;
  userId: string;
  mode: PracticeMode;
  title: string;
  questions: QuizQuestion[];
  answers: number[];
  currentIndex: number;
  startTime: number;
  durationSeconds?: number; // Added for Exam Mode
  fromId?: string; // Material or Note ID or Set ID
  sourceType: 'note' | 'material' | 'set';
  sourceIds?: string[]; // For set snapshots
}

// --- Feedback Types ---
export type FeedbackType = 'positive' | 'negative';
export type FeedbackReason = 'inaccurate' | 'formatting' | 'irrelevant' | 'offensive' | 'other';

export interface ContentFeedback {
  id: string;
  userId: string;
  contentId: string; // Hash of content or UUID
  contentType: 'note' | 'flashcard' | 'question';
  type: FeedbackType;
  reason?: FeedbackReason;
  comment?: string;
  timestamp: number;
  contextSnippet?: string; // First ~50 chars for context
}

export interface GeneralFeedback {
  id: string;
  userId: string;
  message: string;
  rating?: number; // 1-5
  timestamp: number;
  metadata: {
    appVersion: string;
    isBeta: boolean;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    theme: string;
    route?: string;
  };
}

export interface ActivityLog {
  id: string;
  userId?: string;
  eventType: string;
  metadata?: any;
  createdAt: number;
}
