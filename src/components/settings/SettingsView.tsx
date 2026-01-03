import type { ReactElement } from 'react';
import { useState } from 'react';
import { ArrowLeft, Sparkles, Database } from 'lucide-react';
import { TeachingStylePanel } from './TeachingStylePanel';
import { KnowledgeDataPanel } from './KnowledgeDataPanel';
import type { TeachingStyle } from '../../types';
import { useI18n } from '../../i18n';
import './SettingsView.css';

type SettingsTab = 'teaching-style' | 'knowledge-data';

interface SettingsViewProps {
  teachingStyle: TeachingStyle;
  onSave: (style: TeachingStyle) => void;
  onBack: () => void;
  onDataChange?: () => void;
}

export function SettingsView({
  teachingStyle,
  onSave,
  onBack,
  onDataChange,
}: SettingsViewProps): ReactElement {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('teaching-style');

  const tabs: { id: SettingsTab; label: string; icon: typeof Sparkles }[] = [
    { id: 'teaching-style', label: t.settings.tabs.teachingStyle, icon: Sparkles },
    { id: 'knowledge-data', label: t.settings.tabs.knowledgeData, icon: Database },
  ];

  return (
    <div className="settings-view">
      <header className="settings-header">
        <button
          type="button"
          className="settings-back-btn"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="settings-title">{t.settings.title}</h1>
          <p className="settings-description">{t.settings.description}</p>
        </div>
      </header>

      <div className="settings-layout">
        <nav className="settings-sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          {activeTab === 'teaching-style' && (
            <TeachingStylePanel
              teachingStyle={teachingStyle}
              onSave={onSave}
            />
          )}
          {activeTab === 'knowledge-data' && (
            <KnowledgeDataPanel onDataChange={onDataChange} />
          )}
        </div>
      </div>
    </div>
  );
}
