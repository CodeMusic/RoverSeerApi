export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  imageData?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
}

export interface ChatSession {
  id: string;
  name?: string;
  messages: Message[];
  createdAt: number;
  lastUpdated: number;
  favorite?: boolean;
}