import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { FlashCard } from '@shared/types';
interface AppState {
  cards: FlashCard[];
  addCard: (card: Omit<FlashCard, 'id' | 'stats' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (id: string, updates: Partial<Pick<FlashCard, 'correctMove' | 'note'>>) => void;
  deleteCard: (id: string) => void;
  recordAttempt: (id: string, correct: boolean) => void;
}
const SEED_CARDS: FlashCard[] = [
  {
    id: 'seed-1',
    userId: 'local-user',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    correctMove: 'Bb5',
    note: 'The Ruy Lopez: Developing the bishop and putting pressure on the knight defending e5.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stats: { timesReviewed: 0, timesCorrect: 0, timesWrong: 0 }
  },
  {
    id: 'seed-2',
    userId: 'local-user',
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
    correctMove: 'Nf3',
    note: 'Sicilian Defense: White prepares to challenge the center with d4.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stats: { timesReviewed: 0, timesCorrect: 0, timesWrong: 0 }
  }
];
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      cards: SEED_CARDS,
      addCard: (cardData) => set((state) => ({
        cards: [
          ...state.cards,
          {
            ...cardData,
            id: uuidv4(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            stats: { timesReviewed: 0, timesCorrect: 0, timesWrong: 0 }
          }
        ]
      })),
      updateCard: (id, updates) => set((state) => ({
        cards: state.cards.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        )
      })),
      deleteCard: (id) => set((state) => ({
        cards: state.cards.filter((c) => c.id !== id)
      })),
      recordAttempt: (id, correct) => set((state) => ({
        cards: state.cards.map((c) => {
          if (c.id !== id) return c;
          const stats = { ...c.stats };
          const now = Date.now();
          stats.timesReviewed += 1;
          if (correct) stats.timesCorrect += 1;
          else stats.timesWrong += 1;
          stats.lastReviewedAt = now;
          stats.lastResult = correct ? 'correct' : 'wrong';
          return { ...c, stats, updatedAt: now };
        })
      }))
    }),
    {
      name: 'blunderbank-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);