import { useEffect, type ReactElement } from 'react';
import type { Topic, Session, Message } from '../../types';
import type { ChatOptions } from '../../services/claude/cli-provider';
import { useSessionStore } from '../../stores/sessionStore';
import { TopicSidebar } from './TopicSidebar';
import { ChatPane } from './ChatPane';
import './TopicView.css';

interface TopicViewProps {
  topic: Topic;
  onSendMessage: (content: string, options?: ChatOptions) => void;
  onDeleteTopic: () => void | Promise<void>;
}

export function TopicView({ topic, onSendMessage, onDeleteTopic }: TopicViewProps): ReactElement {
  const {
    currentSession,
    messages,
    sessionsForTopic,
    sessionsLoaded,
    isLoading,
    streamingContent,
    loadSessionsForTopic,
    loadSessionMessages,
    startSession,
    deleteSession,
  } = useSessionStore();

  // Load sessions for this topic on mount or topic change
  useEffect((): void => {
    void loadSessionsForTopic(topic.id);
  }, [topic.id, loadSessionsForTopic]);

  // Auto-select the most recent session if none selected, or start a draft session if no sessions exist
  useEffect((): void => {
    // Wait until sessions have been loaded before deciding what to do
    if (!sessionsLoaded) {
      return;
    }

    if (!currentSession && sessionsForTopic.length > 0) {
      // Load the most recent session
      const mostRecentSession: Session = sessionsForTopic[0];
      void loadSessionMessages(mostRecentSession.id);
    } else if (!currentSession && sessionsForTopic.length === 0) {
      // No sessions exist, start a draft session (will be saved on first message)
      startSession(topic.id);
    }
  }, [currentSession, sessionsForTopic, sessionsLoaded, topic.id, loadSessionMessages, startSession]);

  const handleSessionSelect = (sessionId: string): void => {
    void loadSessionMessages(sessionId);
  };

  const handleNewSession = (): void => {
    void startSession(topic.id);
  };

  const handleDeleteSession = (sessionId: string): void => {
    void deleteSession(sessionId);
  };

  const handleSendMessage = (content: string): void => {
    onSendMessage(content);
  };

  const selectedSessionId: string | null = currentSession?.id ?? null;

  return (
    <div className="topic-view">
      <TopicSidebar
        topic={topic}
        sessions={sessionsForTopic}
        selectedSessionId={selectedSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onDeleteTopic={onDeleteTopic}
      />
      <div className="topic-view-main">
        <div className="topic-view-header">
          <h2 className="topic-view-title">{topic.name}</h2>
          {topic.category && (
            <span className="topic-view-category">{topic.category}</span>
          )}
        </div>
        <ChatPane
          messages={messages}
          isLoading={isLoading}
          streamingContent={streamingContent}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
