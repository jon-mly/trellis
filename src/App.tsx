import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { ChatView } from './components/chat';
import { Onboarding } from './components/onboarding/Onboarding';
import { useSessionStore } from './stores/sessionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useDashboardStore } from './stores/dashboardStore';
import { useKnowledgeStore } from './stores/knowledgeStore';
import { I18nProvider, getTranslations, detectLocale } from './i18n';
import type { DashboardCard, View } from './types';

function App(): JSX.Element {
  const [view, setView] = useState<View>('dashboard');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [knowledgeContext, setKnowledgeContext] = useState<string>('');

  const translations = getTranslations(detectLocale());

  const {
    topics,
    messages,
    isLoading,
    streamingContent,
    cliNotFound,
    loadTopics,
    startSession,
    sendMessage,
    endSession,
    resetCliNotFound,
  } = useSessionStore();

  const { settings, isLoaded, loadSettings, completeOnboarding } = useSettingsStore();

  const {
    cards,
    isLoading: isFeedLoading,
    loadFeed,
    refreshFeed,
  } = useDashboardStore();

  const {
    topics: knowledgeTopics,
    concepts,
    loadKnowledge,
    getKnowledgeContext,
  } = useKnowledgeStore();

  useEffect(() => {
    loadTopics();
    loadSettings();
    loadKnowledge();
  }, [loadTopics, loadSettings, loadKnowledge]);

  useEffect(() => {
    if (settings?.onboardingComplete && view === 'dashboard') {
      loadFeed();
    }
  }, [settings?.onboardingComplete, view, loadFeed]);

  useEffect(() => {
    const loadContext = async () => {
      const context = await getKnowledgeContext();
      setKnowledgeContext(context);
    };
    loadContext();
  }, [getKnowledgeContext]);

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
        knowledgeContext,
      });
    }
  };

  const handleQuickStart = async (prompt: string) => {
    await startSession();
    setView('session');

    sendMessage(prompt, {
      teachingStyle: settings?.teachingStyle,
      knowledgeContext,
    });
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content, {
      teachingStyle: settings?.teachingStyle,
      knowledgeContext,
    });
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedTopicId(null);
    endSession().then(() => refreshFeed());
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  if (!isLoaded) {
    return <></>;
  }

  const handleCliSetupComplete = () => {
    resetCliNotFound();
  };

  // Show onboarding if CLI is not found during usage
  if (cliNotFound) {
    return (
      <I18nProvider value={translations}>
        <Onboarding onComplete={handleCliSetupComplete} />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider value={translations}>
      {!settings?.onboardingComplete ? (
        <Onboarding onComplete={completeOnboarding} />
      ) : (
        <Layout
          topics={topics}
          selectedTopicId={selectedTopicId}
          onTopicSelect={handleTopicSelect}
          onNewTopic={handleNewTopic}
        >
          {view === 'dashboard' ? (
            <Dashboard
              cards={cards}
              isLoading={isFeedLoading}
              onCardClick={handleCardClick}
              onQuickStart={handleQuickStart}
              onRefresh={refreshFeed}
              topics={knowledgeTopics}
              concepts={concepts}
              onTopicClick={handleTopicSelect}
              onDataImport={() => {
                loadKnowledge();
                loadTopics();
                refreshFeed();
              }}
            />
          ) : (
            <ChatView
              messages={messages}
              isLoading={isLoading}
              streamingContent={streamingContent}
              onSendMessage={handleSendMessage}
              onBack={handleBackToDashboard}
              topicName={selectedTopic?.name}
            />
          )}
        </Layout>
      )}
    </I18nProvider>
  );
}

export default App;
