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

const BUDGET_MAX = 1000;

function isBudgetQuestion(question) {
  return question?.choices?.some((c) => c.min != null || c.max != null);
}

function BudgetSlider({ question, onAnswer }) {
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(BUDGET_MAX);

  const minPct = (minVal / BUDGET_MAX) * 100;
  const maxPct = (maxVal / BUDGET_MAX) * 100;

  const fmtMin = minVal === 0 ? '0 €' : `${minVal.toLocaleString('fr-FR')} €`;
  const fmtMax = maxVal >= BUDGET_MAX ? '1 000€+' : `${maxVal.toLocaleString('fr-FR')} €`;

  const confirm = () => {
    const maxForAI = maxVal >= BUDGET_MAX ? null : maxVal;
    let label;
    if (minVal === 0 && maxForAI === null) label = 'Pas de contrainte de budget';
    else if (minVal === 0) label = `Mon budget maximum est de ${maxVal}€`;
    else if (maxForAI === null) label = `Mon budget est d'au moins ${minVal}€`;
    else label = `Mon budget est entre ${minVal}€ et ${maxVal}€`;
    onAnswer(question.id, { id: 'slider', label, tags: [], min: minVal || null, max: maxForAI });
  };

  return (
    <div className="budget-slider">
      <div className="budget-slider-values">
        <span className="budget-val">{fmtMin}</span>
        <span className="budget-dash">—</span>
        <span className="budget-val budget-val-max">{fmtMax}</span>
      </div>
      <div className="budget-range-wrap">
        <div className="budget-track-bg" />
        <div
          className="budget-track-fill"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        <input
          type="range"
          min={0} max={BUDGET_MAX} step={50}
          value={minVal}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v < maxVal) setMinVal(v);
          }}
          className="budget-range budget-range-min"
          style={{ zIndex: minVal >= maxVal - 50 ? 5 : 3 }}
        />
        <input
          type="range"
          min={0} max={BUDGET_MAX} step={50}
          value={maxVal}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > minVal) setMaxVal(v);
          }}
          className="budget-range budget-range-max"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="budget-slider-labels">
        <span>0 €</span>
        <span>1 000€+</span>
      </div>
      <button className="budget-confirm" onClick={confirm}>
        Confirmer <span className="btn-arrow">→</span>
      </button>
    </div>
  );
}

export default function ChatPanel({ messages, currentQuestion, onAnswer, onFreeText, onRestart, onHome, onOpenHistory, isTyping, layout, progress }) {
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
        <div className="chat-header-actions">
          {onOpenHistory && (
            <button
              className="chat-restart"
              onClick={onOpenHistory}
              title="Historique"
              aria-label="Historique"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {onHome && (
            <button
              className="chat-restart"
              onClick={onHome}
              title="Retour à l'accueil"
              aria-label="Retour à l'accueil"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2.5 7.5L8 2.5l5.5 5M4 7v6h3v-3.5h2V13h3V7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <button className="chat-restart" onClick={onRestart} title="Recommencer la conversation" aria-label="Recommencer la conversation">↻</button>
        </div>
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
