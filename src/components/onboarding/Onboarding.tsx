import type { JSX } from 'react';
import { useI18n } from '../../i18n';
import { Terminal, ExternalLink } from 'lucide-react';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: () => void | Promise<void>;
}

export function Onboarding({ onComplete }: OnboardingProps): JSX.Element {
  const t = useI18n();
  const installCommand: string = 'npm install -g @anthropic-ai/claude-code';
  const loginCommand: string = 'claude login';

  const handleCopyInstall = async (): Promise<void> => {
    await navigator.clipboard.writeText(installCommand);
  };

  const handleCopyLogin = async (): Promise<void> => {
    await navigator.clipboard.writeText(loginCommand);
  };

  const handleComplete = async (): Promise<void> => {
    await onComplete();
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <header className="onboarding-header">
          <h1>{t.onboarding.welcome.title}</h1>
          <p>{t.onboarding.welcome.subtitle}</p>
        </header>

        <div className="onboarding-content">
          <div className="onboarding-step">
            <div className="onboarding-step-icon onboarding-step-icon--warning">
              <Terminal size={32} strokeWidth={1.5} />
            </div>
            <h2>{t.onboarding.notInstalled.title}</h2>
            <p>{t.onboarding.notInstalled.description}</p>

            <div className="onboarding-instructions">
              <h3>{t.onboarding.notInstalled.instructionsTitle}</h3>
              <p>{t.onboarding.notInstalled.instructionsRun}</p>
              <div className="onboarding-command">
                <code>{installCommand}</code>
                <button
                  type="button"
                  className="onboarding-copy-btn"
                  onClick={handleCopyInstall}
                  title={t.onboarding.actions.copy}
                >
                  {t.onboarding.actions.copy}
                </button>
              </div>

              <h3>{t.onboarding.notAuthenticated.instructionsTitle}</h3>
              <p>{t.onboarding.notAuthenticated.instructionsRun}</p>
              <div className="onboarding-command">
                <code>{loginCommand}</code>
                <button
                  type="button"
                  className="onboarding-copy-btn"
                  onClick={handleCopyLogin}
                  title={t.onboarding.actions.copy}
                >
                  {t.onboarding.actions.copy}
                </button>
              </div>
              <p className="onboarding-note">{t.onboarding.notAuthenticated.note}</p>

              <a
                href="https://docs.anthropic.com/en/docs/claude-code/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="onboarding-link"
              >
                <ExternalLink size={14} strokeWidth={1.5} />
                {t.onboarding.notInstalled.documentationLink}
              </a>
            </div>

            <button
              type="button"
              className="onboarding-btn onboarding-btn--primary"
              onClick={handleComplete}
            >
              {t.onboarding.ready.startButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
