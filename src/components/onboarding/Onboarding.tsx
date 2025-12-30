import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { checkClaudeStatus, type AuthStatus } from '../../services/claude/cli-provider';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../i18n';
import {
  CheckCircle,
  XCircle,
  Loader,
  Terminal,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import './Onboarding.css';

type OnboardingStep = 'checking' | 'not-installed' | 'not-authenticated' | 'ready' | 'error';

export function Onboarding(): JSX.Element {
  const t = useI18n();
  const [step, setStep] = useState<OnboardingStep>('checking');
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [checkingMessage, setCheckingMessage] = useState<string>('Initializing...');
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);

  const checkStatus = async (): Promise<void> => {
    setIsRetrying(true);
    setCheckingMessage('Checking Claude CLI installation...');

    try {
      console.log('[Onboarding] Starting Claude CLI status check...');
      const status: AuthStatus = await checkClaudeStatus();
      console.log('[Onboarding] Status received:', status);

      setAuthStatus(status);

      if (status.error) {
        console.error('[Onboarding] Error from CLI check:', status.error, 'Step:', status.step_failed);
        setStep('error');
        return;
      }

      if (!status.installed) {
        console.log('[Onboarding] Claude CLI not installed');
        setStep('not-installed');
      } else if (!status.authenticated) {
        console.log('[Onboarding] Claude CLI not authenticated');
        setStep('not-authenticated');
      } else {
        console.log('[Onboarding] Claude CLI ready');
        setStep('ready');
      }
    } catch (error: unknown) {
      console.error('[Onboarding] Failed to check Claude status:', error);
      setAuthStatus({
        installed: false,
        authenticated: false,
        account: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        step_failed: 'invoke_failed',
      });
      setStep('error');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleComplete = async (): Promise<void> => {
    await completeOnboarding();
  };

  const handleRetry = () => {
    setStep('checking');
    checkStatus();
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <header className="onboarding-header">
          <h1>{t.onboarding.welcome.title}</h1>
          <p>{t.onboarding.welcome.subtitle}</p>
        </header>

        <div className="onboarding-content">
          {step === 'checking' && <CheckingStep message={checkingMessage} />}
          {step === 'error' && (
            <ErrorStep
              error={authStatus?.error ?? 'Unknown error'}
              stepFailed={authStatus?.step_failed ?? null}
              onRetry={handleRetry}
              isRetrying={isRetrying}
            />
          )}
          {step === 'not-installed' && (
            <NotInstalledStep onRetry={handleRetry} isRetrying={isRetrying} />
          )}
          {step === 'not-authenticated' && (
            <NotAuthenticatedStep onRetry={handleRetry} isRetrying={isRetrying} />
          )}
          {step === 'ready' && (
            <ReadyStep account={authStatus?.account ?? null} onComplete={handleComplete} />
          )}
        </div>

        <footer className="onboarding-footer">
          <div className="onboarding-steps-indicator">
            <StepIndicator
              label={t.onboarding.steps.cliInstalled}
              status={
                step === 'checking'
                  ? 'pending'
                  : step === 'not-installed' || step === 'error'
                    ? 'error'
                    : 'success'
              }
            />
            <StepIndicator
              label={t.onboarding.steps.authenticated}
              status={
                step === 'checking' || step === 'not-installed' || step === 'error'
                  ? 'pending'
                  : step === 'not-authenticated'
                    ? 'error'
                    : 'success'
              }
            />
            <StepIndicator
              label={t.onboarding.steps.ready}
              status={step === 'ready' ? 'success' : 'pending'}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

interface CheckingStepProps {
  message: string;
}

function CheckingStep({ message }: CheckingStepProps): JSX.Element {
  const t = useI18n();

  return (
    <div className="onboarding-step">
      <div className="onboarding-step-icon onboarding-step-icon--loading">
        <Loader size={32} strokeWidth={1.5} className="spinning" />
      </div>
      <h2>{t.onboarding.checking.title}</h2>
      <p>{t.onboarding.checking.description}</p>
      <p className="onboarding-status-message">{message}</p>
    </div>
  );
}

interface ErrorStepProps {
  error: string;
  stepFailed: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}

function ErrorStep({ error, stepFailed, onRetry, isRetrying }: ErrorStepProps): JSX.Element {
  const getStepDescription = (step: string | null): string => {
    switch (step) {
      case 'version_check':
        return 'Failed while checking CLI version';
      case 'version_check_timeout':
        return 'Timeout while checking CLI version';
      case 'auth_check':
        return 'Failed while checking authentication';
      case 'auth_check_timeout':
        return 'Timeout while checking authentication';
      case 'invoke_failed':
        return 'Failed to communicate with Tauri backend';
      default:
        return 'Unknown step';
    }
  };

  return (
    <div className="onboarding-step">
      <div className="onboarding-step-icon onboarding-step-icon--error">
        <AlertTriangle size={32} strokeWidth={1.5} />
      </div>
      <h2>Check Failed</h2>
      <p>An error occurred while checking Claude CLI status.</p>

      <div className="onboarding-error-details">
        {stepFailed && (
          <div className="onboarding-error-step">
            <span className="onboarding-error-label">Step:</span>
            <span className="onboarding-error-value">{getStepDescription(stepFailed)}</span>
          </div>
        )}
        <div className="onboarding-error-message">
          <span className="onboarding-error-label">Error:</span>
          <code className="onboarding-error-value">{error}</code>
        </div>
      </div>

      <button
        type="button"
        className="onboarding-btn"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <Loader size={16} strokeWidth={1.5} className="spinning" />
        ) : (
          <RefreshCw size={16} strokeWidth={1.5} />
        )}
        Try Again
      </button>
    </div>
  );
}

interface ActionStepProps {
  onRetry: () => void;
  isRetrying: boolean;
}

function NotInstalledStep({ onRetry, isRetrying }: ActionStepProps): JSX.Element {
  const t = useI18n();
  const installCommand: string = 'npm install -g @anthropic-ai/claude-code';

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(installCommand);
  };

  return (
    <div className="onboarding-step">
      <div className="onboarding-step-icon onboarding-step-icon--error">
        <XCircle size={32} strokeWidth={1.5} />
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
            onClick={handleCopy}
            title={t.onboarding.actions.copy}
          >
            {t.onboarding.actions.copy}
          </button>
        </div>
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
        className="onboarding-btn"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <Loader size={16} strokeWidth={1.5} className="spinning" />
        ) : (
          <RefreshCw size={16} strokeWidth={1.5} />
        )}
        {t.onboarding.actions.checkAgain}
      </button>
    </div>
  );
}

function NotAuthenticatedStep({ onRetry, isRetrying }: ActionStepProps): JSX.Element {
  const t = useI18n();
  const loginCommand: string = 'claude login';

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(loginCommand);
  };

  return (
    <div className="onboarding-step">
      <div className="onboarding-step-icon onboarding-step-icon--warning">
        <Terminal size={32} strokeWidth={1.5} />
      </div>
      <h2>{t.onboarding.notAuthenticated.title}</h2>
      <p>{t.onboarding.notAuthenticated.description}</p>

      <div className="onboarding-instructions">
        <h3>{t.onboarding.notAuthenticated.instructionsTitle}</h3>
        <p>{t.onboarding.notAuthenticated.instructionsRun}</p>
        <div className="onboarding-command">
          <code>{loginCommand}</code>
          <button
            type="button"
            className="onboarding-copy-btn"
            onClick={handleCopy}
            title={t.onboarding.actions.copy}
          >
            {t.onboarding.actions.copy}
          </button>
        </div>
        <p className="onboarding-note">{t.onboarding.notAuthenticated.note}</p>
      </div>

      <button
        type="button"
        className="onboarding-btn"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <Loader size={16} strokeWidth={1.5} className="spinning" />
        ) : (
          <RefreshCw size={16} strokeWidth={1.5} />
        )}
        {t.onboarding.actions.checkAgain}
      </button>
    </div>
  );
}

interface ReadyStepProps {
  account: string | null;
  onComplete: () => Promise<void>;
}

function ReadyStep({ account, onComplete }: ReadyStepProps): JSX.Element {
  const t = useI18n();

  return (
    <div className="onboarding-step">
      <div className="onboarding-step-icon onboarding-step-icon--success">
        <CheckCircle size={32} strokeWidth={1.5} />
      </div>
      <h2>{t.onboarding.ready.title}</h2>
      <p>{t.onboarding.ready.description}</p>

      {account && (
        <div className="onboarding-account">
          <span className="onboarding-account-label">{t.onboarding.ready.connectedAs}</span>
          <span className="onboarding-account-value">{account}</span>
        </div>
      )}

      <button
        type="button"
        className="onboarding-btn onboarding-btn--primary"
        onClick={onComplete}
      >
        {t.onboarding.ready.startButton}
      </button>
    </div>
  );
}

interface StepIndicatorProps {
  label: string;
  status: 'pending' | 'success' | 'error';
}

function StepIndicator({ label, status }: StepIndicatorProps): JSX.Element {
  return (
    <div className={`step-indicator step-indicator--${status}`}>
      <div className="step-indicator-dot" />
      <span className="step-indicator-label">{label}</span>
    </div>
  );
}
