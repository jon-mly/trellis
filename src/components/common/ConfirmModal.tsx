import type { ReactElement } from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export function ConfirmModal({
  isVisible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps): ReactElement | null {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {variant === 'danger' && (
          <div className="confirm-icon confirm-icon--danger">
            <AlertTriangle size={24} strokeWidth={1.5} />
          </div>
        )}
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn confirm-btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-btn confirm-btn--confirm ${variant === 'danger' ? 'confirm-btn--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
