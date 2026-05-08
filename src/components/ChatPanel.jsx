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

function isBudgetQuestion(question) {
  return question?.choices?.some((c) => c.min != null || c.max != null);
}

function BudgetSlider({ question, onAnswer }) {
  const mins = question.choices.filter((c) => c.min != null).map((c) => c.min);
  const maxs = question.choices.filter((c) => c.max != null).map((c) => c.max);
  const sliderMin = mins.length > 0 ? Math.min(...mins) : 0;
  const sliderMax = maxs.length > 0 ? Math.max(...maxs) : 2000;
  const [value, setValue] = useState(Math.round((sliderMin + sliderMax) / 2 / 50) * 50);

  const confirm = () => {
    onAnswer(question.id, { id: 'slider', label: `Mon budget maximum est de ${value}€`, tags: [], min: null, max: value });
  };

  const pct = ((value - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <div className="budget-slider">
      <div className="budget-slider-value">{value.toLocaleString('fr-FR')} €</div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={50}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="budget-range"
        style={{ '--pct': `${pct}%` }}
      />
      <div className="budget-slider-labels">
        <span>{sliderMin.toLocaleString('fr-FR')} €</span>
        <span>{sliderMax.toLocaleString('fr-FR')} €</span>
      </div>
      <button className="budget-confirm" onClick={confirm}>
        Confirmer <span className="btn-arrow">→</span>
      </button>
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
            {isBudgetQuestion(currentQuestion) ? (
              <BudgetSlider question={currentQuestion} onAnswer={onAnswer} />
            ) : (
              currentQuestion.choices.map((c) => (
                <button key={c.id} className="choice-chip" onClick={() => onAnswer(currentQuestion.id, c)}>
                  {c.label}
                </button>
              ))
            )}
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
