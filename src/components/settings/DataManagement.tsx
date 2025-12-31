import type { JSX } from 'react';
import { useRef, useState } from 'react';
import { Download, Upload, Check, AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n';
import {
  exportAllData,
  downloadExport,
  parseImportFile,
  importData,
} from '../../services/storage/data-export';
import './DataManagement.css';

interface DataManagementProps {
  onImportComplete?: () => void;
}

type Status = 'idle' | 'success' | 'error';

export function DataManagement({ onImportComplete }: DataManagementProps): JSX.Element {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportStatus, setExportStatus] = useState<Status>('idle');
  const [importStatus, setImportStatus] = useState<Status>('idle');

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
      onImportComplete?.();
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="data-management">
      <h3 className="data-management-title">{t.dataManagement.title}</h3>

      <div className="data-management-actions">
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
  );
}
