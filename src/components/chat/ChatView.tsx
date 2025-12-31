import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowLeft, Eye, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message, PromptContext } from '../../types';
import './ChatView.css';

export interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  topicName?: string;
}

export function ChatView({
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
  onBack,
  topicName,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [viewingPrompt, setViewingPrompt] = useState<PromptContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat">
      <header className="chat-header">
        {onBack && (
          <button type="button" className="chat-back-button" onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Back</span>
          </button>
        )}
        {topicName && (
          <div className="chat-topic">
            <span className="chat-topic-label">Topic</span>
            <h2 className="chat-topic-name">{topicName}</h2>
          </div>
        )}
      </header>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message chat-message--${message.role}`}>
            <div className="chat-message-header">
              <span className="chat-message-role">{message.role === 'user' ? 'You' : 'Assistant'}</span>
              {message.role === 'user' && message.promptContext && (
                <button
                  type="button"
                  className="chat-prompt-view-btn"
                  onClick={() => setViewingPrompt(message.promptContext ?? null)}
                  title="View actual prompt sent"
                >
                  <Eye size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
            <div className="chat-message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message-role">Assistant</div>
            <div className="chat-message-content">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message-role">Assistant</div>
            <div className="chat-message-content chat-message-loading">
              <span className="chat-loading-dot" />
              <span className="chat-loading-dot" />
              <span className="chat-loading-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-submit"
            disabled={!input.trim() || isLoading}
          >
            <ArrowUp size={16} strokeWidth={1.5} />
          </button>
        </div>
      </form>

      {viewingPrompt && (
        <div className="prompt-modal-overlay" onClick={() => setViewingPrompt(null)}>
          <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-modal-header">
              <h3>Prompt Details</h3>
              <button
                type="button"
                className="prompt-modal-close"
                onClick={() => setViewingPrompt(null)}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="prompt-modal-content">
              <section className="prompt-section">
                <h4>System Prompt</h4>
                <pre>{viewingPrompt.systemPrompt}</pre>
              </section>
              {viewingPrompt.knowledgeContext && (
                <section className="prompt-section">
                  <h4>Knowledge Context</h4>
                  <pre>{viewingPrompt.knowledgeContext}</pre>
                </section>
              )}
              <section className="prompt-section">
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
