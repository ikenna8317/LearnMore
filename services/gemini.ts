import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { DocumentOverview, QuizQuestion, Flashcard } from "../types";
import { loggingService } from "./logging";

// Initialize Gemini
// NOTE: In a production environment, never expose keys on the client.
// This is acceptable here per the instructions to use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GENERATION_TIMEOUT_MS = 90000; // 90 seconds timeout

const overviewSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise executive summary of the document." },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 crucial key takeaways from the text."
    }
  },
  required: ["summary", "keyPoints"]
};

// Schema specifically for a list of quiz questions
const quizSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "4 distinct options." 
      },
      correctIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)." },
      explanation: { type: Type.STRING, description: "Why this answer is correct." }
    },
    required: ["question", "options", "correctIndex", "explanation"]
  }
};

// Schema for flashcards list
const flashcardsSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: { type: Type.STRING, description: "Concept, term, or question." },
      back: { type: Type.STRING, description: "Definition, explanation, or answer." }
    },
    required: ["front", "back"]
  }
};

// Helper: Timeout wrapper
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Helper: Retry logic for transient API errors
async function callAIWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // Check for transient errors: 500s, or generic fetch/network errors
    const isRetryable = 
      error?.status >= 500 || 
      error?.message?.toLowerCase().includes('fetch') || 
      error?.message?.toLowerCase().includes('xhr') ||
      error?.message?.toLowerCase().includes('network') ||
      error?.message?.includes('RPC failed');

    if (!isRetryable) throw error;

    console.warn(`Gemini API Error (Retryable). Retrying in ${delay}ms...`, error.message);
    await new Promise(resolve => setTimeout(resolve, delay));
    return callAIWithRetry(operation, retries - 1, delay * 2);
  }
}

export const generateDocumentOverview = async (text: string, userId?: string): Promise<DocumentOverview> => {
  const model = "gemini-3-flash-preview";
  loggingService.log('generation_started', userId, { type: 'overview', charCount: text.length });
  const startTime = Date.now();
  
  const prompt = `
    Analyze the following text and provide a high-level overview.
    1. A concise summary (Markdown supported).
    2. A list of key takeaways/points.
    
    Text content:
    "${text.substring(0, 20000)}" 
  `;

  try {
    const response = await withTimeout(
      callAIWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: overviewSchema,
          systemInstruction: "You are an expert analyst. Summarize clearly."
        }
      })),
      GENERATION_TIMEOUT_MS
    );

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const data = JSON.parse(jsonText) as DocumentOverview;
    loggingService.log('generation_succeeded', userId, { type: 'overview', duration: Date.now() - startTime });
    return data;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const reason = err.message === 'TIMEOUT' ? 'timeout' : 'error';
    
    loggingService.log('generation_failed', userId, { type: 'overview', reason, error: err.message });
    console.error("Gemini Overview Generation Error:", error);
    throw err;
  }
};

export const generateStudyNotes = async (text: string, userId?: string): Promise<string> => {
  loggingService.log('generation_started', userId, { type: 'notes', charCount: text.length });
  const startTime = Date.now();

  // Explicit check for API Key availability
  if (!process.env.API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("API Key missing. Returning placeholder note (Development Mode).");
      return `# Development Mode: Placeholder Note\n\n**Warning:** No API Key detected.`;
    }
    const err = "AI Configuration Error: API Key is missing.";
    loggingService.log('generation_failed', userId, { type: 'notes', error: err });
    throw new Error(err);
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are an expert academic tutor. 
    Analyze the following document text and create a comprehensive, well-structured set of study notes.
    
    Structure Requirements:
    - Use Markdown formatting (headers, bold, lists).
    - Start with a high-level summary.
    - Break down complex concepts into bullet points.
    - Highlight key definitions.
    - End with a "Key Takeaways" section.
    
    Text content:
    "${text.substring(0, 25000)}"
  `;

  try {
    const response = await withTimeout(
      callAIWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: "You are a precise and organized study assistant. Output clean Markdown.",
        }
      })),
      GENERATION_TIMEOUT_MS
    );

    const generatedText = response.text;
    
    if (!generatedText || !generatedText.trim()) {
      throw new Error("AI returned empty output.");
    }

    loggingService.log('generation_succeeded', userId, { type: 'notes', duration: Date.now() - startTime });
    return generatedText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const reason = err.message === 'TIMEOUT' ? 'timeout' : 'error';

    loggingService.log('generation_failed', userId, { type: 'notes', reason, error: err.message });
    console.error("Gemini Note Generation Error:", error);
    throw err;
  }
};

export const generateQuizFromNote = async (noteText: string, userId?: string): Promise<QuizQuestion[]> => {
  loggingService.log('generation_started', userId, { type: 'quiz', charCount: noteText.length });
  const startTime = Date.now();

  if (!process.env.API_KEY) {
    throw new Error("AI Configuration Error: API Key is missing.");
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate 5 challenging multiple-choice questions based on the following study notes.
    Ensure the questions test understanding, not just recall.
    Provide clear explanations for the correct answers.
    
    Study Notes:
    "${noteText.substring(0, 20000)}"
  `;

  try {
    const response = await withTimeout(
      callAIWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
          systemInstruction: "You are a strict exam creator. Output only valid JSON."
        }
      })),
      GENERATION_TIMEOUT_MS
    );

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI returned empty output.");

    const questions = JSON.parse(jsonText) as QuizQuestion[];
    loggingService.log('generation_succeeded', userId, { type: 'quiz', duration: Date.now() - startTime });
    return questions;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const reason = err.message === 'TIMEOUT' ? 'timeout' : 'error';

    loggingService.log('generation_failed', userId, { type: 'quiz', reason, error: err.message });
    console.error("Gemini Quiz Generation Error:", error);
    throw err;
  }
};

export const generateTestFromNote = async (noteText: string, userId?: string): Promise<QuizQuestion[]> => {
  loggingService.log('generation_started', userId, { type: 'test', charCount: noteText.length });
  const startTime = Date.now();

  if (!process.env.API_KEY) {
    throw new Error("AI Configuration Error: API Key is missing.");
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate 15 challenging multiple-choice questions based on the following study notes.
    This is for a formal test, so ensure high coverage of the material.
    Provide clear explanations for the correct answers.
    
    Study Notes:
    "${noteText.substring(0, 20000)}"
  `;

  try {
    const response = await withTimeout(
      callAIWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
          systemInstruction: "You are a strict professor creating a midterm exam. Output only valid JSON."
        }
      })),
      GENERATION_TIMEOUT_MS
    );

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI returned empty output.");

    const questions = JSON.parse(jsonText) as QuizQuestion[];
    loggingService.log('generation_succeeded', userId, { type: 'test', duration: Date.now() - startTime });
    return questions;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const reason = err.message === 'TIMEOUT' ? 'timeout' : 'error';

    loggingService.log('generation_failed', userId, { type: 'test', reason, error: err.message });
    console.error("Gemini Test Generation Error:", error);
    throw err;
  }
};

export const generateExamFromNote = async (noteText: string, userId?: string): Promise<QuizQuestion[]> => {
  loggingService.log('generation_started', userId, { type: 'exam', charCount: noteText.length });
  const startTime = Date.now();

  if (!process.env.API_KEY) {
    throw new Error("AI Configuration Error: API Key is missing.");
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate 20 comprehensive multiple-choice questions based on the following study notes.
    This is a Final Exam simulation.
    Questions should range from easy to hard.
    Provide clear explanations for the correct answers.
    
    Study Notes:
    "${noteText.substring(0, 20000)}"
  `;

  try {
    const response = await withTimeout(
      callAIWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
          systemInstruction: "You are a rigorous academic examiner. Output only valid JSON."
        }
      })),
      GENERATION_TIMEOUT_MS
    );

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI returned empty output.");

    const questions = JSON.parse(jsonText) as QuizQuestion[];
    loggingService.log('generation_succeeded', userId, { type: 'exam', duration: Date.now() - startTime });
    return questions;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const reason = err.message === 'TIMEOUT' ? 'timeout' : 'error';

    loggingService.log('generation_failed', userId, { type: 'exam', reason, error: err.message });
    console.error("Gemini Exam Generation Error:", error);
    throw err;
  }
};

export const generateFlashcardsFromNote = async (noteText: string, userId?: string): Promise<Flashcard[]> => {
  loggingService.log('generation_started', userId, { type: 'flashcards', charCount: noteText.length });
  const startTime = Date.now();

  if (!process.env.API_KEY) {
    throw new Error("AI Configuration Error: API Key is missing.");
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Create 12 high-quality flashcards based on the key concepts in these study notes.
    
    Requirements:
    - Front: A term, concept, or question.
    - Back: A concise definition, explanation, or answer.
    - Focus on memory retention and key takeaways.
    
    Study Notes:
    "${noteText.substring(0, 20000)}"
  `;

  try {
    const response = await withTimeout(
      callAIWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: flashcardsSchema,
          systemInstruction: "You are an expert study aid creator. Output only valid JSON."
        }
      })),
      GENERATION_TIMEOUT_MS
    );

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI returned empty output.");

    const cards = JSON.parse(jsonText) as Flashcard[];
    loggingService.log('generation_succeeded', userId, { type: 'flashcards', duration: Date.now() - startTime });
    return cards;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const reason = err.message === 'TIMEOUT' ? 'timeout' : 'error';

    loggingService.log('generation_failed', userId, { type: 'flashcards', reason, error: err.message });
    console.error("Gemini Flashcard Generation Error:", error);
    throw err;
  }
};