import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { ChatView } from './components/chat';
import { Onboarding } from './components/onboarding/Onboarding';
import { useSessionStore } from './stores/sessionStore';
import { useSettingsStore } from './stores/settingsStore';
import { I18nProvider, getTranslations, detectLocale } from './i18n';
import type { DashboardCard, View } from './types';

const MOCK_CARDS: DashboardCard[] = [
  {
    id: '1',
    type: 'resume',
    title: 'Continue: Trigonometry',
    description: 'You were learning about the unit circle and radians',
    topicId: '1',
    lastExplored: new Date(),
  },
  {
    id: '2',
    type: 'expand',
    title: 'Expand: Rust Ownership',
    description: 'Ready to explore borrowing and lifetimes?',
    topicId: '2',
  },
  {
    id: '3',
    type: 'discover',
    title: 'Discover: Fourier Transforms',
    description: 'Based on your interest in trigonometry',
  },
  {
    id: '4',
    type: 'connection',
    title: 'Connection: Math meets Programming',
    description: 'Trigonometry concepts are used in graphics programming',
  },
];

function App(): JSX.Element {
  const [view, setView] = useState<View>('dashboard');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const translations = getTranslations(detectLocale());

  const {
    topics,
    messages,
    isLoading,
    streamingContent,
    loadTopics,
    startSession,
    sendMessage,
  } = useSessionStore();

  const { settings, isLoaded, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadTopics();
    loadSettings();
  }, [loadTopics, loadSettings]);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    setView('session');
    startSession(topicId);
  };

  const handleNewTopic = async () => {
    await startSession();
    setView('session');
  };

  const handleCardClick = async (card: DashboardCard) => {
    if (card.topicId) {
      setSelectedTopicId(card.topicId);
    }
    await startSession(card.topicId);
    setView('session');

    if (card.suggestedPrompt) {
      sendMessage(card.suggestedPrompt, {
        teachingStyle: settings?.teachingStyle,
      });
    }
  };

  const handleQuickStart = async (prompt: string) => {
    await startSession();
    setView('session');

    sendMessage(prompt, {
      teachingStyle: settings?.teachingStyle,
    });
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content, {
      teachingStyle: settings?.teachingStyle,
    });
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  if (!isLoaded) {
    return <></>;
  }

  return (
    <I18nProvider value={translations}>
      {!settings?.onboardingComplete ? (
        <Onboarding />
      ) : (
        <Layout
          topics={topics}
          selectedTopicId={selectedTopicId}
          onTopicSelect={handleTopicSelect}
          onNewTopic={handleNewTopic}
        >
          {view === 'dashboard' ? (
            <Dashboard
              cards={MOCK_CARDS}
              isLoading={false}
              onCardClick={handleCardClick}
              onQuickStart={handleQuickStart}
            />
          ) : (
            <ChatView
              messages={messages}
              isLoading={isLoading}
              streamingContent={streamingContent}
              onSendMessage={handleSendMessage}
              topicName={selectedTopic?.name}
            />
          )}
        </Layout>
      )}
    </I18nProvider>
  );
}

export default App;
