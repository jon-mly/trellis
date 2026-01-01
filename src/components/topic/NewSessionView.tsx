import type { ReactElement } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { ChatPane } from './ChatPane';
import { useI18n } from '../../i18n';
import './TopicView.css';

interface NewSessionViewProps {
  onSendMessage: (content: string) => void;
}

export function NewSessionView({ onSendMessage }: NewSessionViewProps): ReactElement {
  const t = useI18n();
  const { messages, isLoading, streamingContent } = useSessionStore();

  return (
    <div className="topic-view">
      <div className="topic-view-main topic-view-main--full">
        <div className="topic-view-header">
          <h2 className="topic-view-title">{t.topicView.newSession}</h2>
        </div>
        <ChatPane
          messages={messages}
          isLoading={isLoading}
          streamingContent={streamingContent}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
}
