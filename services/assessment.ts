import { AssessmentSession, AssessmentAttempt, PracticeMode, QuizQuestion } from '../types';

const SESSION_KEY_PREFIX = 'learn_more_session_';
const ATTEMPTS_STORAGE_KEY = 'learn_more_attempts_db';

export const assessmentService = {
  startSession(
    userId: string,
    mode: PracticeMode,
    title: string,
    questions: QuizQuestion[],
    fromId?: string,
    sourceType: 'material' | 'note' | 'set' = 'note',
    durationSeconds?: number,
    sourceIds?: string[]
  ): AssessmentSession {
    const session: AssessmentSession = {
      id: crypto.randomUUID(),
      userId,
      mode,
      title,
      questions,
      answers: new Array(questions.length).fill(-1),
      currentIndex: 0,
      startTime: Date.now(),
      durationSeconds,
      fromId,
      sourceType,
      sourceIds
    };
    
    this.saveSession(session);
    return session;
  },

  getActiveSession(userId: string): AssessmentSession | null {
    const json = localStorage.getItem(`${SESSION_KEY_PREFIX}${userId}`);
    return json ? JSON.parse(json) : null;
  },

  saveSession(session: AssessmentSession): void {
    localStorage.setItem(`${SESSION_KEY_PREFIX}${session.userId}`, JSON.stringify(session));
  },

  updateProgress(userId: string, answers: number[], currentIndex: number): void {
    const session = this.getActiveSession(userId);
    if (session) {
      session.answers = answers;
      session.currentIndex = currentIndex;
      this.saveSession(session);
    }
  },

  clearSession(userId: string): void {
    localStorage.removeItem(`${SESSION_KEY_PREFIX}${userId}`);
  },

  // --- Persistence for History ---

  saveAttempt(attempt: AssessmentAttempt): void {
    const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
    attempts.push(attempt);
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  },

  getAttempts(userId: string, noteId?: string): AssessmentAttempt[] {
    const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
    return attempts
      .filter(a => a.userId === userId && (!noteId || a.noteId === noteId))
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  },

  getAttemptsByNoteIds(userId: string, noteIds: string[]): AssessmentAttempt[] {
    const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
    return attempts
      .filter(a => a.userId === userId && a.noteId && noteIds.includes(a.noteId))
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  getAttemptsBySetId(userId: string, setId: string): AssessmentAttempt[] {
      const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
      return attempts
        .filter(a => a.userId === userId && a.setId === setId)
        .sort((a, b) => b.timestamp - a.timestamp);
  },

  async deleteAttempt(userId: string, attemptId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
    const filtered = attempts.filter(a => !(a.id === attemptId && a.userId === userId));
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(filtered));
  },

  deleteByNoteId(userId: string, noteId: string): void {
     const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
     const filtered = attempts.filter(a => !(a.userId === userId && a.noteId === noteId));
     localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(filtered));
  },

  deleteBySetId(userId: string, setId: string): void {
     const attempts: AssessmentAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]');
     const filtered = attempts.filter(a => !(a.userId === userId && a.setId === setId));
     localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(filtered));
  }
};