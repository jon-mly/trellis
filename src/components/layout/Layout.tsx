import type { ReactNode, ReactElement } from 'react';
import { Sidebar } from './Sidebar';
import { SandboxPanel } from '../sandbox';
import { useSessionStore } from '../../stores/sessionStore';
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
  const { currentDemo, demos, selectDemo, closeSandbox } = useSessionStore();

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
      {currentDemo && (
        <SandboxPanel
          currentDemo={currentDemo}
          demos={demos}
          onSelectDemo={selectDemo}
          onClose={closeSandbox}
        />
      )}
    </div>
  );
}
