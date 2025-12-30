import Dexie, { type EntityTable } from 'dexie';
import type { Topic, Concept, Message, Session, Settings } from '../../types';

class AppDatabase extends Dexie {
  topics!: EntityTable<Topic, 'id'>;
  concepts!: EntityTable<Concept, 'id'>;
  messages!: EntityTable<Message, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('AppDB');

    this.version(1).stores({
      topics: 'id, name, category, lastExploredAt',
      concepts: 'id, name, topicId',
      messages: 'id, sessionId, timestamp',
      sessions: 'id, topicId, lastMessageAt',
      settings: 'id',
    });
  }
}

export const db = new AppDatabase();

export function generateId(): string {
  return crypto.randomUUID();
}
