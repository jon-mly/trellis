import { useEffect, useState, type ReactElement } from 'react';
import type { Topic, TopicSuggestion } from '../../types';
import type { ChatOptions } from '../../services/claude/cli-provider';
import { useSessionStore } from '../../stores/sessionStore';
import { TopicSidebar } from './TopicSidebar';
import { ChatPane } from './ChatPane';
import { TopicDashboard } from './TopicDashboard';
import './TopicView.css';

interface TopicViewProps {
  topic: Topic;
  onSendMessage: (content: string, options?: ChatOptions) => void;
  onDeleteTopic: () => void | Promise<void>;
}

export function TopicView({ topic, onSendMessage, onDeleteTopic }: TopicViewProps): ReactElement {
  const [activeView, setActiveView] = useState<'dashboard' | 'chat'>('dashboard');

  const {
    currentSession,
    messages,
    sessionsForTopic,
    sessionsLoaded,
    isLoading,
    streamingContent,
    isGeneratingDemo,
    loadSessionsForTopic,
    loadSessionMessages,
    startSession,
    deleteSession,
    requestDemo,
    clearCurrentSession,
  } = useSessionStore();

  // Load sessions for this topic on mount or topic change
  useEffect((): void => {
    void loadSessionsForTopic(topic.id);
  }, [topic.id, loadSessionsForTopic]);

  // Reset to dashboard view when topic changes, unless there's an active session for this topic
  useEffect((): void => {
    // If there's already an active session for this topic (e.g., from dashboard card click),
    // show chat view instead of resetting to dashboard
    if (currentSession?.topicId === topic.id) {
      setActiveView('chat');
    } else {
      setActiveView('dashboard');
      clearCurrentSession();
    }
  }, [topic.id, currentSession?.topicId, clearCurrentSession]);

  const handleSessionSelect = (sessionId: string): void => {
    void loadSessionMessages(sessionId);
    setActiveView('chat');
  };

  const handleNewSession = (): void => {
    startSession(topic.id);
    setActiveView('chat');
  };

  const handleDeleteSession = (sessionId: string): void => {
    void deleteSession(sessionId);
    // If we deleted the current session, go back to dashboard
    if (currentSession?.id === sessionId) {
      setActiveView('dashboard');
    }
  };

  const handleSendMessage = (content: string): void => {
    onSendMessage(content);
  };

  const handleShowDashboard = (): void => {
    setActiveView('dashboard');
  };

  const handleSuggestionClick = (suggestion: TopicSuggestion): void => {
    // Start new session and send the suggested prompt
    startSession(topic.id);
    setActiveView('chat');
    // Use setTimeout to ensure the session is created before sending
    setTimeout(() => {
      onSendMessage(suggestion.suggestedPrompt);
    }, 0);
  };

  const selectedSessionId: string | null = activeView === 'chat' ? (currentSession?.id ?? null) : null;

  return (
    <div className="topic-view">
      <TopicSidebar
        sessions={sessionsForTopic}
        selectedSessionId={selectedSessionId}
        showingDashboard={activeView === 'dashboard'}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onDeleteTopic={onDeleteTopic}
        onShowDashboard={handleShowDashboard}
      />
      <div className="topic-view-main">
        {activeView === 'dashboard' ? (
          <TopicDashboard
            topic={topic}
            onSuggestionClick={handleSuggestionClick}
            onStartChat={handleNewSession}
          />
        ) : (
          <>
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
              onRequestDemo={requestDemo}
              isGeneratingDemo={isGeneratingDemo}
            />
          </>
        )}
      </div>
    </div>
  );
}
