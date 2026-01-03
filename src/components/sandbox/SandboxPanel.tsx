import type { ReactElement } from 'react';
import { useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { SandboxDemo } from '../../types';
import { useI18n } from '../../i18n';
import './SandboxPanel.css';

interface SandboxPanelProps {
  currentDemo: SandboxDemo;
  demos: SandboxDemo[];
  onSelectDemo: (demoId: string) => void;
  onClose: () => void;
}

export function SandboxPanel({
  currentDemo,
  demos,
  onSelectDemo,
  onClose,
}: SandboxPanelProps): ReactElement {
  const t = useI18n();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && currentDemo.html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(currentDemo.html);
        doc.close();
      }
    }
  }, [currentDemo.html]);

  const hasPreviousDemos = demos.length > 1;

  return (
    <aside className="sandbox-panel">
      <header className="sandbox-header">
        <div className="sandbox-title-area">
          {hasPreviousDemos ? (
            <div className="sandbox-selector">
              <select
                className="sandbox-select"
                value={currentDemo.id}
                onChange={(e) => onSelectDemo(e.target.value)}
              >
                {demos.map((demo) => (
                  <option key={demo.id} value={demo.id}>
                    {demo.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} className="sandbox-select-icon" />
            </div>
          ) : (
            <h2 className="sandbox-title">{currentDemo.title}</h2>
          )}
        </div>
        <button
          type="button"
          className="sandbox-close"
          onClick={onClose}
          title={t.sandbox.close}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>
      <div className="sandbox-content">
        <iframe
          ref={iframeRef}
          className="sandbox-iframe"
          title={currentDemo.title}
          sandbox="allow-scripts"
        />
      </div>
    </aside>
  );
}
