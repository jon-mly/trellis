import { useEffect, type JSX } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import type { Topic, TopicSuggestion } from '../../types';
import { useTopicSummaryStore } from '../../stores/topicSummaryStore';
import { useI18n } from '../../i18n';
import { KnowledgeGraph } from './KnowledgeGraph';
import { TopicSuggestions } from './TopicSuggestions';
import './TopicDashboard.css';

interface TopicDashboardProps {
  topic: Topic;
  onSuggestionClick: (suggestion: TopicSuggestion) => void;
  onStartChat: () => void;
}

export function TopicDashboard({
  topic,
  onSuggestionClick,
  onStartChat,
}: TopicDashboardProps): JSX.Element {
  const t = useI18n();
  const { summaries, isGenerating, error, loadSummary } = useTopicSummaryStore();

  const summary = summaries[topic.id];

  useEffect(() => {
    void loadSummary(topic.id);
  }, [topic.id, loadSummary]);

  return (
    <div className="topic-dashboard">
      <header className="topic-dashboard-header">
        <div className="topic-dashboard-info">
          <h1 className="topic-dashboard-title">{topic.name}</h1>
          {topic.category && (
            <span className="topic-dashboard-category">{topic.category}</span>
          )}
        </div>
        <button
          type="button"
          className="topic-dashboard-start-btn"
          onClick={onStartChat}
        >
          <MessageSquarePlus size={16} strokeWidth={1.5} />
          <span>{t.topicDashboard.startChat}</span>
        </button>
      </header>

      {topic.summary && (
        <p className="topic-dashboard-summary">{topic.summary}</p>
      )}

      {error && (
        <div className="topic-dashboard-error">
          <p>{error}</p>
        </div>
      )}

      <div className="topic-dashboard-content">
        <KnowledgeGraph
          nodes={summary?.knowledgeGraph ?? []}
        />

        <TopicSuggestions
          suggestions={summary?.followUpSuggestions ?? []}
          onSuggestionClick={onSuggestionClick}
          isLoading={isGenerating}
        />
      </div>

      {summary?.generatedAt && (
        <div className="topic-dashboard-footer">
          <span className="topic-dashboard-updated">
            {t.topicDashboard.lastUpdated}: {summary.generatedAt.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
