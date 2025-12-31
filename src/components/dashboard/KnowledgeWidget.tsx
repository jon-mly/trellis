import type { JSX } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { Topic, Concept } from '../../types';
import { useI18n } from '../../i18n';
import './KnowledgeWidget.css';

interface KnowledgeWidgetProps {
  topics: Topic[];
  concepts: Concept[];
  onTopicClick?: (topicId: string) => void;
}

const FAMILIARITY_COLORS: Record<Concept['familiarityLevel'], string> = {
  introduced: 'var(--color-fg-muted)',
  explored: 'var(--color-accent)',
  understood: 'var(--color-fg)',
};

export function KnowledgeWidget({ topics, concepts, onTopicClick }: KnowledgeWidgetProps): JSX.Element {
  const t = useI18n();

  if (topics.length === 0) {
    return (
      <div className="knowledge-widget knowledge-widget--empty">
        <BookOpen size={24} strokeWidth={1.5} className="knowledge-widget-empty-icon" />
        <p>{t.knowledge.empty}</p>
      </div>
    );
  }

  const topicsWithConcepts = topics.slice(0, 5).map((topic: Topic) => ({
    ...topic,
    concepts: concepts.filter((c: Concept): boolean => c.topicId === topic.id),
  }));

  const totalConcepts: number = concepts.length;
  const understoodCount: number = concepts.filter(
    (c: Concept): boolean => c.familiarityLevel === 'understood'
  ).length;
  const exploredCount: number = concepts.filter(
    (c: Concept): boolean => c.familiarityLevel === 'explored'
  ).length;
  const introducedCount: number = totalConcepts - understoodCount - exploredCount;

  return (
    <div className="knowledge-widget">
      <div className="knowledge-widget-header">
        <span className="knowledge-widget-label">{t.knowledge.title}</span>
        <span className="knowledge-widget-stats">
          {topics.length} {t.knowledge.stats.topics} · {totalConcepts} {t.knowledge.stats.concepts}
        </span>
      </div>

      {totalConcepts > 0 && (
        <div className="knowledge-progress">
          <div className="knowledge-progress-bar">
            <div
              className="knowledge-progress-segment knowledge-progress-segment--understood"
              style={{ width: `${(understoodCount / totalConcepts) * 100}%` }}
            />
            <div
              className="knowledge-progress-segment knowledge-progress-segment--explored"
              style={{ width: `${(exploredCount / totalConcepts) * 100}%` }}
            />
          </div>
          <div className="knowledge-progress-legend">
            <span className="knowledge-legend-item">
              <span className="knowledge-legend-dot knowledge-legend-dot--understood" />
              {t.knowledge.familiarity.understood} ({understoodCount})
            </span>
            <span className="knowledge-legend-item">
              <span className="knowledge-legend-dot knowledge-legend-dot--explored" />
              {t.knowledge.familiarity.explored} ({exploredCount})
            </span>
            <span className="knowledge-legend-item">
              <span className="knowledge-legend-dot knowledge-legend-dot--introduced" />
              {t.knowledge.familiarity.introduced} ({introducedCount})
            </span>
          </div>
        </div>
      )}

      <div className="knowledge-topics">
        {topicsWithConcepts.map((topic) => (
          <button
            key={topic.id}
            className="knowledge-topic"
            onClick={() => onTopicClick?.(topic.id)}
            type="button"
          >
            <div className="knowledge-topic-info">
              <span className="knowledge-topic-name">{topic.name}</span>
              {topic.category && (
                <span className="knowledge-topic-category">{topic.category}</span>
              )}
            </div>
            <div className="knowledge-topic-concepts">
              {topic.concepts.slice(0, 4).map((concept: Concept) => (
                <span
                  key={concept.id}
                  className="knowledge-concept-dot"
                  style={{ backgroundColor: FAMILIARITY_COLORS[concept.familiarityLevel] }}
                  title={`${concept.name} (${concept.familiarityLevel})`}
                />
              ))}
              {topic.concepts.length > 4 && (
                <span className="knowledge-concept-more">+{topic.concepts.length - 4}</span>
              )}
            </div>
            <ChevronRight size={14} strokeWidth={1.5} className="knowledge-topic-arrow" />
          </button>
        ))}
      </div>

      {topics.length > 5 && (
        <div className="knowledge-widget-footer">
          <span className="knowledge-widget-more">+{topics.length - 5} {t.knowledge.moreTopics}</span>
        </div>
      )}
    </div>
  );
}
