import { Document } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { loggingService } from './logging';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

const DOCUMENTS_STORAGE_KEY = 'learn_more_documents_db';

export const documentService = {
  async list(userId: string): Promise<Document[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const allDocs: Document[] = JSON.parse(localStorage.getItem(DOCUMENTS_STORAGE_KEY) || '[]');
      // Filter by user ownership and sort by newest first
      return allDocs
        .filter(doc => doc.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error("Failed to list documents", e);
      return [];
    }
  },

  async extractText(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    let text = '';

    try {
      if (extension === 'txt') {
        text = await file.text();
      } else if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const maxPages = pdf.numPages;
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n\n';
        }
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file format. Please upload .txt, .pdf, or .docx.');
      }
    } catch (e) {
      console.error("Extraction error:", e);
      if (e instanceof Error && e.message.startsWith('Unsupported')) {
        throw e;
      }
      throw new Error("Failed to read file content.");
    }

    const cleanText = text.trim();
    if (!cleanText || cleanText.length === 0) {
      throw new Error("This file can’t be read yet. Please upload a text-based PDF or document.");
    }

    return cleanText;
  },

  async upload(userId: string, file: File, setId?: string): Promise<Document> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'pdf', 'docx'].includes(extension || '')) {
      throw new Error('Invalid file type. Only .txt, .pdf, and .docx files are allowed.');
    }
    const text = await this.extractText(file);
    
    const doc = await this.create(userId, file.name, "File Upload", text, extension as any, setId);

    // Log the successful upload
    loggingService.log('file_uploaded', userId, {
        documentId: doc.id,
        fileType: extension,
        setId: setId || null
    });

    return doc;
  },

  async create(userId: string, title: string, originalFilename: string, contentText: string, sourceType: "txt" | "pdf" | "docx", setId?: string): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const allDocs: Document[] = JSON.parse(localStorage.getItem(DOCUMENTS_STORAGE_KEY) || '[]');
    
    const newDoc: Document = {
      id: crypto.randomUUID(),
      userId,
      setId,
      title,
      originalFilename,
      contentText,
      sourceType,
      createdAt: Date.now()
    };

    allDocs.push(newDoc);
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(allDocs));
    return newDoc;
  },

  async rename(userId: string, docId: string, newTitle: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allDocs: Document[] = JSON.parse(localStorage.getItem(DOCUMENTS_STORAGE_KEY) || '[]');
    const index = allDocs.findIndex(d => d.id === docId && d.userId === userId);
    
    if (index !== -1) {
        allDocs[index].title = newTitle;
        localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(allDocs));
    }
  },

  async delete(userId: string, docId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allDocs: Document[] = JSON.parse(localStorage.getItem(DOCUMENTS_STORAGE_KEY) || '[]');
    const filtered = allDocs.filter(d => !(d.id === docId && d.userId === userId));
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(filtered));
  }
};