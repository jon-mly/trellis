import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import './ChatView.css';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  onSendMessage: (content: string) => void;
  topicName?: string;
}

export function ChatView({
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
  topicName,
}: ChatViewProps) {
  const [input, setInput] = useState('');
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
      {topicName && (
        <header className="chat-header">
          <span className="chat-topic-label">Topic</span>
          <h2 className="chat-topic-name">{topicName}</h2>
        </header>
      )}

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message chat-message--${message.role}`}>
            <div className="chat-message-role">{message.role === 'user' ? 'You' : 'Assistant'}</div>
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
    </div>
  );
}
