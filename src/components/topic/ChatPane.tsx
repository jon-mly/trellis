import { useState, useRef, useEffect, type ReactElement, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import { ArrowUp, Eye, X, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, PromptContext } from '../../types';
import { useI18n } from '../../i18n';
import './ChatPane.css';

export interface ChatPaneProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  onSendMessage: (content: string) => void;
  onRequestDemo?: () => void;
  isGeneratingDemo?: boolean;
}

export function ChatPane({
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
  onRequestDemo,
  isGeneratingDemo = false,
}: ChatPaneProps): ReactElement {
  const t = useI18n();
  const [input, setInput] = useState<string>('');
  const [viewingPrompt, setViewingPrompt] = useState<PromptContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect((): void => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  const handlePromptView = (promptContext: PromptContext | undefined): void => {
    setViewingPrompt(promptContext ?? null);
  };

  const handleClosePrompt = (): void => {
    setViewingPrompt(null);
  };

  const handleOverlayClick = (): void => {
    setViewingPrompt(null);
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  return (
    <div className="chat-pane">
      <div className="chat-pane-messages">
        {messages.map((message: Message) => (
          <div key={message.id} className={`chat-pane-message chat-pane-message--${message.role}`}>
            <div className="chat-pane-message-header">
              <span className="chat-pane-message-role">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              {message.role === 'user' && message.promptContext && (
                <button
                  type="button"
                  className="chat-pane-prompt-btn"
                  onClick={() => handlePromptView(message.promptContext)}
                  title="View actual prompt sent"
                >
                  <Eye size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
            <div className="chat-pane-message-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="chat-pane-message chat-pane-message--assistant">
            <div className="chat-pane-message-role">Assistant</div>
            <div className="chat-pane-message-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="chat-pane-message chat-pane-message--assistant">
            <div className="chat-pane-message-role">Assistant</div>
            <div className="chat-pane-message-content chat-pane-loading">
              <span className="chat-pane-loading-dot" />
              <span className="chat-pane-loading-dot" />
              <span className="chat-pane-loading-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-pane-input-form" onSubmit={handleSubmit}>
        <div className="chat-pane-input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.inputPlaceholder}
            className="chat-pane-input"
            rows={1}
            disabled={isLoading}
          />
          <div className="chat-pane-actions">
            {onRequestDemo && messages.length > 0 && (
              <button
                type="button"
                className={`chat-pane-demo-btn ${isGeneratingDemo ? 'chat-pane-demo-btn--loading' : ''}`}
                onClick={onRequestDemo}
                disabled={isLoading || isGeneratingDemo}
                title={t.sandbox.generateDemo}
              >
                <Play size={14} strokeWidth={1.5} />
              </button>
            )}
            <button
              type="submit"
              className="chat-pane-submit"
              disabled={!input.trim() || isLoading}
            >
              <ArrowUp size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </form>

      {viewingPrompt && (
        <div className="chat-pane-modal-overlay" onClick={handleOverlayClick}>
          <div className="chat-pane-modal" onClick={handleModalClick}>
            <div className="chat-pane-modal-header">
              <h3>Prompt Details</h3>
              <button
                type="button"
                className="chat-pane-modal-close"
                onClick={handleClosePrompt}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="chat-pane-modal-content">
              <section className="chat-pane-prompt-section">
                <h4>System Prompt</h4>
                <pre>{viewingPrompt.systemPrompt}</pre>
              </section>
              {viewingPrompt.knowledgeContext && (
                <section className="chat-pane-prompt-section">
                  <h4>Knowledge Context</h4>
                  <pre>{viewingPrompt.knowledgeContext}</pre>
                </section>
              )}
              <section className="chat-pane-prompt-section">
                <h4>Full Prompt Sent</h4>
                <pre>{viewingPrompt.fullPrompt}</pre>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
