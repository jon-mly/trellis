import type { ReactElement } from 'react';
import { FileText, Home, Plus, Settings } from 'lucide-react';
import type { Topic } from '../../types';
import { useI18n } from '../../i18n';
import './Sidebar.css';

interface SidebarProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onTopicSelect: (topicId: string) => void;
  onNewTopic: () => void;
  onDashboard: () => void;
  onSettings: () => void;
}

export function Sidebar({
  topics,
  selectedTopicId,
  onTopicSelect,
  onNewTopic,
  onDashboard,
  onSettings,
}: SidebarProps): ReactElement {
  const t = useI18n();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Trellis</h1>
        <button className="sidebar-new-btn" onClick={onNewTopic} aria-label={t.sidebar.newTopic}>
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      <div className="sidebar-dashboard">
        <button className="sidebar-dashboard-btn" onClick={onDashboard}>
          <Home size={14} strokeWidth={1.5} />
          <span>{t.sidebar.dashboard}</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <h2 className="sidebar-section-title">{t.sidebar.exploredThemes}</h2>
        {topics.length === 0 ? (
          <p className="sidebar-empty">{t.sidebar.noTopics}</p>
        ) : (
          <ul className="sidebar-topics">
            {topics.map((topic: Topic) => (
              <li key={topic.id}>
                <button
                  className={`sidebar-topic ${selectedTopicId === topic.id ? 'active' : ''}`}
                  onClick={() => onTopicSelect(topic.id)}
                >
                  <FileText size={14} strokeWidth={1.5} />
                  <span className="sidebar-topic-name">{topic.name}</span>
                  {topic.category && (
                    <span className="sidebar-topic-category">{topic.category}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" onClick={onSettings}>
          <Settings size={14} strokeWidth={1.5} />
          <span>{t.sidebar.settings}</span>
        </button>
      </div>
    </aside>
  );
}
