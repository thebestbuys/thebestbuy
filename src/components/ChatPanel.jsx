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

// Fixed budget brackets shown as chips — faster and clearer than a slider.
const BUDGET_BRACKETS = [
  { id: 'b1', labelKey: 'budget.bracket1', min: null, max: 300 },
  { id: 'b2', labelKey: 'budget.bracket2', min: 300, max: 600 },
  { id: 'b3', labelKey: 'budget.bracket3', min: 600, max: 1000 },
  { id: 'b4', labelKey: 'budget.bracket4', min: 1000, max: null },
];

function BudgetBrackets({ question, onAnswer }) {
  const { t } = useI18n();

  const send = (b) => {
    let label;
    if (b.min == null) label = t('budget.maxOnly', { max: b.max });
    else if (b.max == null) label = t('budget.minOnly', { min: b.min });
    else label = t('budget.range', { min: b.min, max: b.max });
    onAnswer(question.id, { id: b.id, label, tags: [], min: b.min, max: b.max });
  };

  return (
    <div className="budget-brackets">
      {BUDGET_BRACKETS.map((b) => (
        <button
          key={b.id}
          type="button"
          className="choice-chip budget-bracket"
          onClick={() => send(b)}
        >
          {t(b.labelKey)}
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
