import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

function ChatBubble({ role, children, layout }) {
  const { t } = useI18n();
  if (layout === 'list') {
    return (
      <div className={'chat-list-row role-' + role}>
        <div className="chat-list-tag">{role === 'bot' ? t('chat.assistant') : t('chat.you')}</div>
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
  const { t } = useI18n();
  if (layout === 'list') {
    return (
      <div className="chat-list-row role-bot">
        <div className="chat-list-tag">{t('chat.assistant')}</div>
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

// Budget brackets shown as a 2-column chip grid. The ranges come from the AI,
// so they're adapted to the product (a baby bottle vs a phone vs a TV).
function BudgetBrackets({ question, onAnswer }) {
  return (
    <div className="budget-brackets">
      {question.choices.map((c) => (
        <button
          key={c.id}
          type="button"
          className="choice-chip budget-bracket"
          onClick={() => onAnswer(question.id, c)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export default function ChatPanel({ messages, currentQuestion, onAnswer, onFreeText, onRestart, onHome, onOpenHistory, isTyping, layout, progress }) {
  const { t } = useI18n();
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
            O
          </div>
          <div>
            <div className="chat-title">Oraklia</div>
            <div className="chat-subtitle">
              <span className="chat-status-dot" />
              {t('chat.subtitle')}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          {onOpenHistory && (
            <button
              className="chat-restart"
              onClick={onOpenHistory}
              title={t('chat.history')}
              aria-label={t('chat.history')}
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
              title={t('chat.home')}
              aria-label={t('chat.home')}
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
          <button className="chat-restart" onClick={onRestart} title={t('chat.restart')} aria-label={t('chat.restart')}>↻</button>
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
              <BudgetBrackets question={currentQuestion} onAnswer={onAnswer} />
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
          placeholder={currentQuestion ? t('chat.inputAnswer') : t('chat.inputCriteria')}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
        />
        <button type="submit" disabled={!freeText.trim()} aria-label={t('chat.send')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8 L14 8 M9 3 L14 8 L9 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </aside>
  );
}
