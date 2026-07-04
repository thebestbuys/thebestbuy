import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { CARD_IN_STAGGER_MS, CARD_OUT_STAGGER_MS, ProductLinkCard, ProductSkeleton } from './ProductCard.jsx';

function ChatBubble({ role, children, layout, onEdit, editLabel }) {
  const { t } = useI18n();
  const editable = role === 'user' && typeof onEdit === 'function';
  if (layout === 'list') {
    return (
      <div className={'chat-list-row role-' + role + (editable ? ' editable' : '')}>
        <div className="chat-list-tag">{role === 'bot' ? t('chat.assistant') : t('chat.you')}</div>
        {editable ? (
          <button type="button" className="chat-list-text chat-editable" onClick={onEdit} title={editLabel} aria-label={editLabel}>
            {children}
            <span className="chat-edit-pencil" aria-hidden="true">✎</span>
          </button>
        ) : (
          <div className="chat-list-text">{children}</div>
        )}
      </div>
    );
  }
  if (editable) {
    return (
      <button type="button" className="chat-bubble role-user chat-editable" onClick={onEdit} title={editLabel} aria-label={editLabel}>
        <div className="chat-bubble-text">{children}</div>
        <span className="chat-edit-pencil" aria-hidden="true">✎</span>
      </button>
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

// Multi-select question (question.multi): toggle several choices, then validate
// them as ONE combined answer (labels joined, tags unioned). Validating with
// nothing selected behaves like "No preference" (a skip).
function MultiChoice({ question, onAnswer, onSkip }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState([]);
  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const submit = () => {
    if (picked.length === 0) {
      onSkip();
      return;
    }
    const chosen = question.choices.filter((c) => picked.includes(c.id));
    const tags = [...new Set(chosen.flatMap((c) => c.tags || []))];
    const label = chosen.map((c) => c.label).join(', ');
    onAnswer(question.id, { id: 'multi', label, tags, min: null, max: null });
  };
  return (
    <div className="chat-multi">
      <div className="chat-choices">
        {question.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className={'choice-chip choice-toggle' + (picked.includes(c.id) ? ' selected' : '')}
            aria-pressed={picked.includes(c.id)}
            onClick={() => toggle(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <button type="button" className="choice-chip choice-validate" onClick={submit}>
        {picked.length === 0 ? t('chat.skip') : t('chat.multiValidate')}
      </button>
    </div>
  );
}

// The right control for a question (budget brackets / multi-select / single
// choice), always with a "No preference" escape hatch. Reused for the live
// question at the bottom and the in-place answer editor.
function ChoiceControl({ question, onAnswer, onSkip }) {
  const { t } = useI18n();
  // Defence in depth: drop any malformed/label-less choice (server normalizes,
  // but old cached questions in history may predate it). With nothing left to
  // show, offer just the "No preference" escape hatch instead of an empty grid.
  const choices = Array.isArray(question?.choices) ? question.choices.filter((c) => c && c.label) : [];
  if (!choices.length) {
    return (
      <div className="chat-choices">
        <button type="button" className="choice-chip choice-skip" onClick={onSkip}>{t('chat.skip')}</button>
      </div>
    );
  }
  const q = { ...question, choices };
  if (isBudgetQuestion(q)) {
    return (
      <>
        <BudgetBrackets question={q} onAnswer={onAnswer} />
        <div className="chat-choices chat-skip-row">
          <button type="button" className="choice-chip choice-skip" onClick={onSkip}>{t('chat.skip')}</button>
        </div>
      </>
    );
  }
  if (q.multi) {
    return <MultiChoice question={q} onAnswer={onAnswer} onSkip={onSkip} />;
  }
  return (
    <div className="chat-choices">
      {q.choices.map((c) => (
        <button key={c.id} className="choice-chip" onClick={() => onAnswer(question.id, c)}>
          {c.label}
        </button>
      ))}
      <button type="button" className="choice-chip choice-skip" onClick={onSkip}>{t('chat.skip')}</button>
    </div>
  );
}

export default function ChatPanel({ messages, currentQuestion, onAnswer, onFreeText, onRestart, onHome, onOpenHistory, onStartEdit, onCancelEdit, onApplyEdit, editMsgIndex = null, editQuestion = null, onRetry = null, onShowOthers = null, onRecommendNow = null, guide = null, onOpenGuide = null, budget = null, isTyping, layout, progressInfo, products = [], onSelectProduct, inlineProducts = false, loadingProducts = false, cardsReady = true, skelLeaving = false, pastCount = 0, viewingPastIndex = null, onViewPrevious = null, onViewLatest = null, onViewFirst = null, headerExtras = null }) {
  const { t } = useI18n();
  const scrollRef = useRef(null);
  const [freeText, setFreeText] = useState('');
  // Narrow (mobile) shows recommendations in a bottom-sheet drawer instead of
  // inline in the conversation — so the chat stays a clean Q&A thread and the
  // products don't shove the questions around on every update.
  const showInline = inlineProducts && cardsReady && products.length > 0;
  const showInlineSkeleton = inlineProducts && (loadingProducts || skelLeaving) && !showInline;
  const resultsLoading = inlineProducts && (loadingProducts || skelLeaving) && products.length === 0;
  const showResultsBar = inlineProducts && (showInline || resultsLoading);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [barPulse, setBarPulse] = useState(false);
  const autoOpenedRef = useRef(false); // sheet auto-opens once, on the first batch
  const batchReadyRef = useRef(false); // de-dupes the ready→pulse transition
  const ratio = progressInfo?.ratio ?? 0;
  const editing = editMsgIndex != null && editQuestion;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentQuestion, products, loadingProducts, cardsReady, skelLeaving]);

  // When a fresh batch of picks becomes ready: open the drawer the FIRST time
  // (so the user sees the reveal), and pulse the handle bar on later updates so a
  // change is noticed without dumping cards back into the conversation.
  useEffect(() => {
    if (!showInline) { batchReadyRef.current = false; return; }
    if (batchReadyRef.current) return;
    batchReadyRef.current = true;
    if (!autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setSheetOpen(true);
    } else {
      setBarPulse(true);
      const id = setTimeout(() => setBarPulse(false), 1500);
      return () => clearTimeout(id);
    }
  }, [showInline, products]);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const submit = (e) => {
    e.preventDefault();
    if (!freeText.trim()) return;
    onFreeText(freeText.trim());
    setFreeText('');
  };

  // "No preference" shortcut — records a neutral, unbounded answer so the user
  // is never stuck on a question they have no opinion on.
  const skipChoice = (qId) => ({ id: 'skip', label: t('chat.skip'), tags: [], min: null, max: null });
  const skip = () => onAnswer(currentQuestion.id, skipChoice(currentQuestion.id));

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
          {headerExtras && <div className="chat-header-spacer" aria-hidden="true" />}
          {headerExtras}
        </div>
      </header>

      <div className="chat-progress">
        <div className="chat-progress-bar" style={{ width: `${ratio * 100}%` }} />
      </div>
      {progressInfo?.label && (
        <div className={'chat-progress-label tone-' + (progressInfo.tone || 'neutral')}>
          {progressInfo.label}
        </div>
      )}

      <div ref={scrollRef} className="chat-stream" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className="chat-msg-wrap">
            <ChatBubble
              role={m.role}
              layout={layout}
              onEdit={m.role === 'user' && onStartEdit ? () => onStartEdit(i) : null}
              editLabel={t('chat.editAnswer')}
            >
              {m.text}
            </ChatBubble>

            {/* In-place editor: appears right under the edited answer's bubble.
                Picking a new value replaces just this answer and keeps the rest. */}
            {editing && i === editMsgIndex && (
              <div className="chat-edit-panel">
                <div className="chat-edit-head">
                  <span className="chat-edit-q">{editQuestion.text}</span>
                  <button type="button" className="chat-edit-cancel" onClick={onCancelEdit} aria-label={t('auth.close')}>✕</button>
                </div>
                <ChoiceControl
                  question={editQuestion}
                  onAnswer={onApplyEdit}
                  onSkip={() => onApplyEdit(editQuestion.id, skipChoice(editQuestion.id))}
                />
              </div>
            )}
          </div>
        ))}

        {isTyping && !showInlineSkeleton && <TypingDots layout={layout} />}

        {!isTyping && onRetry && (
          <div className="chat-choices chat-retry-row">
            <button type="button" className="choice-chip choice-retry" onClick={onRetry}>
              <span aria-hidden="true">↻</span> {t('chat.retry')}
            </button>
          </div>
        )}

        {!isTyping && currentQuestion && (
          <ChoiceControl question={currentQuestion} onAnswer={onAnswer} onSkip={skip} />
        )}
      </div>

      {/* Mobile: results live in a bottom-sheet drawer. A handle bar above the
          input opens it; the conversation stream stays clean. */}
      {showResultsBar && (
        <button
          type="button"
          className={'chat-results-bar' + (barPulse ? ' is-pulse' : '') + (sheetOpen ? ' is-open' : '')}
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
        >
          <span className="chat-results-bar-ico" aria-hidden="true">🎁</span>
          <span className="chat-results-bar-text">
            {resultsLoading
              ? t('chat.resultsLoading')
              : t('chat.resultsReady', { n: Math.min(3, products.length) })}
          </span>
          <span className="chat-results-bar-caret" aria-hidden="true">⌃</span>
        </button>
      )}

      {showResultsBar && sheetOpen && (
        <div className="chat-sheet" role="dialog" aria-modal="true" aria-label={t('chat.mySelection')}>
          <div className="chat-sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="chat-sheet-panel">
            <button type="button" className="chat-sheet-grip" onClick={() => setSheetOpen(false)} aria-label={t('auth.close')} />
            <div className="chat-sheet-head">
              <h3 className="chat-sheet-title">{t('chat.mySelection')}</h3>
              <button type="button" className="chat-sheet-close" onClick={() => setSheetOpen(false)} aria-label={t('auth.close')}>✕</button>
            </div>
            <div className="chat-sheet-body">
              {resultsLoading ? (
                <div className="chat-products-list">
                  {[0, 1, 2].map((i) => (
                    <ProductSkeleton key={i} variant="link" delay={i * (skelLeaving ? CARD_OUT_STAGGER_MS : CARD_IN_STAGGER_MS)} leaving={skelLeaving} />
                  ))}
                </div>
              ) : (
                <div className="chat-products-list">
                  {products.slice(0, 3).map((p, i) => (
                    <ProductLinkCard key={p.id} product={p} rank={i + 1} budget={budget} onSelect={onSelectProduct} delay={i * CARD_IN_STAGGER_MS} />
                  ))}
                </div>
              )}
              {onShowOthers && !isTyping && viewingPastIndex === null && (
                <button type="button" className="show-others-btn show-others-chat" onClick={onShowOthers}>
                  <span aria-hidden="true">↻</span> {t('results.showOthers')}
                </button>
              )}
              {viewingPastIndex === null && pastCount > 0 && onViewPrevious && (
                <button type="button" className="show-others-btn show-others-chat" onClick={onViewPrevious}>
                  <span aria-hidden="true">◀</span> {t('results.viewPrevious')}
                </button>
              )}
              {viewingPastIndex !== null && onViewLatest && (
                <button type="button" className="show-others-btn show-others-chat" onClick={onViewLatest}>
                  {t('results.viewLatest')} <span aria-hidden="true">▶</span>
                </button>
              )}
              {viewingPastIndex !== null && viewingPastIndex < pastCount - 1 && onViewPrevious && (
                <button type="button" className="show-others-btn show-others-chat" onClick={onViewPrevious}>
                  <span aria-hidden="true">◀</span> {t('results.viewPrevious')}
                </button>
              )}
              {pastCount > 1 && viewingPastIndex !== pastCount - 1 && onViewFirst && (
                <button type="button" className="show-others-btn show-others-chat" onClick={onViewFirst}>
                  <span aria-hidden="true">⏮</span> {t('results.viewFirst')}
                </button>
              )}
              {guide && onOpenGuide && (
                <button type="button" className="results-guide-link results-guide-chat" onClick={() => onOpenGuide(guide.slug)}>
                  {t('results.guideCta', { title: guide.title })}
                </button>
              )}
              {currentQuestion && (
                <div className="chat-products-hint">{t('chat.refineHint')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <form className="chat-input" onSubmit={submit}>
        {!isTyping && onRecommendNow && !showInline && (
          <button
            type="button"
            className="recommend-now-btn"
            onClick={onRecommendNow}
            title={t('chat.recommendNow')}
            aria-label={t('chat.recommendNow')}
          >
            <span aria-hidden="true">✦</span>
          </button>
        )}
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
