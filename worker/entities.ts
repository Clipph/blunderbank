import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, FlashCard } from "@shared/types";
import { MOCK_CHATS, MOCK_USERS } from "@shared/mock-data";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export class FlashCardEntity extends IndexedEntity<FlashCard> {
  static readonly entityName = "flashcard";
  static readonly indexName = "flashcards";
  static readonly initialState: FlashCard = {
    id: "",
    userId: "",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    correctMove: "",
    note: "",
    stats: {
      timesReviewed: 0,
      timesCorrect: 0,
      timesWrong: 0,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = MOCK_CHATS.map(c => ({ ...c, messages: [] }));
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}