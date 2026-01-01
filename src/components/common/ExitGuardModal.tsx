import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import './ExitGuardModal.css';

interface ExitGuardModalProps {
  isVisible: boolean;
}

export function ExitGuardModal({ isVisible }: ExitGuardModalProps): ReactElement | null {
  const t = useI18n();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="exit-guard-overlay">
      <div className="exit-guard-modal">
        <div className="exit-guard-spinner">
          <Loader2 size={24} className="exit-guard-icon" />
        </div>
        <h3 className="exit-guard-title">{t.exitGuard.title}</h3>
        <p className="exit-guard-message">{t.exitGuard.message}</p>
      </div>
    </div>
  );
}
