import type { ReactNode, ReactElement } from 'react';
import { Sidebar } from './Sidebar';
import type { Topic } from '../../types';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  topics: Topic[];
  selectedTopicId: string | null;
  onTopicSelect: (topicId: string) => void;
  onNewTopic: () => void;
  onDashboard: () => void;
  onSettings: () => void;
}

export function Layout({
  children,
  topics,
  selectedTopicId,
  onTopicSelect,
  onNewTopic,
  onDashboard,
  onSettings,
}: LayoutProps): ReactElement {
  return (
    <div className="layout">
      <Sidebar
        topics={topics}
        selectedTopicId={selectedTopicId}
        onTopicSelect={onTopicSelect}
        onNewTopic={onNewTopic}
        onDashboard={onDashboard}
        onSettings={onSettings}
      />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
