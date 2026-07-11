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
            <span className="chat-edit-pencil" aria-hidden="true">✎</span>
            {children}
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
        <span className="chat-edit-pencil" aria-hidden="true">✎</span>
        <div className="chat-bubble-text">{children}</div>
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

export default function ChatPanel({ messages, currentQuestion, onAnswer, onFreeText, onRestart, onHome, onOpenHistory, onStartEdit, onCancelEdit, onApplyEdit, editMsgIndex = null, editQuestion = null, onRetry = null, onShowOthers = null, onRecommendNow = null, guide = null, onOpenGuide = null, budget = null, isTyping, layout, progressInfo, products = [], onSelectProduct, inlineProducts = false, batchId = 0, loadingProducts = false, cardsReady = true, skelLeaving = false, pastCount = 0, viewingPastIndex = null, onViewPrevious = null, onViewNext = null, onViewLatest = null, onViewFirst = null, headerExtras = null }) {
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
  // Batch navigation (drawer arrows): older ◀ available while a previous batch
  // exists; newer ▶ available while viewing a past batch.
  const canViewPrev = pastCount > 0 && (viewingPastIndex === null || viewingPastIndex < pastCount - 1);
  const canViewNext = viewingPastIndex !== null;
  const [sheetOpen, setSheetOpen] = useState(false);
  const prevBatchRef = useRef(0); // last batch id we opened the drawer for
  // Drag-to-dismiss the drawer (swipe the grip/header down). Tracks a live drag
  // offset; releasing past a threshold — or a small tap — closes it, otherwise it
  // snaps back. Pointer events cover touch + mouse.
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startY: 0, active: false, moved: 0, dy: 0 });
  const onDragStart = (e) => {
    dragRef.current = { startY: e.clientY, active: true, moved: 0, dy: 0 };
    setDragging(true);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.dy = dy;
    dragRef.current.moved = Math.max(dragRef.current.moved, dy);
    setDragY(dy);
  };
  const onDragEnd = () => {
    if (!dragRef.current.active) return;
    const { dy, moved } = dragRef.current;
    dragRef.current.active = false;
    setDragging(false);
    setDragY(0);
    if (dy > 110 || moved < 6) setSheetOpen(false); // dragged far enough, or a tap
  };
  const ratio = progressInfo?.ratio ?? 0;
  const editing = editMsgIndex != null && editQuestion;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentQuestion, products, loadingProducts, cardsReady, skelLeaving]);

  // Open the drawer every time a NEW batch is loaded (batchId bumps in App's
  // loadProducts), so the user is always shown the fresh proposals — even when
  // products were already on screen (in that case showInline never dips, so we
  // key off the batch id instead). Enrichment updates keep the same id → no reopen.
  useEffect(() => {
    if (!inlineProducts || !batchId) return;
    if (batchId === prevBatchRef.current) return;
    prevBatchRef.current = batchId;
    setSheetOpen(true);
  }, [batchId, inlineProducts]);

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
                  <div className="chat-edit-headmain">
                    <span className="chat-edit-eyebrow"><span aria-hidden="true">✎</span> {t('chat.editAnswer')}</span>
                    <span className="chat-edit-q">{editQuestion.text}</span>
                  </div>
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

      {/* "See my selection" shortcut — pinned at the bottom of the chat area
          (below the scrolling stream), left-aligned. */}
      {onRecommendNow && (
        <div className="recommend-now-row">
          <button
            type="button"
            className="recommend-now-btn"
            onClick={onRecommendNow}
            disabled={isTyping}
            title={t('chat.recommendNow')}
          >
            <span aria-hidden="true">✦</span>
            <span className="recommend-now-label">{t('chat.recommendNowShort')}</span>
          </button>
        </div>
      )}

      {/* Mobile: results live in a bottom-sheet drawer. A handle bar above the
          input opens it; the conversation stream stays clean. */}
      {showResultsBar && (
        <button
          type="button"
          className={'chat-results-bar' + (sheetOpen ? ' is-open' : '')}
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
        >
          <span className="chat-results-bar-ico" aria-hidden="true">
            {loadingProducts ? <span className="chat-others-spinner" /> : '💡'}
          </span>
          <span className="chat-results-bar-text">
            {loadingProducts ? t('chat.resultsLoading') : t('chat.myProposals')}
          </span>
          <span className="chat-results-bar-caret" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 11.25 9 6.75l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}

      {showResultsBar && sheetOpen && (
        <div className="chat-sheet" role="dialog" aria-modal="true" aria-label={t('chat.mySelection')}>
          <div className="chat-sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div
            className={'chat-sheet-panel' + (dragging ? ' is-dragging' : '')}
            style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
          >
            {/* Grip + title double as the drag handle: swipe down (or tap) to
                lower/close the drawer — no explicit ✕ needed. */}
            <div
              className="chat-sheet-drag"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              <div className="chat-sheet-grip" aria-hidden="true" />
              <div className="chat-sheet-head">
                <h3 className="chat-sheet-title">{t('chat.mySelection')}</h3>
              </div>
            </div>

            {/* Navigation row under the title: browse batches with the arrows
                (older ◀ left / newer ▶ right); ask for a fresh set in the middle. */}
            <div className="chat-sheet-nav">
              <button
                type="button"
                className="chat-sheet-nav-arrow"
                onClick={onViewPrevious}
                disabled={!onViewPrevious || !canViewPrev}
                aria-label={t('results.viewPrevious')}
                title={t('results.viewPrevious')}
              >
                ◀
              </button>
              {onShowOthers && viewingPastIndex === null ? (
                <button
                  type="button"
                  className={'chat-sheet-nav-others' + (loadingProducts ? ' is-loading' : '')}
                  onClick={onShowOthers}
                  disabled={isTyping || loadingProducts}
                >
                  {loadingProducts
                    ? <span className="chat-others-spinner" aria-hidden="true" />
                    : <span aria-hidden="true">↻</span>}
                  {t('results.showOthers')}
                </button>
              ) : (
                <span className="chat-sheet-nav-others is-empty" aria-hidden="true" />
              )}
              <button
                type="button"
                className="chat-sheet-nav-arrow"
                onClick={onViewNext}
                disabled={!onViewNext || !canViewNext}
                aria-label={t('results.viewLatest')}
                title={t('results.viewLatest')}
              >
                ▶
              </button>
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
              {guide && onOpenGuide && (
                <button type="button" className="results-guide-link results-guide-chat" onClick={() => onOpenGuide(guide.slug)}>
                  {t('results.guideCta', { title: guide.title })}
                </button>
              )}
            </div>

            {/* Bottom-right: close the drawer and go back to answering. */}
            <div className="chat-sheet-foot">
              <button type="button" className="chat-sheet-continue" onClick={() => setSheetOpen(false)}>
                {t('chat.continueChat')} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
