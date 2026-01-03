import type { JSX } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, RefreshCw, CornerDownRight, Compass, Link2, Sparkles } from 'lucide-react';
import type { DashboardCard, Topic, Concept } from '../../types';
import { useI18n } from '../../i18n';
import { KnowledgeWidget } from './KnowledgeWidget';
import { DataManagement } from '../settings';
import './Dashboard.css';

interface DashboardProps {
  cards: DashboardCard[];
  isLoading: boolean;
  onCardClick: (card: DashboardCard) => void;
  onQuickStart: (prompt: string) => void;
  onRefresh?: () => void;
  topics?: Topic[];
  concepts?: Concept[];
  onTopicClick?: (topicId: string) => void;
  onDataImport?: () => void;
}

const CARD_ICONS: Record<DashboardCard['type'], LucideIcon> = {
  resume: CornerDownRight,
  explore: Compass,
  related: Link2,
  wildcard: Sparkles,
};

function SkeletonCard(): JSX.Element {
  return (
    <div className="dashboard-card dashboard-card--skeleton">
      <div className="dashboard-card-icon skeleton-pulse" />
      <div className="dashboard-card-content">
        <div className="skeleton-title skeleton-pulse" />
        <div className="skeleton-desc skeleton-pulse" />
      </div>
    </div>
  );
}

export function Dashboard({
  cards,
  isLoading,
  onCardClick,
  onQuickStart,
  onRefresh,
  topics = [],
  concepts = [],
  onTopicClick,
  onDataImport,
}: DashboardProps) {
  const t = useI18n();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('prompt') as HTMLInputElement;
    if (input.value.trim()) {
      onQuickStart(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{t.dashboard.heading}</h1>
        <form className="dashboard-quickstart" onSubmit={handleSubmit}>
          <input
            type="text"
            name="prompt"
            placeholder={t.dashboard.inputPlaceholder}
            className="dashboard-input"
            autoComplete="off"
          />
          <button type="submit" className="dashboard-submit">
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </form>
      </header>

      <section className="dashboard-feed">
        <div className="dashboard-feed-header">
          <span className="dashboard-feed-label">{t.dashboard.suggestions}</span>
          {onRefresh && (
            <button
              type="button"
              className={`dashboard-refresh ${isLoading ? 'dashboard-refresh--loading' : ''}`}
              onClick={onRefresh}
              disabled={isLoading}
              title={t.dashboard.refreshSuggestions}
            >
              <RefreshCw size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {isLoading && cards.length === 0 ? (
          <div className="dashboard-cards">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : cards.length === 0 ? (
          <div className="dashboard-empty">
            <p>{t.dashboard.empty}</p>
          </div>
        ) : (
          <div className={`dashboard-cards ${isLoading ? 'dashboard-cards--refreshing' : ''}`}>
            {cards.map((card: DashboardCard) => {
              const Icon: LucideIcon = CARD_ICONS[card.type];
              return (
                <button
                  key={card.id}
                  className={`dashboard-card dashboard-card--${card.type}`}
                  onClick={() => onCardClick(card)}
                >
                  <div className="dashboard-card-icon">
                    <Icon size={16} strokeWidth={1.5} />
                  </div>
                  <div className="dashboard-card-content">
                    <h3 className="dashboard-card-title">{card.title}</h3>
                    <p className="dashboard-card-desc">{card.description}</p>
                  </div>
                  <ArrowRight size={14} strokeWidth={1.5} className="dashboard-card-arrow" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-knowledge">
        <KnowledgeWidget
          topics={topics}
          concepts={concepts}
          onTopicClick={onTopicClick}
        />
      </section>
    </div>
  );
}
