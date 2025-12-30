import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { Topic } from '../../types';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  topics: Topic[];
  selectedTopicId: string | null;
  onTopicSelect: (topicId: string) => void;
  onNewTopic: () => void;
}

export function Layout({ children, topics, selectedTopicId, onTopicSelect, onNewTopic }: LayoutProps) {
  return (
    <div className="layout">
      <Sidebar
        topics={topics}
        selectedTopicId={selectedTopicId}
        onTopicSelect={onTopicSelect}
        onNewTopic={onNewTopic}
      />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
