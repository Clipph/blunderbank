export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  username: string;
  passwordHash?: string;
}
export interface AuthResponse {
  user: User;
  token: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}
export interface FlashCardStats {
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
  lastReviewedAt?: number;
  lastResult?: 'correct' | 'wrong';
}
export interface FlashCard {
  id: string;
  userId: string;
  fen: string;
  correctMove: string; // SAN notation
  note: string;
  stats: FlashCardStats;
  createdAt: number;
  updatedAt: number;
}