import { useEffect, useRef, useState } from 'react';

function ChatBubble({ role, children, layout }) {
  if (layout === 'list') {
    return (
      <div className={'chat-list-row role-' + role}>
        <div className="chat-list-tag">{role === 'bot' ? 'Assistant' : 'Vous'}</div>
        <div className="chat-list-text">{children}</div>
      </div>
    );
  }
  return (
    <div className={'chat-bubble role-' + role}>
      <div className="chat-bubble-text">{children}</div>
    </div>
  );
}

function TypingDots({ layout }) {
  if (layout === 'list') {
    return (
      <div className="chat-list-row role-bot">
        <div className="chat-list-tag">Assistant</div>
        <div className="chat-list-text"><span className="typing"><i/><i/><i/></span></div>
      </div>
    );
  }
  return (
    <div className="chat-bubble role-bot">
      <div className="chat-bubble-text"><span className="typing"><i/><i/><i/></span></div>
    </div>
  );
}

export default function ChatPanel({ messages, currentQuestion, onAnswer, onFreeText, onRestart, isTyping, layout, progress }) {
  const scrollRef = useRef(null);
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentQuestion]);

  const submit = (e) => {
    e.preventDefault();
    if (!freeText.trim()) return;
    onFreeText(freeText.trim());
    setFreeText('');
  };

  return (
    <aside className="chat-panel" data-layout={layout}>
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
          <ChatBubble key={i} role={m.role} layout={layout}>{m.text}</ChatBubble>
        ))}
        {isTyping && <TypingDots layout={layout} />}

        {!isTyping && currentQuestion && (
          <div className="chat-choices">
            {currentQuestion.choices.map((c) => (
              <button key={c.id} className="choice-chip" onClick={() => onAnswer(currentQuestion.id, c)}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input
          type="text"
          placeholder={currentQuestion ? 'Ou écrivez votre réponse…' : 'Précisez vos critères…'}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
        />
        <button type="submit" disabled={!freeText.trim()} aria-label="Envoyer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8 L14 8 M9 3 L14 8 L9 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </aside>
  );
}
