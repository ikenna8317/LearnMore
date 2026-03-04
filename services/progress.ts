import { UserStats, DailyActivity } from '../types';

const STATS_STORAGE_KEY_PREFIX = 'learn_more_stats_';

export const XP_VALUES = {
  GENERATE_NOTE: 50,
  READ_NOTE: 10,
  QUIZ_CORRECT: 10,
  TEST_COMPLETION_BONUS: 20,
  EXAM_COMPLETION_BONUS: 100,
  FLASHCARD_REVIEW: 5 // Per card mastered
};

// Configuration for event-based XP systems
export const XP_CONFIG = {
  studyTimeXpEnabled: false, // Set to true during events to award XP for time spent
  studyTimeXpMultiplier: 1.0
};

const LEVEL_THRESHOLD = 500;

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / LEVEL_THRESHOLD) + 1;
};

export const getLevelProgress = (xp: number) => {
  const level = calculateLevel(xp);
  const currentLevelXp = xp % LEVEL_THRESHOLD;
  const progressPercent = (currentLevelXp / LEVEL_THRESHOLD) * 100;
  return { level, currentLevelXp, nextLevelXp: LEVEL_THRESHOLD, progressPercent };
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const progressService = {
  getStats(userId: string): UserStats {
    const key = `${STATS_STORAGE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration for older stats objects if fields are missing
      if (parsed.activityHistory === undefined) {
        parsed.activityHistory = [];
        parsed.testsTaken = 0;
        parsed.examsTaken = 0;
        parsed.flashcardsReviewed = 0;
        parsed.lastStudyDate = null;
      }
      // Migration for highestStreak
      if (parsed.highestStreak === undefined) {
        parsed.highestStreak = parsed.streakDays || 0;
      }
      return parsed;
    }

    // Default stats
    const initialStats: UserStats = {
      xp: 0,
      level: 1,
      materialsCreated: 0,
      quizzesTaken: 0,
      testsTaken: 0,
      examsTaken: 0,
      flashcardsReviewed: 0,
      streakDays: 0,
      highestStreak: 0,
      lastStudyDate: null,
      activityHistory: []
    };
    
    localStorage.setItem(key, JSON.stringify(initialStats));
    return initialStats;
  },

  async recordActivity(
    userId: string, 
    type: 'note_gen' | 'quiz' | 'test' | 'exam' | 'flashcard' | 'reading',
    xpEarned: number,
    durationSeconds: number = 0,
    countValue: number = 1 // e.g. number of flashcards, usually 1 for others
  ): Promise<UserStats> {
    // Simulate server latency
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentStats = this.getStats(userId);
    const today = getTodayDateString();
    
    // 1. Update XP and Level
    const newXp = currentStats.xp + xpEarned;
    const newLevel = calculateLevel(newXp);

    // 2. Update Totals
    const updates: Partial<UserStats> = {
      xp: newXp,
      level: newLevel,
    };

    switch (type) {
      case 'note_gen': updates.materialsCreated = currentStats.materialsCreated + 1; break;
      case 'quiz': updates.quizzesTaken = currentStats.quizzesTaken + 1; break;
      case 'test': updates.testsTaken = currentStats.testsTaken + 1; break;
      case 'exam': updates.examsTaken = currentStats.examsTaken + 1; break;
      case 'flashcard': updates.flashcardsReviewed = currentStats.flashcardsReviewed + countValue; break;
      // 'reading' doesn't update a specific counter other than minutes/actions below
    }

    // 3. Update Streak
    let newStreak = currentStats.streakDays;
    const lastDate = currentStats.lastStudyDate;
    
    if (lastDate !== today) {
      if (lastDate) {
        const last = new Date(lastDate);
        const curr = new Date(today);
        const diffTime = Math.abs(curr.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
        } else {
          // Break in streak
          newStreak = 1;
        }
      } else {
        // First day ever
        newStreak = 1;
      }
      updates.lastStudyDate = today;
    }
    updates.streakDays = newStreak;

    // 4. Update Highest Streak
    const currentHighest = currentStats.highestStreak || 0;
    if (newStreak > currentHighest) {
        updates.highestStreak = newStreak;
    } else if (currentStats.highestStreak === undefined) {
        // Fallback for migration if not caught in getStats
        updates.highestStreak = Math.max(newStreak, currentStats.streakDays || 0);
    }

    // 5. Update Activity History
    const history = [...currentStats.activityHistory];
    const todayActivityIndex = history.findIndex(h => h.date === today);
    const minutesToAdd = durationSeconds > 0 ? durationSeconds / 60 : 0;
    
    if (todayActivityIndex >= 0) {
      history[todayActivityIndex] = {
        ...history[todayActivityIndex],
        xpEarned: history[todayActivityIndex].xpEarned + xpEarned,
        minutesSpent: history[todayActivityIndex].minutesSpent + minutesToAdd,
        actionCount: history[todayActivityIndex].actionCount + 1
      };
    } else {
      // Keep only last 365 days to avoid bloating localStorage
      if (history.length > 365) history.shift();
      
      history.push({
        date: today,
        xpEarned: xpEarned,
        minutesSpent: minutesToAdd,
        actionCount: 1
      });
    }
    updates.activityHistory = history;

    // Save
    const finalStats = { ...currentStats, ...updates };
    localStorage.setItem(`${STATS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(finalStats));
    return finalStats;
  },

  // Legacy support wrapper
  async addXp(userId: string, amount: number, actionMetadata?: Partial<UserStats>): Promise<UserStats> {
    // This is kept for backward compatibility if needed, but we should prefer recordActivity
    return this.recordActivity(userId, 'note_gen', amount, 0); 
  }
};
