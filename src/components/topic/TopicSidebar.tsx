import { type ReactElement, type MouseEvent, useState } from 'react';
import { Plus, MessageSquare, Trash2, LayoutDashboard } from 'lucide-react';
import type { Session } from '../../types';
import { useI18n } from '../../i18n';
import { ConfirmModal } from '../common';
import './TopicSidebar.css';

interface TopicSidebarProps {
  sessions: Session[];
  selectedSessionId: string | null;
  showingDashboard?: boolean;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteTopic: () => void | Promise<void>;
  onShowDashboard?: () => void;
}

function formatSessionDate(date: Date): string {
  const now = new Date();
  const sessionDate = new Date(date);
  const diffMs = now.getTime() - sessionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return sessionDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return sessionDate.toLocaleDateString(undefined, { weekday: 'long' });
  } else {
    return sessionDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function TopicSidebar({
  sessions,
  selectedSessionId,
  showingDashboard = false,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onDeleteTopic,
  onShowDashboard,
}: TopicSidebarProps): ReactElement {
  const t = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleDeleteSessionClick = (e: MouseEvent<HTMLButtonElement>, sessionId: string): void => {
    e.stopPropagation();
    onDeleteSession(sessionId);
  };

  const handleDeleteTopicClick = (): void => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (): void => {
    setShowDeleteConfirm(false);
    onDeleteTopic();
  };

  const handleCancelDelete = (): void => {
    setShowDeleteConfirm(false);
  };

  return (
    <aside className="topic-sidebar">
      {onShowDashboard && (
        <div className="topic-sidebar-overview">
          <button
            type="button"
            className={`topic-sidebar-overview-btn ${showingDashboard ? 'active' : ''}`}
            onClick={onShowDashboard}
          >
            <LayoutDashboard size={14} strokeWidth={1.5} />
            <span>{t.topicDashboard.title}</span>
          </button>
        </div>
      )}

      <div className="topic-sidebar-sessions">
        <div className="topic-sidebar-sessions-header">
          <h3 className="topic-sidebar-sessions-label">{t.topicView.sessions}</h3>
          <button
            className="topic-sidebar-new-btn"
            onClick={onNewSession}
            aria-label={t.topicView.newSession}
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="topic-sidebar-empty">{t.topicView.noSessions}</p>
        ) : (
          <ul className="topic-sidebar-sessions-list">
            {sessions.map((session: Session) => (
              <li key={session.id}>
                <button
                  className={`topic-sidebar-session ${
                    selectedSessionId === session.id ? 'active' : ''
                  }`}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <MessageSquare size={14} strokeWidth={1.5} />
                  <span className="topic-sidebar-session-date">
                    {formatSessionDate(session.lastMessageAt)}
                  </span>
                  <button
                    type="button"
                    className="topic-sidebar-session-delete"
                    onClick={(e) => handleDeleteSessionClick(e, session.id)}
                    aria-label={t.topicView.deleteSession}
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="topic-sidebar-footer">
        <button
          type="button"
          className="topic-sidebar-delete-topic"
          onClick={handleDeleteTopicClick}
        >
          <Trash2 size={14} strokeWidth={1.5} />
          {t.topicView.deleteTopic}
        </button>
      </div>

      <ConfirmModal
        isVisible={showDeleteConfirm}
        title={t.topicView.deleteTopicTitle}
        message={t.topicView.deleteTopicConfirm}
        confirmLabel={t.topicView.confirm}
        cancelLabel={t.topicView.cancel}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </aside>
  );
}
