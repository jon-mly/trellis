import { FileText, Plus } from 'lucide-react';
import type { Topic } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onTopicSelect: (topicId: string) => void;
  onNewTopic: () => void;
}

export function Sidebar({ topics, selectedTopicId, onTopicSelect, onNewTopic }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Trellis</h1>
        <button className="sidebar-new-btn" onClick={onNewTopic} aria-label="New topic">
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <h2 className="sidebar-section-title">Explored Themes</h2>
        {topics.length === 0 ? (
          <p className="sidebar-empty">No topics yet. Start exploring!</p>
        ) : (
          <ul className="sidebar-topics">
            {topics.map((topic) => (
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
    </aside>
  );
}
