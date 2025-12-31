import { db } from './db';
import type { Topic, Concept, Session, Message, Settings } from '../../types';

export interface ExportData {
  version: number;
  exportedAt: string;
  topics: Topic[];
  concepts: Concept[];
  sessions: Session[];
  messages: Message[];
  settings: Settings | null;
}

export async function exportAllData(): Promise<ExportData> {
  const [topics, concepts, sessions, messages, settingsArray] = await Promise.all([
    db.topics.toArray(),
    db.concepts.toArray(),
    db.sessions.toArray(),
    db.messages.toArray(),
    db.settings.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    topics,
    concepts,
    sessions,
    messages,
    settings: settingsArray[0] ?? null,
  };
}

export function downloadExport(data: ExportData): void {
  const json: string = JSON.stringify(data, null, 2);
  const blob: Blob = new Blob([json], { type: 'application/json' });
  const url: string = URL.createObjectURL(blob);

  const link: HTMLAnchorElement = document.createElement('a');
  link.href = url;
  link.download = `trellis-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importData(data: ExportData): Promise<void> {
  if (data.version !== 1) {
    throw new Error('Unsupported export version');
  }

  await db.transaction('rw', [db.topics, db.concepts, db.sessions, db.messages, db.settings], async () => {
    // Clear existing data
    await Promise.all([
      db.topics.clear(),
      db.concepts.clear(),
      db.sessions.clear(),
      db.messages.clear(),
      db.settings.clear(),
    ]);

    // Import new data
    if (data.topics.length > 0) {
      await db.topics.bulkAdd(data.topics);
    }
    if (data.concepts.length > 0) {
      await db.concepts.bulkAdd(data.concepts);
    }
    if (data.sessions.length > 0) {
      await db.sessions.bulkAdd(data.sessions);
    }
    if (data.messages.length > 0) {
      await db.messages.bulkAdd(data.messages);
    }
    if (data.settings) {
      await db.settings.add(data.settings);
    }
  });
}

export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader: FileReader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content: string = e.target?.result as string;
        const data: ExportData = JSON.parse(content) as ExportData;

        if (typeof data.version !== 'number' || !Array.isArray(data.topics)) {
          reject(new Error('Invalid export file format'));
          return;
        }

        resolve(data);
      } catch {
        reject(new Error('Failed to parse file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
