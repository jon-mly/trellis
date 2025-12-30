import { ArrowRight, CornerDownRight, Layers, Compass, GitBranch } from 'lucide-react';
import type { DashboardCard } from '../../types';
import './Dashboard.css';

interface DashboardProps {
  cards: DashboardCard[];
  isLoading: boolean;
  onCardClick: (card: DashboardCard) => void;
  onQuickStart: (prompt: string) => void;
}

const CARD_ICONS = {
  resume: CornerDownRight,
  expand: Layers,
  discover: Compass,
  connection: GitBranch,
} as const;

export function Dashboard({ cards, isLoading, onCardClick, onQuickStart }: DashboardProps) {
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
        <h1>What would you like to learn?</h1>
        <form className="dashboard-quickstart" onSubmit={handleSubmit}>
          <input
            type="text"
            name="prompt"
            placeholder="Explore a new topic..."
            className="dashboard-input"
            autoComplete="off"
          />
          <button type="submit" className="dashboard-submit">
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </form>
      </header>

      <section className="dashboard-feed">
        {isLoading ? (
          <div className="dashboard-loading">Generating suggestions...</div>
        ) : cards.length === 0 ? (
          <div className="dashboard-empty">
            <p>Start exploring to see personalized suggestions here.</p>
          </div>
        ) : (
          <div className="dashboard-cards">
            {cards.map((card) => {
              const Icon = CARD_ICONS[card.type];
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
    </div>
  );
}
