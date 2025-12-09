// types.ts - TypeScript interfaces for the Company Notes app

export interface Company {
  id: number;
  name: string;
  description: string;
  sector: string;
  employees: number;
  website: string;
}

export interface Note {
  id: string;
  companyId: number;
  content: string;
  createdAt: string; // ISO date string
  isPrivate?: boolean;
  userId?: string;
}

// For API requests
export interface CreateNoteInput {
  companyId: number;
  content: string;
  isPrivate?: boolean;
}

export interface UpdateNoteInput {
  content: string;
  isPrivate?: boolean;
}

// For AI Summary feature
export interface SummaryResponse {
  summary: string;
  companyId: number;
}
