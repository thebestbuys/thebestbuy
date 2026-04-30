import { useRef, useState, useEffect } from 'react';
import type { Message, Question } from '../types';

interface Props {
  messages: Message[];
  currentQuestion: Question | null;
  onAnswer: (qId: string, choice: Question['choices'][number]) => void;
  onFreeText: (text: string) => void;
  onRestart: () => void;
  isTyping: boolean;
  progress: number;
}

function ChatBubble({ role, text }: { role: Message['role']; text: string }) {
  return (
    <div className={`chat-bubble role-${role}`}>
      <div className="chat-bubble-text">{text}</div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="chat-bubble role-bot">
      <div className="chat-bubble-text">
        <span className="typing">
          <i /><i /><i />
        </span>
      </div>
    </div>
  );
}

export function ChatPanel({
  messages, currentQuestion, onAnswer, onFreeText, onRestart, isTyping, progress,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeText.trim()) return;
    onFreeText(freeText.trim());
    setFreeText('');
  };

  return (
    <aside className="chat-panel">
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <span className="chat-avatar-pulse" />
            B
          </div>
          <div>
            <div className="chat-title">Bestbuys</div>
            <div className="chat-subtitle">
              <span className="chat-status-dot" />
              Conseiller en ligne
            </div>
          </div>
        </div>
        <button className="chat-restart" onClick={onRestart} title="Recommencer">↻</button>
      </header>

      <div className="chat-progress">
        <div className="chat-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div ref={scrollRef} className="chat-stream">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {isTyping && <TypingDots />}
        {!isTyping && currentQuestion && (
          <div className="chat-choices">
            {currentQuestion.choices.map((c) => (
              <button
                key={c.id}
                className="choice-chip"
                onClick={() => onAnswer(currentQuestion.id, c)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={currentQuestion ? 'Ou écrivez votre réponse…' : 'Précisez vos critères…'}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
        />
        <button type="submit" disabled={!freeText.trim()} aria-label="Envoyer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8 L14 8 M9 3 L14 8 L9 13"
              stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </aside>
  );
}
