import { ContentFeedback, FeedbackType, FeedbackReason, GeneralFeedback } from '../types';
import { loggingService } from './logging';

const FEEDBACK_STORAGE_KEY = 'learn_more_feedback_db';
const GENERAL_FEEDBACK_STORAGE_KEY = 'learn_more_general_feedback_db';

export const feedbackService = {
  // Helper to generate a stable ID for content that might not have a database ID (like specific questions)
  generateContentId(text: string): string {
    let hash = 0;
    if (text.length === 0) return 'empty';
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  },

  async saveFeedback(
    userId: string, 
    contentId: string, 
    contentType: 'note' | 'flashcard' | 'question',
    type: FeedbackType,
    contextSnippet?: string,
    reason?: FeedbackReason,
    comment?: string
  ): Promise<ContentFeedback> {
    // Simulate slight network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const allFeedback: ContentFeedback[] = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
    
    // Remove existing feedback from this user for this content (toggle/update behavior)
    const filteredFeedback = allFeedback.filter(f => !(f.userId === userId && f.contentId === contentId));

    const newFeedback: ContentFeedback = {
      id: crypto.randomUUID(),
      userId,
      contentId,
      contentType,
      type,
      reason,
      comment,
      contextSnippet: contextSnippet ? contextSnippet.substring(0, 50) : undefined,
      timestamp: Date.now()
    };

    filteredFeedback.push(newFeedback);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(filteredFeedback));
    
    return newFeedback;
  },

  getFeedback(userId: string, contentId: string): ContentFeedback | null {
    const allFeedback: ContentFeedback[] = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
    return allFeedback.find(f => f.userId === userId && f.contentId === contentId) || null;
  },

  async saveGeneralFeedback(
    userId: string,
    message: string,
    rating?: number
  ): Promise<GeneralFeedback> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const allFeedback: GeneralFeedback[] = JSON.parse(localStorage.getItem(GENERAL_FEEDBACK_STORAGE_KEY) || '[]');

    // Detect metadata
    const isDark = document.documentElement.classList.contains('dark');
    const width = window.innerWidth;
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    if (width < 768) deviceType = 'mobile';
    else if (width < 1024) deviceType = 'tablet';

    const newFeedback: GeneralFeedback = {
      id: crypto.randomUUID(),
      userId,
      message,
      rating,
      timestamp: Date.now(),
      metadata: {
        appVersion: '1.1',
        isBeta: true,
        deviceType,
        theme: isDark ? 'dark' : 'light',
        route: window.location.pathname // Rudimentary routing check
      }
    };

    allFeedback.push(newFeedback);
    localStorage.setItem(GENERAL_FEEDBACK_STORAGE_KEY, JSON.stringify(allFeedback));
    
    loggingService.log('feedback_submitted', userId, { hasRating: !!rating, rating });

    return newFeedback;
  }
};