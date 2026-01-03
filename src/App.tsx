import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { TopicView, NewSessionView } from "./components/topic";
import { Onboarding } from "./components/onboarding/Onboarding";
import { ExitGuardModal } from "./components/common";
import { SettingsView } from "./components/settings";
import { useSessionStore } from "./stores/sessionStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useDashboardStore } from "./stores/dashboardStore";
import { useKnowledgeStore } from "./stores/knowledgeStore";
import { useTopicSummaryStore } from "./stores/topicSummaryStore";
import { useExitGuard } from "./hooks/useExitGuard";
import { I18nProvider, getTranslations, detectLocale } from "./i18n";
import type { DashboardCard, TeachingStyle, View } from "./types";

function App(): ReactElement {
  const [view, setView] = useState<View>("dashboard");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [knowledgeContext, setKnowledgeContext] = useState<string>("");

  const translations = getTranslations(detectLocale());
  const { pendingClose } = useExitGuard();

  const { topics, cliNotFound, loadTopics, createTopic, deleteTopic, startSession, sendMessage, endSession, resetCliNotFound, clearCurrentSession, loadSessionsForTopic } =
    useSessionStore();

  const { settings, isLoaded, loadSettings, completeOnboarding, updateTeachingStyle } = useSettingsStore();

  const { cards, isLoading: isFeedLoading, loadFeed, refreshFeed, refreshFeedInBackground } = useDashboardStore();

  const { regenerateSummaryInBackground } = useTopicSummaryStore();

  const { topics: knowledgeTopics, concepts, loadKnowledge, getKnowledgeContext } = useKnowledgeStore();

  useEffect(() => {
    loadTopics();
    loadSettings();
    loadKnowledge();
  }, [loadTopics, loadSettings, loadKnowledge]);

  useEffect(() => {
    if (settings?.onboardingComplete && view === "dashboard") {
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

  const handleTopicSelect = (topicId: string): void => {
    setSelectedTopicId(topicId);
    setView("session");
    void loadSessionsForTopic(topicId);
  };

  const handleNewTopic = (): void => {
    setSelectedTopicId(null);
    startSession();
    setView("session");
  };

  const handleDashboard = (): void => {
    const topicIdBeforeLeaving = selectedTopicId;
    setView("dashboard");
    setSelectedTopicId(null);
    clearCurrentSession();

    // End session and trigger background updates
    void endSession().then(() => {
      // Regenerate dashboard feed in background
      refreshFeedInBackground();
      // Regenerate topic summary in background if we were viewing a topic
      if (topicIdBeforeLeaving) {
        regenerateSummaryInBackground(topicIdBeforeLeaving);
      }
    });
  };

  const handleSettings = (): void => {
    setView("settings");
    setSelectedTopicId(null);
  };

  const handleSaveTeachingStyle = (style: TeachingStyle): void => {
    void updateTeachingStyle(style);
  };

  const handleCardClick = async (card: DashboardCard): Promise<void> => {
    let topicId = card.topicId;

    // If card doesn't have a topicId, create a new topic from the card title
    if (!topicId) {
      const newTopic = await createTopic(card.title);
      topicId = newTopic.id;
    }

    setSelectedTopicId(topicId);
    startSession(topicId);
    setView("session");

    if (card.suggestedPrompt) {
      sendMessage(card.suggestedPrompt, {
        teachingStyle: settings?.teachingStyle,
        knowledgeContext,
      });
    }
  };

  const handleQuickStart = async (prompt: string) => {
    startSession();
    setView("session");

    sendMessage(prompt, {
      teachingStyle: settings?.teachingStyle,
      knowledgeContext,
    });
  };

  const handleSendMessage = (content: string): void => {
    sendMessage(content, {
      teachingStyle: settings?.teachingStyle,
      knowledgeContext,
    });
  };

  const handleDeleteTopic = async (): Promise<void> => {
    if (selectedTopicId) {
      await deleteTopic(selectedTopicId);
      setSelectedTopicId(null);
      setView("dashboard");
      refreshFeedInBackground();
    }
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
        <>
          <Layout
            topics={topics}
            selectedTopicId={selectedTopicId}
            onTopicSelect={handleTopicSelect}
            onNewTopic={handleNewTopic}
            onDashboard={handleDashboard}
            onSettings={handleSettings}
          >
            {view === "dashboard" ? (
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
            ) : view === "settings" && settings?.teachingStyle ? (
              <SettingsView
                teachingStyle={settings.teachingStyle}
                onSave={handleSaveTeachingStyle}
                onBack={handleDashboard}
                onDataChange={() => {
                  loadKnowledge();
                  loadTopics();
                  refreshFeed();
                }}
              />
            ) : view === "session" && selectedTopic ? (
              <TopicView topic={selectedTopic} onSendMessage={handleSendMessage} onDeleteTopic={handleDeleteTopic} />
            ) : view === "session" ? (
              <NewSessionView onSendMessage={handleSendMessage} />
            ) : null}
          </Layout>
          <ExitGuardModal isVisible={pendingClose} />
        </>
      )}
    </I18nProvider>
  );
}

export default App;
