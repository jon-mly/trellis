import type { JSX } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Layers, GitBranch, Lightbulb, Wrench } from 'lucide-react';
import type { TopicSuggestion } from '../../types';
import { useI18n } from '../../i18n';
import './TopicSuggestions.css';

interface TopicSuggestionsProps {
  suggestions: TopicSuggestion[];
  onSuggestionClick: (suggestion: TopicSuggestion) => void;
  isLoading: boolean;
}

const SUGGESTION_ICONS: Record<TopicSuggestion['type'], LucideIcon> = {
  deepen: Layers,
  connect: GitBranch,
  challenge: Lightbulb,
  apply: Wrench,
};

function SkeletonCard(): JSX.Element {
  return (
    <div className="topic-suggestion topic-suggestion--skeleton">
      <div className="topic-suggestion-icon skeleton-pulse" />
      <div className="topic-suggestion-content">
        <div className="skeleton-title skeleton-pulse" />
        <div className="skeleton-desc skeleton-pulse" />
      </div>
    </div>
  );
}

export function TopicSuggestions({
  suggestions,
  onSuggestionClick,
  isLoading,
}: TopicSuggestionsProps): JSX.Element {
  const t = useI18n();

  if (isLoading && suggestions.length === 0) {
    return (
      <div className="topic-suggestions">
        <div className="topic-suggestions-header">
          <span className="topic-suggestions-label">{t.topicDashboard.suggestions}</span>
        </div>
        <div className="topic-suggestions-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="topic-suggestions topic-suggestions--empty">
        <p className="topic-suggestions-empty-text">{t.topicDashboard.suggestionsEmpty}</p>
      </div>
    );
  }

  return (
    <div className="topic-suggestions">
      <div className="topic-suggestions-header">
        <span className="topic-suggestions-label">{t.topicDashboard.suggestions}</span>
      </div>
      <div className={`topic-suggestions-grid ${isLoading ? 'topic-suggestions-grid--refreshing' : ''}`}>
        {suggestions.map((suggestion) => {
          const Icon = SUGGESTION_ICONS[suggestion.type];
          return (
            <button
              key={suggestion.id}
              className={`topic-suggestion topic-suggestion--${suggestion.type}`}
              onClick={() => onSuggestionClick(suggestion)}
            >
              <div className="topic-suggestion-icon">
                <Icon size={16} strokeWidth={1.5} />
              </div>
              <div className="topic-suggestion-content">
                <span className="topic-suggestion-type">
                  {t.topicDashboard.suggestionTypes[suggestion.type]}
                </span>
                <h3 className="topic-suggestion-title">{suggestion.title}</h3>
                <p className="topic-suggestion-desc">{suggestion.description}</p>
              </div>
              <ArrowRight size={14} strokeWidth={1.5} className="topic-suggestion-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
