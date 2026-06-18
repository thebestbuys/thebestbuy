import { useEffect, useMemo, useRef, useState } from "react";
import { askAI, enrichProduct } from "../lib/askAI.js";
import { useAuth } from "../lib/auth.jsx";
import { LANGS, useI18n } from "../lib/i18n.jsx";
import {
  deleteConversation,
  deriveTitle,
  formatRelative,
  listConversations,
  newConversationId,
  saveConversation,
} from "../lib/history.js";
import { listSelections, removeSelection } from "../lib/selections.js";
import { getProfile, profileToPrompt, saveProfile } from "../lib/profile.js";
import { getMode, setMode as setThemeMode } from "../lib/theme.js";
import { GIFT_EMPTY, giftToPrompt, giftTitle, encodeGiftShare } from "../lib/gift.js";
import { listRecipients, removeRecipient, saveRecipient } from "../lib/recipients.js";
import {
  searchUsers,
  sendFriendRequest,
  listIncomingRequests,
  listFriends,
  respondFriendRequest,
  removeFriend,
  getAccessToken,
} from "../lib/cloud.js";

// Which search variant to ship: 'A' = Premium Search, 'B' = Hey-Jordan Hub.
const VARIANT = "B";

const CATEGORY_KEYWORDS = {
  phone: ["phone", "iphone", "smartphone", "mobile", "téléphone", "telephone", "pixel"],
  laptop: ["laptop", "macbook", "pc", "notebook", "ultrabook", "ordinateur", "gaming", "computer"],
  headphones: ["headphone", "headphones", "earbud", "earbuds", "airpod", "airpods", "casque", "écouteur", "ecouteur", "audio", "wireless"],
};

function detectCategory(query) {
  const q = (query || "").toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => q.includes(k))) return cat;
  }
  return null;
}

// Palette driven by CSS variables (defined light in styles.css :root and dark in
// theme.js DARK_EXTRA) so the mobile app follows the app-wide light/dark theme.
// NB: CSS var() does not resolve in SVG presentation attributes — icons below
// apply the colour via inline `style` + `currentColor`.
const BB = {
  coral: "var(--m-coral)",
  coralDeep: "var(--m-coral-deep)",
  amber: "var(--m-amber)",
  cream: "var(--m-cream)",
  paper: "var(--m-paper)",
  ink: "var(--m-ink)",
  inkSoft: "var(--m-ink-soft)",
  inkMute: "var(--m-ink-mute)",
  line: "var(--m-line)",
  chipBg: "var(--m-chip-bg)",
  chipBgHov: "var(--m-chip-bg-hov)",
  bubbleAi: "var(--m-bubble-ai)",
  display: '"Quicksand", "Nunito", system-ui, sans-serif',
  body: '"Nunito", "Quicksand", system-ui, sans-serif',
};

// Oraklia wordmark — same font (Outfit) and accent colour as the desktop logo
// (defined as the global --accent CSS variable in styles.css).
function Logo({ size = 30, weight = 700 }) {
  return (
    <div
      style={{
        fontFamily: '"Outfit", system-ui, sans-serif',
        fontWeight: weight,
        fontSize: size,
        letterSpacing: -size * 0.02,
        color: "var(--accent)",
        lineHeight: 1,
      }}
    >
      Oraklia
    </div>
  );
}

function firstNameOf(user) {
  return user?.given_name || user?.name?.split(/\s+/)[0] || "";
}

const HeartIcon = ({ size = 18, color = BB.ink, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ color }}>
    <path
      d="M9 15.4S2.4 11.3 2.4 6.8A3.35 3.35 0 0 1 9 5.1 3.35 3.35 0 0 1 15.6 6.8C15.6 11.3 9 15.4 9 15.4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={filled ? "currentColor" : "none"}
    />
  </svg>
);

// Compact FR | EN toggle for the mobile header.
function LangPill() {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label="Langue"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--m-card)",
        border: `1px solid ${BB.line}`,
        borderRadius: 999,
        padding: 2,
        gap: 2,
      }}
    >
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            style={{
              appearance: "none",
              border: 0,
              cursor: "pointer",
              borderRadius: 999,
              padding: "3px 8px",
              fontFamily: BB.body,
              fontSize: 11,
              fontWeight: 700,
              background: active ? BB.coral : "transparent",
              color: active ? "#fff" : BB.inkMute,
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

const SearchIcon = ({ size = 18, color = BB.inkMute }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ color }}>
    <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M13.5 13.5L17 17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const BackIcon = ({ size = 20, color = BB.ink }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ color }}>
    <path
      d="M12.5 4L6.5 10l6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const SparkleIcon = ({ size = 14, color = BB.coral }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ color }}>
    <path
      d="M7 1.5l1.3 3.7L12 6.5l-3.7 1.3L7 11.5 5.7 7.8 2 6.5l3.7-1.3L7 1.5z"
      fill="currentColor"
    />
    <circle cx="11.5" cy="2.5" r="0.8" fill="currentColor" />
    <circle cx="2" cy="11.5" r="0.6" fill="currentColor" />
  </svg>
);
const PersonIcon = ({ size = 18, color = BB.inkSoft }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ color }}>
    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3.5 15c.9-2.7 3-4.2 5.5-4.2s4.6 1.5 5.5 4.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const MicIcon = ({ size = 18, color = BB.inkSoft }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ color }}>
    <rect x="7" y="3" width="6" height="10" rx="3" fill="currentColor" />
    <path
      d="M4 10a6 6 0 0012 0M10 16v2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

function Chip({ children, onClick, variant = "soft", icon }) {
  const styles = {
    soft: { bg: BB.chipBg, fg: BB.ink, border: "transparent" },
    outline: { bg: "var(--m-card)", fg: BB.ink, border: BB.line },
    primary: { bg: BB.coral, fg: "#fff", border: "transparent" },
  }[variant];
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        color: styles.fg,
        padding: "8px 14px",
        borderRadius: 999,
        fontFamily: BB.body,
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "transform 0.12s, background 0.15s",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon}
      {children}
    </button>
  );
}

function ProductCard({ product }) {
  const brand = product?.brand || "";
  const model = product?.model || "";
  const verified = !!product?.amazon_verified;
  const price = product?.price;
  // Only trust rating/reviews/image when they come from a real Amazon result.
  const rating = verified ? (product?.rating ?? null) : null;
  const reviews = verified ? (product?.reviews ?? null) : null;
  const why = product?.why;
  // Indicative price range for non-verified (Gemini) estimates.
  const roundNice = (v) => (v >= 1000 ? Math.round(v / 50) * 50 : v >= 100 ? Math.round(v / 10) * 10 : Math.round(v / 5) * 5);
  const priceLabel = price == null
    ? null
    : verified
      ? `${price.toLocaleString("fr-FR")} €`
      : `≈ ${roundNice(price * 0.9).toLocaleString("fr-FR")} – ${roundNice(price * 1.1).toLocaleString("fr-FR")} €`;
  return (
    <div
      style={{
        background: "var(--m-card)",
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${BB.line}`,
        marginTop: 4,
        boxShadow: "0 2px 8px rgba(70,30,10,0.04)",
      }}
    >
      <div
        style={{
          height: 130,
          position: "relative",
          background: `linear-gradient(135deg, ${BB.cream}, ${BB.chipBg})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {verified && product?.image_url ? (
          <img
            src={product.image_url}
            alt={model}
            style={{ maxHeight: 110, maxWidth: "90%", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))" }}
          />
        ) : (
          <div style={{ fontFamily: BB.body, fontSize: 13, fontWeight: 700, color: BB.inkMute, background: "rgba(255,255,255,0.85)", padding: "6px 10px", borderRadius: 8, textAlign: "center" }}>
            {[brand, model].filter(Boolean).join(" ") || "Produit"}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: BB.coral,
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <SparkleIcon size={10} color="#fff" /> AI pick
        </div>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontSize: 11,
            color: BB.inkMute,
            fontWeight: 600,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          {brand}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: BB.ink,
            marginTop: 2,
            lineHeight: 1.25,
          }}
        >
          {model}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            fontSize: 11,
            color: BB.inkSoft,
          }}
        >
          {rating != null ? (
            <>
              <span style={{ color: BB.amber }}>★★★★★</span>
              <span>{rating.toFixed(1)}{reviews != null ? ` · ${(reviews / 1000).toFixed(1)}k reviews` : ''}</span>
            </>
          ) : why ? (
            <span style={{ fontStyle: "italic", fontSize: 11 }}>{why}</span>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <div>
            {priceLabel && (
              <span style={{ fontSize: verified ? 18 : 15, fontWeight: verified ? 800 : 600, color: verified ? BB.ink : BB.inkSoft }}>
                {priceLabel}
              </span>
            )}
            {!verified && priceLabel && (
              <div style={{ fontSize: 10, color: BB.inkMute, fontStyle: "italic", marginTop: 1 }}>
                Estimation · prix réel sur Amazon
              </div>
            )}
          </div>
          <button
            onClick={() => product?.amazon_url && window.open(product.amazon_url, '_blank', 'noopener,noreferrer')}
            disabled={!product?.amazon_url}
            style={{
              appearance: "none",
              border: 0,
              background: product?.amazon_url ? BB.ink : BB.line,
              color: product?.amazon_url ? "#fff" : BB.inkMute,
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12,
              fontFamily: BB.body,
              cursor: product?.amazon_url ? "pointer" : "default",
            }}
          >
            Voir sur Amazon →
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatScreen({ query, onBack, accent = BB.coral, convoId, restore, gift: giftProp }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const gift = giftProp || restore?.gift || null;
  const category = useMemo(
    () => (gift ? "gift" : restore?.category || detectCategory(query)),
    [query, restore, gift],
  );
  const giftOpener = gift ? giftTitle(gift, lang) : "";
  const [messages, setMessages] = useState(() => {
    if (restore?.messages?.length) return restore.messages;
    if (gift) return [{ role: "user", text: giftOpener }];
    return query ? [{ role: "user", text: query }] : [];
  });
  const [preferences, setPreferences] = useState({
    tags: [],
    budget_max: null,
    budget_min: null,
  });
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(Boolean(restore?.done));
  const [feedback, setFeedback] = useState(null);
  const [input, setInput] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState(
    Array.isArray(restore?.recommendedProducts) ? restore.recommendedProducts : [],
  );
  const scrollRef = useRef(null);
  const initRan = useRef(false);

  const runTurn = async (history) => {
    setTyping(true);
    try {
      const result = await askAI({
        messages: history,
        category,
        profile: gift ? "" : profileToPrompt(getProfile(user?.sub), lang),
        gift: gift ? giftToPrompt(gift, lang) : "",
        surprise: !!gift?.surprise,
        friendId: gift?.friendId || "",
        token: gift?.friendId ? getAccessToken() : "",
        conversationId: convoId,
      });
      const reply = result?.reply || "…";
      const chips =
        result?.action === "ask" &&
        Array.isArray(result?.question?.choices) &&
        result.question.choices.length
          ? result.question.choices.map((c) => c.label)
          : undefined;
      const isRecommend = result?.action === "recommend";
      if (isRecommend && Array.isArray(result.products) && result.products.length) {
        const base = result.products.map((p) => ({ ...p, category }));
        setRecommendedProducts(base);
        base.forEach((p, i) => {
          enrichProduct(p).then((enriched) => {
            setRecommendedProducts((prev) => {
              const next = [...prev];
              next[i] = enriched;
              return next;
            });
          });
        });
      }
      const aiMsg = {
        role: "ai",
        text: reply,
        chips,
        card: isRecommend,
        actions: isRecommend ? ["Parfait, merci !", "Continuer la recherche"] : undefined,
      };
      setMessages((m) => [...m, aiMsg]);
      if (result?.preferences && typeof result.preferences === "object") {
        setPreferences(result.preferences);
      }
      if (isRecommend) setDone(true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `Désolé — le service de recommandation n'a pas répondu (${e.message}). Réessayez ou redémarrez.`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;
    if (restore?.messages?.length) return; // restored — skip auto-run
    const initial = gift
      ? [{ role: "user", text: giftOpener }]
      : query
      ? [{ role: "user", text: query }]
      : [{ role: "user", text: "I'm looking for a product, can you help?" }];
    runTurn(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!convoId || messages.length === 0) return;
    const normalized = messages.map((m) =>
      m.role === "user" ? m : { ...m, role: "bot" },
    );
    saveConversation(user?.sub, {
      id: convoId,
      title: gift ? giftTitle(gift, lang) : deriveTitle({ initialQuery: query, messages: normalized }),
      category,
      initialQuery: query,
      messages: normalized,
      recommendedProducts,
      done,
      gift,
    });
  }, [convoId, messages, recommendedProducts, done, category, query, gift, lang, user?.sub]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const sendUser = (text) => {
    if (typing || done || !text.trim()) return;
    const next = [...messages, { role: "user", text: text.trim() }];
    setMessages(next);
    runTurn(next);
  };

  const handleChip = (label) => sendUser(label);
  const handleAction = (label) => {
    setFeedback(label);
    if (label.toLowerCase().includes("keep")) {
      setDone(false);
      sendUser("Let's keep looking for other options.");
    }
  };
  const handleSubmitInput = (e) => {
    e.preventDefault();
    sendUser(input);
    setInput("");
  };

  const shareGift = async () => {
    const items = recommendedProducts.slice(0, 3).map((p) => ({
      b: p.brand,
      m: p.model,
      p: p.price ?? null,
      u: p.amazon_url || `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.brand} ${p.model}`)}&tag=oraklia123-21`,
      i: p.image_url || null,
      s: p.score ?? null,
    }));
    if (!items.length) return;
    const payload = { r: gift?.relationship || "", o: gift?.occasion || "", items };
    const url = `${window.location.origin}${window.location.pathname}?share=${encodeGiftShare(payload)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Oraklia", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* cancelled */
    }
  };

  const showInputBar = !done;

  const topProduct = recommendedProducts[0] ?? null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: BB.paper,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid ${BB.line}`,
          background: "var(--m-card)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            appearance: "none",
            border: 0,
            background: "transparent",
            padding: 6,
            borderRadius: 999,
            cursor: "pointer",
            display: "flex",
          }}
        >
          <BackIcon />
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accent}, ${BB.amber})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            fontFamily: BB.display,
            position: "relative",
          }}
        >
          <SparkleIcon size={16} color="#fff" />
          <span
            style={{
              position: "absolute",
              right: -1,
              bottom: -1,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#3CCB7F",
              border: "2px solid #fff",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: BB.ink,
              lineHeight: 1.1,
            }}
          >
            {t('chat.assistant')}
          </div>
          <div style={{ fontSize: 11, color: "#3CCB7F", fontWeight: 600 }}>
            {t('m.assistantStatus')}
          </div>
        </div>
        {gift && recommendedProducts.length > 0 && (
          <button
            type="button"
            onClick={shareGift}
            aria-label={t('gift.share')}
            title={t('gift.share')}
            style={{
              appearance: "none",
              border: `1px solid ${BB.line}`,
              background: "var(--m-card)",
              borderRadius: 999,
              padding: "6px 11px",
              fontSize: 13,
              fontWeight: 700,
              color: BB.coralDeep,
              cursor: "pointer",
              fontFamily: BB.body,
            }}
          >
            🔗
          </button>
        )}
        <Logo size={16} />
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 14px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.map((m, i) => (
          <Bubble
            key={i}
            msg={m}
            accent={accent}
            product={m.card ? topProduct : null}
            onChip={(c) => i === messages.length - 1 && handleChip(c)}
            onAction={(a) => i === messages.length - 1 && handleAction(a)}
            interactive={i === messages.length - 1 && !typing}
          />
        ))}
        {typing && <TypingDots />}
        {feedback && <FeedbackToast text={feedback} />}
      </div>

      {showInputBar && (
        <form
          onSubmit={handleSubmitInput}
          style={{
            padding: "10px 12px 12px",
            borderTop: `1px solid ${BB.line}`,
            background: "var(--m-card)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={typing ? t('m.thinking') : t('m.typeMessage')}
            disabled={typing}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 999,
              border: 0,
              outline: "none",
              background: BB.cream,
              padding: "0 16px",
              color: BB.ink,
              fontSize: 13,
              fontFamily: BB.body,
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={typing || !input.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: 0,
              background: input.trim() && !typing ? BB.coral : BB.cream,
              color: input.trim() && !typing ? "#fff" : BB.inkMute,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !typing ? "pointer" : "default",
              transition: "background 0.15s",
            }}
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}

function Bubble({ msg, accent, product, onChip, onAction, interactive }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 6,
        animation: "bb-rise 0.28s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: isUser ? accent : BB.bubbleAi,
          color: isUser ? "#fff" : BB.ink,
          padding: "10px 14px",
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 6 : 18,
          borderBottomLeftRadius: isUser ? 18 : 6,
          fontSize: 13.5,
          lineHeight: 1.45,
          boxShadow: isUser ? `0 1px 0 ${BB.coralDeep}40` : "none",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.text}
      </div>
      {msg.card && (
        <div style={{ width: "88%", maxWidth: 280 }}>
          <ProductCard product={product} />
        </div>
      )}
      {msg.chips && interactive && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 2,
            maxWidth: "85%",
          }}
        >
          {msg.chips.map((c) => (
            <Chip key={c} variant="outline" onClick={() => onChip(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}
      {msg.actions && interactive && (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <Chip variant="primary" onClick={() => onAction(msg.actions[0])}>
            {msg.actions[0]}
          </Chip>
          <Chip variant="outline" onClick={() => onAction(msg.actions[1])}>
            {msg.actions[1]}
          </Chip>
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: BB.bubbleAi,
        padding: "12px 14px",
        borderRadius: 18,
        borderBottomLeftRadius: 6,
        display: "flex",
        gap: 4,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: BB.inkMute,
            animation: `bb-dot 1s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

function FeedbackToast({ text }) {
  const positive = text.toLowerCase().includes("perfect");
  return (
    <div
      style={{
        alignSelf: "center",
        marginTop: 8,
        background: positive ? "#3CCB7F" : BB.amber,
        color: positive ? "#fff" : BB.ink,
        padding: "10px 16px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 6,
        animation: "bb-rise 0.3s ease-out",
      }}
    >
      {positive ? "✓ Saved to your picks" : "↻ Refining recommendations…"}
    </div>
  );
}

function userInitials(user) {
  const src = (user?.name || user?.email || '').trim();
  if (!src) return '?';
  const parts = src.split(/[\s._@-]+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + second).toUpperCase() || src[0].toUpperCase();
}

function AccountAvatar({ onClick, size = 32, variant = "B" }) {
  const { user } = useAuth();
  const [broken, setBroken] = useState(false);
  const borderStyle =
    variant === "A"
      ? { background: BB.cream, border: 0 }
      : { background: "var(--m-card)", border: `1px solid ${BB.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={user ? "Compte" : "Se connecter"}
      style={{
        appearance: "none",
        padding: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: BB.ink,
        fontSize: size <= 32 ? 11 : 13,
        fontWeight: 700,
        fontFamily: BB.display,
        overflow: "hidden",
        ...borderStyle,
      }}
    >
      {user?.picture && !broken ? (
        <img
          src={user.picture}
          alt=""
          onError={() => setBroken(true)}
          referrerPolicy="no-referrer"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : user ? (
        userInitials(user)
      ) : (
        <PersonIcon size={size <= 32 ? 17 : 19} color={BB.inkSoft} />
      )}
    </button>
  );
}

// Appearance (theme) switch — Système / Clair / Sombre.
function AppearanceSeg() {
  const { t } = useI18n();
  const [mode, setMode] = useState(getMode);
  const modes = ["system", "light", "dark"];
  const change = (m) => {
    setThemeMode(m);
    setMode(m);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: BB.inkSoft, marginBottom: 6 }}>
        {t("appearance.label")}
      </div>
      <div
        role="radiogroup"
        style={{
          display: "flex",
          gap: 3,
          padding: 3,
          background: BB.chipBg,
          borderRadius: 12,
        }}
      >
        {modes.map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => change(m)}
              style={{
                flex: 1,
                appearance: "none",
                border: 0,
                background: active ? BB.paper : "transparent",
                color: active ? BB.coralDeep : BB.inkSoft,
                fontFamily: BB.body,
                fontSize: 12.5,
                fontWeight: 700,
                padding: "8px 4px",
                borderRadius: 9,
                cursor: "pointer",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}
            >
              {t("appearance." + m)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AuthSheet({ open, onClose, onOpenSelections, onOpenProfile, onOpenFriends }) {
  const { user, ready, clientId, isNative, signInNative, renderButton, signOut, lastError } = useAuth();
  const { t } = useI18n();
  const btnRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!isNative && open && !user && ready && btnRef.current) {
      renderButton(btnRef.current, { width: 260 });
    }
  }, [open, user, ready, renderButton, isNative]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,12,8,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "bb-rise 0.22s ease-out",
      }}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: BB.paper,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "12px 22px 28px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
          animation: "bb-rise 0.28s ease-out",
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 4,
            background: BB.line,
            margin: "0 auto 14px",
          }}
        />

        {user ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "4px 0 14px",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: BB.chipBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: BB.ink,
                  fontFamily: BB.display,
                  fontSize: 16,
                }}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  userInitials(user)
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: BB.ink,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name || user.email}
                </div>
                {user.email && user.name && (
                  <div
                    style={{
                      fontSize: 12,
                      color: BB.inkSoft,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSelections?.();
              }}
              style={{
                width: "100%",
                appearance: "none",
                border: `1px solid ${BB.line}`,
                background: "var(--m-card)",
                color: BB.ink,
                padding: "12px 14px",
                borderRadius: 14,
                fontWeight: 600,
                fontFamily: BB.body,
                fontSize: 13,
                marginBottom: 8,
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {t('auth.mySelections')}
              <span aria-hidden="true" style={{ color: BB.inkMute }}>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile?.();
              }}
              style={{
                width: "100%",
                appearance: "none",
                border: `1px solid ${BB.line}`,
                background: "var(--m-card)",
                color: BB.ink,
                padding: "12px 14px",
                borderRadius: 14,
                fontWeight: 600,
                fontFamily: BB.body,
                fontSize: 13,
                marginBottom: 8,
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {t('auth.myProfile')}
              <span aria-hidden="true" style={{ color: BB.inkMute }}>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFriends?.();
              }}
              style={{
                width: "100%",
                appearance: "none",
                border: `1px solid ${BB.line}`,
                background: "var(--m-card)",
                color: BB.ink,
                padding: "12px 14px",
                borderRadius: 14,
                fontWeight: 600,
                fontFamily: BB.body,
                fontSize: 13,
                marginBottom: 8,
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {t('auth.myFriends')}
              <span aria-hidden="true" style={{ color: BB.inkMute }}>→</span>
            </button>

            <AppearanceSeg />

            <button
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
              style={{
                width: "100%",
                appearance: "none",
                border: 0,
                background: BB.ink,
                color: "#fff",
                padding: "12px 14px",
                borderRadius: 14,
                fontWeight: 700,
                fontFamily: BB.body,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t('auth.signOut')}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                fontFamily: BB.display,
                fontSize: 22,
                fontWeight: 700,
                color: BB.ink,
                letterSpacing: -0.3,
              }}
            >
              {t('auth.welcome')}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: BB.inkSoft,
                lineHeight: 1.4,
              }}
            >
              {t('auth.sub')}
            </div>

            <div
              style={{
                marginTop: 22,
                display: "flex",
                justifyContent: "center",
                minHeight: 48,
              }}
            >
              {!clientId ? (
                <div
                  style={{
                    fontSize: 12,
                    color: BB.coralDeep,
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  La connexion Google n'est pas configurée.
                  <br />
                  Ajoutez <code>VITE_GOOGLE_CLIENT_ID</code> dans le{" "}
                  <code>.env</code>.
                </div>
              ) : isNative ? (
                <button
                  type="button"
                  onClick={signInNative}
                  disabled={!ready}
                  style={{
                    appearance: "none",
                    background: "var(--m-card)",
                    border: `1px solid ${BB.line}`,
                    borderRadius: 999,
                    padding: "10px 20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: BB.body,
                    fontSize: 14,
                    fontWeight: 600,
                    color: BB.ink,
                    cursor: ready ? "pointer" : "default",
                    opacity: ready ? 1 : 0.6,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.89c1.7-1.56 2.7-3.86 2.7-6.61z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.46-.8 5.94-2.18l-2.89-2.26c-.8.54-1.83.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.95v2.33A9 9 0 0 0 9 18z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.95 10.71A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.71V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3-2.33z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96l3 2.33C4.66 5.16 6.65 3.58 9 3.58z"
                    />
                  </svg>
                  {ready ? "Se connecter avec Google" : "Chargement…"}
                </button>
              ) : !ready ? (
                <div style={{ fontSize: 12, color: BB.inkMute }}>
                  Chargement…
                </div>
              ) : (
                <div ref={btnRef} />
              )}
            </div>

            {lastError && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  background: "#FDECE7",
                  border: `1px solid ${BB.coralDeep}33`,
                  borderRadius: 10,
                  fontSize: 11,
                  color: BB.coralDeep,
                  textAlign: "left",
                  lineHeight: 1.4,
                  fontFamily: "ui-monospace, monospace",
                  wordBreak: "break-word",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Erreur</div>
                {String(lastError)}
              </div>
            )}
            <div
              style={{
                marginTop: 18,
                fontSize: 11,
                color: BB.inkMute,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              En continuant vous acceptez nos conditions et notre politique de
              confidentialité.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HistorySheet({ open, onClose, onLoad }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    setItems(listConversations(user?.sub));
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, user?.sub]);

  if (!open) return null;

  const remove = (id, e) => {
    e.stopPropagation();
    deleteConversation(user?.sub, id);
    setItems((cur) => cur.filter((c) => c.id !== id));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,12,8,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "bb-rise 0.22s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "82vh",
          background: BB.paper,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "12px 0 18px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
          animation: "bb-rise 0.28s ease-out",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 4,
            background: BB.line,
            margin: "0 auto 10px",
          }}
        />
        <div
          style={{
            padding: "4px 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: BB.display,
                fontSize: 20,
                fontWeight: 700,
                color: BB.ink,
                letterSpacing: -0.2,
              }}
            >
              {t("history.title")}
            </div>
            <div style={{ fontSize: 12, color: BB.inkSoft, marginTop: 2 }}>
              {user ? t("history.subUser") : t("history.subGuest")}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("auth.close")}
            style={{
              appearance: "none",
              border: 0,
              background: BB.cream,
              color: BB.inkSoft,
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 14px 6px" }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: "30px 22px 40px",
                textAlign: "center",
                color: BB.inkSoft,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: 24, color: BB.coral, marginBottom: 8 }}>
                ✦
              </div>
              {t("history.emptyText")}
              <br />
              {t("history.emptySub")}
            </div>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 6,
                  background: "var(--m-card)",
                  border: `1px solid ${BB.line}`,
                  borderRadius: 14,
                  marginBottom: 8,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => {
                    onLoad(c);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    appearance: "none",
                    border: 0,
                    background: "transparent",
                    textAlign: "left",
                    padding: "12px 14px",
                    fontFamily: BB.body,
                    cursor: "pointer",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: BB.ink,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.title || t("history.conversation")}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: BB.inkSoft,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{formatRelative(c.updatedAt)}</span>
                    {Array.isArray(c.messages) && c.messages.length > 0 && (
                      <span>{t("history.messages", { n: c.messages.length })}</span>
                    )}
                    {c.done && (
                      <span style={{ color: "#3CCB7F", fontWeight: 700 }}>
                        {t("history.done")}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={(e) => remove(c.id, e)}
                  aria-label={t("history.delete")}
                  style={{
                    appearance: "none",
                    border: 0,
                    background: "transparent",
                    padding: "0 14px",
                    color: BB.inkMute,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSheet({ open, onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState(getProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(getProfile(user?.sub));
    setSaved(false);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, user?.sub]);

  if (!open) return null;

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    setForm(saveProfile(user?.sub, form));
    setSaved(true);
  };

  const fieldLabel = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: BB.ink,
    marginBottom: 6,
  };
  const fieldInput = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BB.line}`,
    borderRadius: 12,
    background: "var(--m-card)",
    color: BB.ink,
    fontFamily: BB.body,
    fontSize: 14,
    padding: "11px 13px",
    outline: "none",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,12,8,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "bb-rise 0.22s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          background: BB.paper,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "12px 22px 24px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
          animation: "bb-rise 0.28s ease-out",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 4,
            background: BB.line,
            margin: "0 auto 12px",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: BB.display,
                fontSize: 20,
                fontWeight: 700,
                color: BB.ink,
                letterSpacing: -0.2,
              }}
            >
              {t("profile.title")}
            </div>
            <div style={{ fontSize: 12, color: BB.inkSoft, marginTop: 2 }}>
              {t("profile.sub")}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("auth.close")}
            style={{
              appearance: "none",
              border: 0,
              background: BB.cream,
              color: BB.inkSoft,
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", minHeight: 0, paddingRight: 2 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 12px",
              marginBottom: 14,
            }}
          >
            <div>
              <label htmlFor="bb-profile-gender" style={fieldLabel}>
                {t("profile.gender")}
              </label>
              <select
                id="bb-profile-gender"
                value={form.gender}
                onChange={set("gender")}
                style={{ ...fieldInput, appearance: "none", cursor: "pointer" }}
              >
                <option value="">{t("profile.genderPlaceholder")}</option>
                <option value={t("profile.gender.female")}>{t("profile.gender.female")}</option>
                <option value={t("profile.gender.male")}>{t("profile.gender.male")}</option>
                <option value={t("profile.gender.other")}>{t("profile.gender.other")}</option>
                <option value={t("profile.gender.na")}>{t("profile.gender.na")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="bb-profile-age" style={fieldLabel}>
                {t("profile.age")}
              </label>
              <input
                id="bb-profile-age"
                type="number"
                inputMode="numeric"
                min="0"
                max="120"
                value={form.age}
                placeholder={t("profile.agePlaceholder")}
                onChange={set("age")}
                style={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="bb-profile-profession" style={fieldLabel}>
                {t("profile.profession")}
              </label>
              <input
                id="bb-profile-profession"
                type="text"
                value={form.profession}
                placeholder={t("profile.professionPlaceholder")}
                onChange={set("profession")}
                style={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="bb-profile-nationality" style={fieldLabel}>
                {t("profile.nationality")}
              </label>
              <input
                id="bb-profile-nationality"
                type="text"
                value={form.nationality}
                placeholder={t("profile.nationalityPlaceholder")}
                onChange={set("nationality")}
                style={fieldInput}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="bb-profile-address" style={fieldLabel}>
                {t("profile.address")}
              </label>
              <input
                id="bb-profile-address"
                type="text"
                value={form.address}
                placeholder={t("profile.addressPlaceholder")}
                onChange={set("address")}
                style={fieldInput}
              />
            </div>
          </div>

          <label htmlFor="bb-profile-bio" style={fieldLabel}>
            {t("profile.label")}
          </label>
          <textarea
            id="bb-profile-bio"
            value={form.bio}
            maxLength={600}
            rows={5}
            placeholder={t("profile.placeholder")}
            onChange={set("bio")}
            style={{
              ...fieldInput,
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: BB.inkSoft,
              margin: "8px 2px 14px",
              lineHeight: 1.45,
            }}
          >
            {t("profile.hint")}
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          style={{
            width: "100%",
            appearance: "none",
            border: 0,
            background: BB.ink,
            color: "#fff",
            padding: "13px 14px",
            borderRadius: 14,
            fontWeight: 700,
            fontFamily: BB.body,
            fontSize: 14,
            cursor: "pointer",
            marginTop: 4,
            flexShrink: 0,
          }}
        >
          {saved ? t("profile.saved") : t("profile.save")}
        </button>
      </div>
    </div>
  );
}

function SelectionsSheet({ open, onClose }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    setItems(listSelections(user?.sub));
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, user?.sub]);

  if (!open) return null;

  const remove = (id, e) => {
    e.stopPropagation();
    removeSelection(user?.sub, id);
    setItems((cur) => cur.filter((p) => p.id !== id));
  };

  const amazonUrl = (p) =>
    p.amazon_url ||
    `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.brand} ${p.model}`)}&tag=oraklia123-21`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,12,8,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "bb-rise 0.22s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "82vh",
          background: BB.paper,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "12px 0 18px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
          animation: "bb-rise 0.28s ease-out",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 4,
            background: BB.line,
            margin: "0 auto 10px",
          }}
        />
        <div
          style={{
            padding: "4px 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: BB.display,
                fontSize: 20,
                fontWeight: 700,
                color: BB.ink,
                letterSpacing: -0.2,
              }}
            >
              {t("selections.title")}
            </div>
            <div style={{ fontSize: 12, color: BB.inkSoft, marginTop: 2 }}>
              {user ? t("selections.subUser") : t("selections.subGuest")}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("auth.close")}
            style={{
              appearance: "none",
              border: 0,
              background: BB.cream,
              color: BB.inkSoft,
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 14px 6px" }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: "30px 22px 40px",
                textAlign: "center",
                color: BB.inkSoft,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: 24, color: BB.coral, marginBottom: 8 }}>♡</div>
              {t("selections.emptyText")}
              <br />
              {t("selections.emptySub")}
            </div>
          ) : (
            items.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--m-card)",
                  border: `1px solid ${BB.line}`,
                  borderRadius: 14,
                  marginBottom: 8,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: BB.cream,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: 16 }}>🛍️</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: BB.inkMute,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.3,
                    }}
                  >
                    {p.brand}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: BB.ink,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.model}
                  </div>
                  {p.price != null && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: BB.ink, marginTop: 2 }}>
                      {p.price.toLocaleString(locale)} €
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => window.open(amazonUrl(p), "_blank", "noopener,noreferrer")}
                    style={{
                      appearance: "none",
                      border: 0,
                      background: BB.coral,
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: BB.body,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("product.viewAmazon")}
                  </button>
                  <button
                    onClick={(e) => remove(p.id, e)}
                    aria-label={t("selections.remove")}
                    style={{
                      appearance: "none",
                      border: 0,
                      background: "transparent",
                      color: BB.inkMute,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SearchA({ onSubmit, onOpenAuth }) {
  const [q, setQ] = useState("");
  const suggestions = [
    "Wireless headphones",
    "Gaming laptop",
    "Coffee maker",
    "Running shoes",
    "Smart watch",
  ];
  const submit = (text) => onSubmit(text || q || "Wireless headphones");

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BB.paper,
        padding: "32px 22px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 64,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: BB.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" style={{ color: BB.ink }}>
            <path
              d="M2 4l6-3 6 3v6l-6 3-6-3V4z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <AccountAvatar size={36} variant="A" onClick={onOpenAuth} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Logo size={42} />
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: BB.inkSoft,
            fontWeight: 500,
            letterSpacing: 0.1,
          }}
        >
          Tell us what you want. We'll do the rest.
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{
          background: "var(--m-card)",
          border: `1.5px solid ${BB.line}`,
          borderRadius: 999,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 4px 14px rgba(70,30,10,0.05)",
        }}
      >
        <SearchIcon size={18} color={BB.inkSoft} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for?"
          style={{
            flex: 1,
            border: 0,
            outline: "none",
            background: "transparent",
            fontFamily: BB.body,
            fontSize: 14,
            fontWeight: 500,
            color: BB.ink,
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          style={{
            appearance: "none",
            border: 0,
            background: BB.coral,
            color: "#fff",
            width: 32,
            height: 32,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7h10M8 3l4 4-4 4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      <div style={{ marginTop: 22 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: BB.inkMute,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Try one
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {suggestions.map((s) => (
            <Chip
              key={s}
              variant="soft"
              onClick={() => submit(s.toLowerCase())}
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: BB.inkMute,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <SparkleIcon size={11} /> Powered by AI shopping assistant
      </div>
    </div>
  );
}

function SearchB({ onSubmit, onOpenAuth, onOpenHistory, onOpenSelections, onOpenGift, onOpenFriends, friendsOpen, onLoadConvo, recents }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const submit = (text) => onSubmit(text || q || t("suggestion.phone"));
  const name = firstNameOf(user);

  // Same 8 categories as the desktop home, localized via i18n.
  const suggestions = [
    { key: "suggestion.phone", emoji: "📱" },
    { key: "suggestion.laptop", emoji: "💻" },
    { key: "suggestion.tv", emoji: "📺" },
    { key: "suggestion.earbuds", emoji: "🎧" },
    { key: "suggestion.watch", emoji: "⌚" },
    { key: "suggestion.vacuum", emoji: "🧹" },
    { key: "suggestion.coffee", emoji: "☕" },
    { key: "suggestion.speaker", emoji: "🔊" },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, ${BB.cream} 0%, ${BB.paper} 40%)`,
        padding: "20px 18px 18px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Logo size={24} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LangPill />
          <button
            type="button"
            onClick={onOpenSelections}
            aria-label={t("auth.mySelections")}
            title={t("auth.mySelections")}
            style={{
              appearance: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${BB.line}`,
              background: "var(--m-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <HeartIcon size={16} color={BB.coral} />
          </button>
          <MobileBell onOpen={onOpenFriends} pingKey={friendsOpen} />
          <AccountAvatar size={32} variant="B" onClick={onOpenAuth} />
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div
          style={{
            fontFamily: BB.display,
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.15,
            color: BB.ink,
            letterSpacing: -0.6,
          }}
        >
          {name ? t("m.greetingLead", { name }) : t("m.greetingLeadAnon")}
          <br />
          <span style={{ color: BB.coral }}>{t("m.greetingHighlight")}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          background: "var(--m-card)",
          borderRadius: 22,
          border: `1px solid ${BB.line}`,
          padding: 14,
          boxShadow: "0 8px 24px rgba(70,30,10,0.06)",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: BB.cream,
            borderRadius: 14,
            padding: "10px 12px",
          }}
        >
          <SearchIcon size={16} color={BB.inkSoft} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            style={{
              flex: 1,
              border: 0,
              outline: "none",
              background: "transparent",
              fontFamily: BB.body,
              fontSize: 13.5,
              fontWeight: 500,
              color: BB.ink,
              minWidth: 0,
            }}
          />
          <MicIcon size={16} />
        </form>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: BB.inkSoft,
            fontWeight: 600,
          }}
        >
          <SparkleIcon size={11} />
          {t("m.searchHint")}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenGift}
        style={{
          marginTop: 14,
          width: "100%",
          appearance: "none",
          border: `1px solid ${BB.coral}`,
          background: BB.chipBg,
          color: BB.coralDeep,
          borderRadius: 16,
          padding: "13px 16px",
          fontFamily: BB.body,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 16 }}>🎁</span>
        {t("home.gift")}
      </button>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BB.ink, marginBottom: 10 }}>
          {t("m.suggestions")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {suggestions.map((s) => {
            const label = t(s.key);
            return (
              <Chip
                key={s.key}
                variant="soft"
                icon={<span style={{ fontSize: 14 }}>{s.emoji}</span>}
                onClick={() => submit(label)}
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: BB.ink }}>
            {t("home.history")}
          </div>
          {recents.length > 0 && (
            <button
              type="button"
              onClick={onOpenHistory}
              style={{
                appearance: "none",
                border: 0,
                background: "transparent",
                padding: 0,
                fontSize: 11,
                color: BB.inkMute,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: BB.body,
              }}
            >
              {t("m.seeAll")}
            </button>
          )}
        </div>
        {recents.length === 0 ? (
          <div
            style={{
              background: "var(--m-card)",
              borderRadius: 14,
              padding: "14px 14px",
              border: `1px dashed ${BB.line}`,
              fontSize: 12,
              color: BB.inkSoft,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {t("m.noRecents")}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              margin: "0 -18px",
              padding: "2px 18px 8px",
              scrollbarWidth: "none",
            }}
          >
            {recents.map((c) => (
              <div
                key={c.id}
                style={{
                  width: 210,
                  flexShrink: 0,
                  background: "var(--m-card)",
                  borderRadius: 14,
                  padding: 12,
                  border: `1px solid ${BB.line}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: BB.chipBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    🕓
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: BB.ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.title || "Conversation"}
                    </div>
                    <div style={{ fontSize: 10.5, color: BB.inkMute, marginTop: 2 }}>
                      {formatRelative(c.updatedAt)}
                      {c.done ? " · ✓" : ""}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onLoadConvo(c)}
                  style={{
                    appearance: "none",
                    border: 0,
                    background: BB.coral,
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: BB.body,
                    width: "100%",
                  }}
                >
                  {t("m.resume")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}

function friendInitials(name = "") {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
}

// Bell with a badge counting pending friend requests; opens the Friends sheet.
function MobileBell({ onOpen, pingKey }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let active = true;
    const load = () =>
      listIncomingRequests()
        .then((r) => active && setCount(Array.isArray(r) ? r.length : 0))
        .catch(() => {});
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      clearInterval(id);
    };
  }, [user, pingKey]);
  if (!user) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={"Demandes reçues"}
      style={{ position: "relative", appearance: "none", width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BB.line}`, background: "var(--m-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ color: BB.inkSoft }}>
        <path d="M9 2.4a4 4 0 0 0-4 4c0 3-1.1 4.2-1.6 4.7-.25.25-.07.65.28.65h10.64c.35 0 .53-.4.28-.65C14.1 10.6 13 9.4 13 6.4a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M7.5 14a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px", boxSizing: "border-box", borderRadius: 999, background: "#e5484d", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${BB.paper}` }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// Small round avatar for friend chips (photo, with initials fallback).
function FriendChipAva({ name, url, size = 20 }) {
  const [broken, setBroken] = useState(false);
  const base = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };
  if (url && !broken) {
    return <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} style={{ ...base, objectFit: "cover" }} />;
  }
  return (
    <span style={{ ...base, background: BB.chipBg, color: BB.coralDeep, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 700 }}>
      {friendInitials(name)}
    </span>
  );
}

// Mobile "Mes amis": search by name, send/accept requests, see friends.
function FriendsSheet({ open, onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const qRef = useRef("");
  qRef.current = q;

  const refresh = () => {
    listIncomingRequests().then(setIncoming);
    listFriends().then(setFriends);
  };

  useEffect(() => {
    if (!open) return;
    setQ("");
    setResults([]);
    setSearched(false);
    refresh();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const id = setTimeout(async () => {
      const r = await searchUsers(term);
      if (qRef.current.trim() === term) {
        setResults(r);
        setSearched(true);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q, open]);

  if (!open) return null;

  const add = async (u) => {
    setResults((cur) => cur.map((r) => (r.user_id === u.user_id ? { ...r, status: "pending" } : r)));
    const { ok } = await sendFriendRequest(u.user_id);
    if (!ok) setResults((cur) => cur.map((r) => (r.user_id === u.user_id ? { ...r, status: null } : r)));
  };
  const respond = async (id, accept) => {
    setIncoming((cur) => cur.filter((r) => r.id !== id));
    await respondFriendRequest(id, accept);
    refresh();
  };
  const remove = async (f) => {
    if (!window.confirm(t("friends.removeConfirm", { name: f.display_name }))) return;
    setFriends((cur) => cur.filter((x) => x.user_id !== f.user_id));
    await removeFriend(f.user_id);
    refresh();
  };

  const ava = (name, url) =>
    url ? (
      <img src={url} alt="" referrerPolicy="no-referrer" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    ) : (
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: BB.chipBg, color: BB.coralDeep, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{friendInitials(name)}</span>
    );
  const row = { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${BB.line}`, borderRadius: 12, background: "var(--m-card)", marginBottom: 6 };
  const nameStyle = { flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: BB.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const btn = { appearance: "none", border: 0, background: BB.coral, color: "#fff", fontFamily: BB.body, fontSize: 12.5, fontWeight: 700, padding: "6px 13px", borderRadius: 999, cursor: "pointer", flexShrink: 0 };
  const ghost = { ...btn, background: "transparent", border: `1px solid ${BB.line}`, color: BB.inkSoft };
  const tag = (muted) => ({ flexShrink: 0, fontSize: 11, fontWeight: 700, color: muted ? BB.inkMute : BB.coralDeep, background: muted ? BB.cream : BB.chipBg, padding: "3px 10px", borderRadius: 999 });
  const sect = { fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: BB.inkMute, margin: "16px 2px 8px" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,12,8,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "bb-rise 0.22s ease-out" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "88vh", background: BB.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "12px 22px 24px", boxShadow: "0 -10px 40px rgba(0,0,0,0.18)", animation: "bb-rise 0.28s ease-out", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 44, height: 4, borderRadius: 4, background: BB.line, margin: "0 auto 12px", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: BB.display, fontSize: 20, fontWeight: 700, color: BB.ink }}>{t("friends.title")}</div>
            <div style={{ fontSize: 12, color: BB.inkSoft, marginTop: 2 }}>{t("friends.sub")}</div>
          </div>
          <button onClick={onClose} aria-label={t("auth.close")} style={{ appearance: "none", border: 0, background: BB.cream, color: BB.inkSoft, width: 32, height: 32, borderRadius: "50%", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>

        {!user ? (
          <div style={{ padding: "30px 10px", textAlign: "center", color: BB.inkSoft, fontSize: 13 }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>👋</div>
            {t("friends.signedOut")}
          </div>
        ) : (
          <div style={{ overflowY: "auto", minHeight: 0 }}>
            <input
              type="text"
              value={q}
              placeholder={t("friends.searchPlaceholder")}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${BB.line}`, borderRadius: 12, background: "var(--m-card)", color: BB.ink, fontFamily: BB.body, fontSize: 14, padding: "11px 13px", outline: "none" }}
            />

            {q.trim().length >= 2 && (
              <div style={{ marginTop: 10 }}>
                {results.length === 0 && searched ? (
                  <div style={{ fontSize: 12.5, color: BB.inkMute, padding: "4px 2px" }}>{t("friends.noResults")}</div>
                ) : (
                  results.map((u) => (
                    <div key={u.user_id} style={row}>
                      {ava(u.display_name, u.avatar_url)}
                      <span style={nameStyle}>{u.display_name}</span>
                      {u.status === "accepted" ? (
                        <span style={tag(false)}>{t("friends.friend")}</span>
                      ) : u.status === "pending" ? (
                        <span style={tag(true)}>{t("friends.pending")}</span>
                      ) : (
                        <button type="button" style={btn} onClick={() => add(u)}>{t("friends.add")}</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {incoming.length > 0 && (
              <>
                <div style={sect}>{t("friends.requests")}</div>
                {incoming.map((r) => (
                  <div key={r.id} style={row}>
                    {ava(r.display_name, r.avatar_url)}
                    <span style={nameStyle}>{r.display_name}</span>
                    <button type="button" style={btn} onClick={() => respond(r.id, true)}>{t("friends.accept")}</button>
                    <button type="button" style={ghost} onClick={() => respond(r.id, false)}>{t("friends.decline")}</button>
                  </div>
                ))}
              </>
            )}

            <div style={sect}>{t("friends.myFriends")}</div>
            {friends.length === 0 ? (
              <div style={{ fontSize: 12.5, color: BB.inkMute, padding: "4px 2px" }}>{t("friends.empty")}</div>
            ) : (
              friends.map((f) => (
                <div key={f.user_id} style={row}>
                  {ava(f.display_name, f.avatar_url)}
                  <span style={nameStyle}>{f.display_name}</span>
                  <button type="button" style={ghost} onClick={() => remove(f)}>{t("friends.remove")}</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const GIFT_OCCASIONS = [
  { k: "birthday", e: "🎂" },
  { k: "christmas", e: "🎄" },
  { k: "valentine", e: "❤️" },
  { k: "wedding", e: "💍" },
  { k: "newBaby", e: "👶" },
  { k: "housewarming", e: "🏡" },
  { k: "thankYou", e: "🙏" },
  { k: "justBecause", e: "✨" },
  { k: "other", e: "🎁" },
];
const GIFT_BUDGETS = [
  { min: "", max: "25", label: "≤ 25 €" },
  { min: "25", max: "50", label: "25–50 €" },
  { min: "50", max: "100", label: "50–100 €" },
  { min: "100", max: "200", label: "100–200 €" },
  { min: "200", max: "", label: "200 €+" },
];

// Mobile recipient form for gift mode (mirrors the desktop GiftPanel): saved
// people, occasion presets, budget brackets, "surprise me".
function GiftSheet({ open, onClose, onSubmit }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState(GIFT_EMPTY);
  const [people, setPeople] = useState([]);
  const [savedId, setSavedId] = useState(null);
  const [personName, setPersonName] = useState("");
  const [friends, setFriends] = useState([]);
  const [friend, setFriend] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(GIFT_EMPTY);
    setPeople(listRecipients(user?.sub));
    setSavedId(null);
    setPersonName("");
    setFriend(null);
    listFriends().then(setFriends).catch(() => {});
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, user?.sub]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSubmit = friend || form.relationship || form.interests.trim();
  const canSave = personName.trim() && (form.relationship || form.interests.trim());
  const payload = (extra = {}) =>
    friend
      ? { friendId: friend.id, friendName: friend.name, occasion: form.occasion, budgetMin: form.budgetMin, budgetMax: form.budgetMax, ...extra }
      : { ...form, ...extra };

  const loadPerson = (r) => {
    setForm((f) => ({
      ...f,
      relationship: r.relationship || "",
      gender: r.gender || "",
      age: r.age || "",
      interests: r.interests || "",
    }));
    setSavedId(r.id);
    setPersonName(r.label || "");
  };
  const deletePerson = (id, e) => {
    e.stopPropagation();
    removeRecipient(user?.sub, id);
    setPeople((cur) => cur.filter((r) => r.id !== id));
    if (savedId === id) {
      setSavedId(null);
      setPersonName("");
    }
  };
  const savePerson = () => {
    if (!canSave) return;
    const item = saveRecipient(user?.sub, {
      id: savedId,
      label: personName,
      relationship: form.relationship,
      gender: form.gender,
      age: form.age,
      interests: form.interests,
    });
    setPeople(listRecipients(user?.sub));
    setSavedId(item.id);
  };

  const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: BB.ink, marginBottom: 6 };
  const inp = {
    width: "100%", boxSizing: "border-box", border: `1px solid ${BB.line}`, borderRadius: 12,
    background: "var(--m-card)", color: BB.ink, fontFamily: BB.body, fontSize: 14, padding: "11px 13px", outline: "none",
  };
  const chip = (active) => ({
    appearance: "none", border: `1px solid ${active ? BB.coral : BB.line}`,
    background: active ? BB.chipBg : "var(--m-card)", color: active ? BB.coralDeep : BB.ink,
    borderRadius: 999, padding: "8px 12px", fontFamily: BB.body, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,12,8,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "bb-rise 0.22s ease-out" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", background: BB.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "12px 22px 24px", boxShadow: "0 -10px 40px rgba(0,0,0,0.18)", animation: "bb-rise 0.28s ease-out", display: "flex", flexDirection: "column" }}
      >
        <div style={{ width: 44, height: 4, borderRadius: 4, background: BB.line, margin: "0 auto 12px", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: BB.display, fontSize: 20, fontWeight: 700, color: BB.ink }}>🎁 {t("gift.title")}</div>
            <div style={{ fontSize: 12, color: BB.inkSoft, marginTop: 2 }}>{t("gift.sub")}</div>
          </div>
          <button onClick={onClose} aria-label={t("auth.close")} style={{ appearance: "none", border: 0, background: BB.cream, color: BB.inkSoft, width: 32, height: 32, borderRadius: "50%", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", minHeight: 0, paddingRight: 2 }}>
          {friends.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={lbl}>{t("gift.friendsSection")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {friends.map((f) => (
                  <button key={f.user_id} type="button" onClick={() => setFriend(friend?.id === f.user_id ? null : { id: f.user_id, name: f.display_name })} style={{ ...chip(friend?.id === f.user_id), display: "inline-flex", alignItems: "center", gap: 6, paddingLeft: 6 }}>
                    <FriendChipAva name={f.display_name} url={f.avatar_url} />
                    {f.display_name}
                    {f.wishlist_count > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: BB.coralDeep, background: BB.chipBg, padding: "1px 7px", borderRadius: 999 }}>🎁 {f.wishlist_count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {friend && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 13px", marginBottom: 14, border: `1px solid ${BB.coral}`, background: BB.chipBg, borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: BB.coralDeep }}>
              <span>🎁 {t("gift.friendPrivate", { name: friend.name })}</span>
              <button type="button" onClick={() => setFriend(null)} style={{ appearance: "none", border: 0, background: "transparent", color: BB.coralDeep, fontWeight: 700, fontSize: 12, textDecoration: "underline", cursor: "pointer", flexShrink: 0, fontFamily: BB.body }}>{t("gift.changeRecipient")}</button>
            </div>
          )}

          {!friend && people.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={lbl}>{t("gift.saved")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {people.map((r) => (
                  <span key={r.id} onClick={() => loadPerson(r)} style={{ ...chip(savedId === r.id), display: "inline-flex", alignItems: "center", gap: 6, paddingRight: 8 }}>
                    {r.label || "—"}
                    <button type="button" onClick={(e) => deletePerson(r.id, e)} aria-label={t("gift.deletePerson")} style={{ appearance: "none", border: 0, background: "transparent", color: BB.inkMute, fontSize: 11, cursor: "pointer", padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {!friend && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>{t("gift.relationship")}</label>
              <select value={form.relationship} onChange={set("relationship")} style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                <option value="">{t("gift.relationshipPlaceholder")}</option>
                {["partner", "parent", "child", "sibling", "friend", "colleague", "other"].map((k) => (
                  <option key={k} value={t("gift.rel." + k)}>{t("gift.rel." + k)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>{t("gift.gender")}</label>
              <select value={form.gender} onChange={set("gender")} style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                <option value="">{t("profile.genderPlaceholder")}</option>
                {["female", "male", "other"].map((k) => (
                  <option key={k} value={t("profile.gender." + k)}>{t("profile.gender." + k)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>{t("gift.age")}</label>
              <input type="number" inputMode="numeric" min="0" max="120" value={form.age} placeholder={t("gift.agePlaceholder")} onChange={set("age")} style={inp} />
            </div>
          </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>{t("gift.occasion")}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {GIFT_OCCASIONS.map((o) => {
                const label = t("gift.occ." + o.k);
                const active = form.occasion === label;
                return (
                  <button key={o.k} type="button" onClick={() => setForm((f) => ({ ...f, occasion: active ? "" : label }))} style={chip(active)}>
                    <span aria-hidden="true">{o.e}</span> {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>{t("gift.budget")}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {GIFT_BUDGETS.map((b, i) => {
                const active = String(form.budgetMin) === String(b.min) && String(form.budgetMax) === String(b.max);
                return (
                  <button key={i} type="button" onClick={() => setForm((f) => ({ ...f, budgetMin: b.min, budgetMax: b.max }))} style={chip(active)}>{b.label}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" inputMode="numeric" min="0" value={form.budgetMin} placeholder={t("gift.budgetMin")} onChange={set("budgetMin")} style={{ ...inp, width: 90 }} />
              <span style={{ color: BB.inkSoft }}>–</span>
              <input type="number" inputMode="numeric" min="0" value={form.budgetMax} placeholder={t("gift.budgetMax")} onChange={set("budgetMax")} style={{ ...inp, width: 90 }} />
              <span style={{ color: BB.inkSoft }}>€</span>
            </div>
          </div>

          {!friend && (
          <>
          <label style={lbl}>{t("gift.interests")}</label>
          <textarea value={form.interests} maxLength={400} rows={4} placeholder={t("gift.interestsPlaceholder")} onChange={set("interests")} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input type="text" value={personName} maxLength={60} placeholder={t("gift.personNamePlaceholder")} aria-label={t("gift.personName")} onChange={(e) => setPersonName(e.target.value)} style={{ ...inp, flex: 1 }} />
            <button type="button" onClick={savePerson} disabled={!canSave} style={{ appearance: "none", border: `1px solid ${BB.line}`, background: "var(--m-card)", color: BB.ink, borderRadius: 12, padding: "0 14px", fontFamily: BB.body, fontSize: 13, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", opacity: canSave ? 1 : 0.5, flexShrink: 0 }}>
              {savedId ? t("gift.updatePerson") : t("gift.savePerson")}
            </button>
          </div>
          </>
          )}

          <div style={{ fontSize: 11, color: BB.inkSoft, margin: "10px 2px 14px", lineHeight: 1.45 }}>{t("gift.hint")}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4, flexShrink: 0 }}>
          <button type="button" onClick={() => canSubmit && onSubmit?.(payload({ surprise: true }))} disabled={!canSubmit} style={{ flex: 1, appearance: "none", border: `1px solid ${BB.line}`, background: "var(--m-card)", color: BB.ink, padding: "13px 14px", borderRadius: 14, fontWeight: 700, fontFamily: BB.body, fontSize: 14, cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.5 }}>✨ {t("gift.surprise")}</button>
          <button type="button" onClick={() => canSubmit && onSubmit?.(payload())} disabled={!canSubmit} style={{ flex: 1.4, appearance: "none", border: 0, background: BB.coral, color: "#fff", padding: "13px 14px", borderRadius: 14, fontWeight: 700, fontFamily: BB.body, fontSize: 14, cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.5 }}>🎁 {t("gift.submit")}</button>
        </div>
      </div>
    </div>
  );
}

export default function MobileApp() {
  const { user } = useAuth();
  const [view, setView] = useState("search");
  const [query, setQuery] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectionsOpen, setSelectionsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [gift, setGift] = useState(null);
  const [convoId, setConvoId] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  const [recents, setRecents] = useState([]);

  const refreshRecents = () => {
    setRecents(listConversations(user?.sub).slice(0, 12));
  };

  useEffect(() => {
    refreshRecents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.sub, view, authOpen, historyOpen, selectionsOpen]);

  const start = (q) => {
    setGift(null);
    setConvoId(newConversationId());
    setQuery(q);
    setRestoreData(null);
    setTransitioning(true);
    setTimeout(() => {
      setView("chat");
      setTransitioning(false);
    }, 220);
  };
  const startGift = (giftData) => {
    setGiftOpen(false);
    setGift(giftData);
    setConvoId(newConversationId());
    setQuery("");
    setRestoreData(null);
    setTransitioning(true);
    setTimeout(() => {
      setView("chat");
      setTransitioning(false);
    }, 220);
  };
  const back = () => {
    setTransitioning(true);
    setTimeout(() => {
      setView("search");
      setTransitioning(false);
      setRestoreData(null);
      setConvoId(null);
      setGift(null);
    }, 180);
  };
  const loadConvo = (convo) => {
    if (!convo) return;
    setConvoId(convo.id);
    setGift(convo.gift || null);
    setQuery(convo.initialQuery || convo.title || "");
    setRestoreData(convo);
    setTransitioning(true);
    setTimeout(() => {
      setView("chat");
      setTransitioning(false);
    }, 220);
  };

  const SearchScreen = VARIANT === "B" ? SearchB : SearchA;
  const openAuth = () => setAuthOpen(true);
  const openHistory = () => setHistoryOpen(true);
  const openSelections = () => setSelectionsOpen(true);
  const openProfile = () => setProfileOpen(true);
  const openFriends = () => setFriendsOpen(true);
  const openGift = () => setGiftOpen(true);

  return (
    <div className="bb-mobile-root">
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.985)" : "scale(1)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {view === "search" ? (
          <SearchScreen
            onSubmit={start}
            onOpenAuth={openAuth}
            onOpenHistory={openHistory}
            onOpenSelections={openSelections}
            onOpenGift={openGift}
            onOpenFriends={openFriends}
            friendsOpen={friendsOpen}
            onLoadConvo={loadConvo}
            recents={recents}
          />
        ) : (
          <ChatScreen
            query={query}
            onBack={back}
            convoId={convoId}
            restore={restoreData}
            gift={gift}
          />
        )}
      </div>
      <AuthSheet
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onOpenSelections={openSelections}
        onOpenProfile={openProfile}
        onOpenFriends={openFriends}
      />
      <HistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoad={loadConvo}
      />
      <SelectionsSheet
        open={selectionsOpen}
        onClose={() => setSelectionsOpen(false)}
      />
      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
      <GiftSheet
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        onSubmit={startGift}
      />
      <FriendsSheet
        open={friendsOpen}
        onClose={() => setFriendsOpen(false)}
      />
    </div>
  );
}
