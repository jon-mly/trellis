import { create } from 'zustand';
import type { Concept, Topic, Message } from '../types';
import { db, generateId } from '../services/storage/db';
import {
  extractKnowledge,
  createTopicFromExtraction,
  createConceptsFromExtraction,
  linkRelatedConcepts,
  type ExtractedKnowledge,
} from '../services/claude/concept-extraction';

interface KnowledgeState {
  topics: Topic[];
  concepts: Concept[];
  isExtracting: boolean;
  lastExtraction: ExtractedKnowledge | null;

  loadKnowledge: () => Promise<void>;
  extractAndSaveKnowledge: (messages: Message[], sessionId: string) => Promise<Topic | null>;
  updateTopicFromSession: (topicId: string, sessionId: string, messages: Message[]) => Promise<void>;
  getTopicWithConcepts: (topicId: string) => Promise<{ topic: Topic; concepts: Concept[] } | null>;
  getRelatedTopics: (topicId: string) => Promise<Topic[]>;
  getKnowledgeContext: () => Promise<string>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  topics: [],
  concepts: [],
  isExtracting: false,
  lastExtraction: null,

  loadKnowledge: async (): Promise<void> => {
    const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().toArray();
    const concepts: Concept[] = await db.concepts.toArray();
    set({ topics, concepts });
  },

  extractAndSaveKnowledge: async (
    messages: Message[],
    sessionId: string
  ): Promise<Topic | null> => {
    set({ isExtracting: true });

    try {
      const extraction: ExtractedKnowledge | null = await extractKnowledge(messages);
      if (!extraction) {
        set({ isExtracting: false });
        return null;
      }

      set({ lastExtraction: extraction });

      // Check if we already have a topic with this name
      const existingTopic: Topic | undefined = await db.topics
        .where('name')
        .equalsIgnoreCase(extraction.topicName)
        .first();

      if (existingTopic) {
        // Update existing topic
        const updatedSessionIds: string[] = existingTopic.sessionIds.includes(sessionId)
          ? existingTopic.sessionIds
          : [...existingTopic.sessionIds, sessionId];

        await db.topics.update(existingTopic.id, {
          lastExploredAt: new Date(),
          sessionIds: updatedSessionIds,
          summary: extraction.topicSummary,
        });

        // Add new concepts
        let newConcepts: Concept[] = createConceptsFromExtraction(
          extraction,
          existingTopic.id,
          sessionId
        );
        newConcepts = linkRelatedConcepts(newConcepts, extraction);

        // Filter out concepts we already have
        const existingConceptNames: Set<string> = new Set(
          (await db.concepts.where('topicId').equals(existingTopic.id).toArray())
            .map((c: Concept): string => c.name.toLowerCase())
        );

        const uniqueNewConcepts: Concept[] = newConcepts.filter(
          (c: Concept): boolean => !existingConceptNames.has(c.name.toLowerCase())
        );

        if (uniqueNewConcepts.length > 0) {
          await db.concepts.bulkAdd(uniqueNewConcepts);
          const newConceptIds: string[] = uniqueNewConcepts.map((c: Concept): string => c.id);
          await db.topics.update(existingTopic.id, {
            conceptIds: [...existingTopic.conceptIds, ...newConceptIds],
          });
        }

        await db.sessions.update(sessionId, { topicId: existingTopic.id });

        const updatedTopic: Topic | undefined = await db.topics.get(existingTopic.id);
        await get().loadKnowledge();
        set({ isExtracting: false });
        return updatedTopic ?? null;
      }

      // Create new topic
      const topic: Topic = createTopicFromExtraction(extraction, sessionId);
      let concepts: Concept[] = createConceptsFromExtraction(extraction, topic.id, sessionId);
      concepts = linkRelatedConcepts(concepts, extraction);

      topic.conceptIds = concepts.map((c: Concept): string => c.id);

      await db.topics.add(topic);
      await db.concepts.bulkAdd(concepts);
      await db.sessions.update(sessionId, { topicId: topic.id });

      await get().loadKnowledge();
      set({ isExtracting: false });
      return topic;
    } catch {
      set({ isExtracting: false });
      return null;
    }
  },

  updateTopicFromSession: async (
    topicId: string,
    sessionId: string,
    messages: Message[]
  ): Promise<void> => {
    set({ isExtracting: true });

    try {
      const extraction: ExtractedKnowledge | null = await extractKnowledge(messages);
      if (!extraction) {
        set({ isExtracting: false });
        return;
      }

      const topic: Topic | undefined = await db.topics.get(topicId);
      if (!topic) {
        set({ isExtracting: false });
        return;
      }

      // Update topic
      const updatedSessionIds: string[] = topic.sessionIds.includes(sessionId)
        ? topic.sessionIds
        : [...topic.sessionIds, sessionId];

      await db.topics.update(topicId, {
        lastExploredAt: new Date(),
        sessionIds: updatedSessionIds,
        summary: extraction.topicSummary,
      });

      // Add new concepts
      let newConcepts: Concept[] = createConceptsFromExtraction(extraction, topicId, sessionId);
      newConcepts = linkRelatedConcepts(newConcepts, extraction);

      const existingConceptNames: Set<string> = new Set(
        (await db.concepts.where('topicId').equals(topicId).toArray())
          .map((c: Concept): string => c.name.toLowerCase())
      );

      const uniqueNewConcepts: Concept[] = newConcepts.filter(
        (c: Concept): boolean => !existingConceptNames.has(c.name.toLowerCase())
      );

      if (uniqueNewConcepts.length > 0) {
        await db.concepts.bulkAdd(uniqueNewConcepts);
        const newConceptIds: string[] = uniqueNewConcepts.map((c: Concept): string => c.id);
        await db.topics.update(topicId, {
          conceptIds: [...topic.conceptIds, ...newConceptIds],
        });
      }

      await get().loadKnowledge();
      set({ isExtracting: false });
    } catch {
      set({ isExtracting: false });
    }
  },

  getTopicWithConcepts: async (
    topicId: string
  ): Promise<{ topic: Topic; concepts: Concept[] } | null> => {
    const topic: Topic | undefined = await db.topics.get(topicId);
    if (!topic) return null;

    const concepts: Concept[] = await db.concepts.where('topicId').equals(topicId).toArray();
    return { topic, concepts };
  },

  getRelatedTopics: async (topicId: string): Promise<Topic[]> => {
    const topicData = await get().getTopicWithConcepts(topicId);
    if (!topicData) return [];

    const { concepts } = topicData;
    const relatedConceptIds: string[] = concepts.flatMap(
      (c: Concept): string[] => c.relatedConceptIds
    );

    if (relatedConceptIds.length === 0) return [];

    const relatedConcepts: Concept[] = await db.concepts
      .where('id')
      .anyOf(relatedConceptIds)
      .toArray();

    const relatedTopicIds: Set<string> = new Set(
      relatedConcepts
        .map((c: Concept): string => c.topicId)
        .filter((id: string): boolean => id !== topicId)
    );

    if (relatedTopicIds.size === 0) return [];

    return db.topics.where('id').anyOf([...relatedTopicIds]).toArray();
  },

  getKnowledgeContext: async (): Promise<string> => {
    const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().limit(10).toArray();

    if (topics.length === 0) {
      return '';
    }

    const topicSummaries: string[] = await Promise.all(
      topics.map(async (topic: Topic): Promise<string> => {
        const concepts: Concept[] = await db.concepts
          .where('topicId')
          .equals(topic.id)
          .toArray();

        const conceptList: string = concepts
          .map((c: Concept): string => `${c.name} (${c.familiarityLevel})`)
          .join(', ');

        return `- ${topic.name}${topic.category ? ` [${topic.category}]` : ''}: ${topic.summary ?? 'No summary'}\n  Concepts: ${conceptList || 'None extracted'}`;
      })
    );

    return `The student has previously explored:\n${topicSummaries.join('\n')}`;
  },
}));
