import type { JSX } from 'react';
import { useRef, useState } from 'react';
import { Download, Upload, Trash2, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import {
  exportAllData,
  downloadExport,
  parseImportFile,
  importData,
} from '../../services/storage/data-export';
import './KnowledgeDataPanel.css';

interface KnowledgeDataPanelProps {
  onDataChange?: () => void;
}

type Status = 'idle' | 'success' | 'error';
type ClearStep = 'idle' | 'confirm' | 'final';

export function KnowledgeDataPanel({ onDataChange }: KnowledgeDataPanelProps): JSX.Element {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportStatus, setExportStatus] = useState<Status>('idle');
  const [importStatus, setImportStatus] = useState<Status>('idle');
  const [clearStep, setClearStep] = useState<ClearStep>('idle');
  const [clearStatus, setClearStatus] = useState<Status>('idle');

  const { clearAllKnowledge, topics, concepts } = useKnowledgeStore();

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      downloadExport(data);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseImportFile(file);
      await importData(data);
      setImportStatus('success');
      onDataChange?.();
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    // Reset input
    e.target.value = '';
  };

  const handleClearClick = () => {
    setClearStep('confirm');
  };

  const handleClearConfirm = () => {
    setClearStep('final');
  };

  const handleClearFinal = async () => {
    try {
      await clearAllKnowledge();
      setClearStatus('success');
      setClearStep('idle');
      onDataChange?.();
      setTimeout(() => setClearStatus('idle'), 3000);
    } catch {
      setClearStatus('error');
      setTimeout(() => setClearStatus('idle'), 3000);
    }
  };

  const handleClearCancel = () => {
    setClearStep('idle');
  };

  const hasKnowledge = topics.length > 0 || concepts.length > 0;

  return (
    <div className="knowledge-data-panel">
      <div className="knowledge-data-panel-header">
        <h2 className="knowledge-data-panel-title">{t.settings.knowledgeData.title}</h2>
        <p className="knowledge-data-panel-description">{t.settings.knowledgeData.description}</p>
      </div>

      <div className="knowledge-data-sections">
        {/* Import/Export Section */}
        <div className="knowledge-data-section">
          <h3 className="knowledge-data-section-title">{t.dataManagement.title}</h3>

          <div className="knowledge-data-actions">
            <div className="data-action">
              <button
                type="button"
                className="data-action-btn"
                onClick={handleExport}
                disabled={exportStatus !== 'idle'}
              >
                {exportStatus === 'success' ? (
                  <Check size={16} strokeWidth={1.5} />
                ) : (
                  <Download size={16} strokeWidth={1.5} />
                )}
                <span>{t.dataManagement.export.button}</span>
              </button>
              <p className="data-action-desc">{t.dataManagement.export.description}</p>
              {exportStatus === 'success' && (
                <p className="data-action-status data-action-status--success">
                  {t.dataManagement.export.success}
                </p>
              )}
            </div>

            <div className="data-action">
              <button
                type="button"
                className="data-action-btn"
                onClick={handleImportClick}
                disabled={importStatus !== 'idle'}
              >
                {importStatus === 'success' ? (
                  <Check size={16} strokeWidth={1.5} />
                ) : importStatus === 'error' ? (
                  <AlertCircle size={16} strokeWidth={1.5} />
                ) : (
                  <Upload size={16} strokeWidth={1.5} />
                )}
                <span>{t.dataManagement.import.button}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="data-action-file-input"
              />
              <p className="data-action-desc">{t.dataManagement.import.description}</p>
              {importStatus === 'success' && (
                <p className="data-action-status data-action-status--success">
                  {t.dataManagement.import.success}
                </p>
              )}
              {importStatus === 'error' && (
                <p className="data-action-status data-action-status--error">
                  {t.dataManagement.import.error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Clear All Section */}
        <div className="knowledge-data-section knowledge-data-section--danger">
          <h3 className="knowledge-data-section-title">{t.settings.knowledgeData.dangerZone}</h3>

          <div className="clear-knowledge-container">
            {clearStep === 'idle' && (
              <>
                <button
                  type="button"
                  className="clear-knowledge-btn"
                  onClick={handleClearClick}
                  disabled={!hasKnowledge || clearStatus !== 'idle'}
                >
                  {clearStatus === 'success' ? (
                    <Check size={16} strokeWidth={1.5} />
                  ) : (
                    <Trash2 size={16} strokeWidth={1.5} />
                  )}
                  <span>{t.settings.knowledgeData.clearAll.button}</span>
                </button>
                <p className="clear-knowledge-desc">
                  {t.settings.knowledgeData.clearAll.description}
                </p>
                {!hasKnowledge && (
                  <p className="clear-knowledge-empty">
                    {t.settings.knowledgeData.clearAll.empty}
                  </p>
                )}
                {clearStatus === 'success' && (
                  <p className="data-action-status data-action-status--success">
                    {t.settings.knowledgeData.clearAll.success}
                  </p>
                )}
              </>
            )}

            {clearStep === 'confirm' && (
              <div className="clear-confirmation">
                <div className="clear-confirmation-warning">
                  <AlertTriangle size={20} strokeWidth={1.5} />
                  <div>
                    <p className="clear-confirmation-title">
                      {t.settings.knowledgeData.clearAll.confirmTitle}
                    </p>
                    <p className="clear-confirmation-message">
                      {t.settings.knowledgeData.clearAll.confirmMessage}
                    </p>
                  </div>
                </div>
                <div className="clear-confirmation-actions">
                  <button
                    type="button"
                    className="clear-confirmation-cancel"
                    onClick={handleClearCancel}
                  >
                    {t.settings.knowledgeData.clearAll.cancel}
                  </button>
                  <button
                    type="button"
                    className="clear-confirmation-proceed"
                    onClick={handleClearConfirm}
                  >
                    {t.settings.knowledgeData.clearAll.proceed}
                  </button>
                </div>
              </div>
            )}

            {clearStep === 'final' && (
              <div className="clear-confirmation clear-confirmation--final">
                <div className="clear-confirmation-warning clear-confirmation-warning--final">
                  <AlertTriangle size={20} strokeWidth={1.5} />
                  <div>
                    <p className="clear-confirmation-title">
                      {t.settings.knowledgeData.clearAll.finalTitle}
                    </p>
                    <p className="clear-confirmation-message">
                      {t.settings.knowledgeData.clearAll.finalMessage}
                    </p>
                  </div>
                </div>
                <div className="clear-confirmation-actions">
                  <button
                    type="button"
                    className="clear-confirmation-cancel"
                    onClick={handleClearCancel}
                  >
                    {t.settings.knowledgeData.clearAll.cancel}
                  </button>
                  <button
                    type="button"
                    className="clear-confirmation-delete"
                    onClick={handleClearFinal}
                  >
                    {t.settings.knowledgeData.clearAll.deleteAll}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
