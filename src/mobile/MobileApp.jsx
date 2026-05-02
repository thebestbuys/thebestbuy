import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS } from "../data.js";
import { rankByPreferences } from "../scoring.js";
import { askAI } from "../lib/askAI.js";

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

const BB = {
  coral: "#F26B4E",
  coralDeep: "#D9492C",
  amber: "#F5B544",
  cream: "#FFF7F0",
  paper: "#FFFCF8",
  ink: "#221A14",
  inkSoft: "#5C504A",
  inkMute: "#9A8E86",
  line: "#EDE3D8",
  chipBg: "#FBEFE2",
  chipBgHov: "#F6E2CB",
  bubbleAi: "#F4ECE2",
  display: '"Quicksand", "Nunito", system-ui, sans-serif',
  body: '"Nunito", "Quicksand", system-ui, sans-serif',
};

function Logo({ size = 30, weight = 700 }) {
  return (
    <div
      style={{
        fontFamily: BB.display,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: -0.5,
        color: BB.ink,
        lineHeight: 1,
        display: "flex",
        alignItems: "baseline",
        gap: 0,
      }}
    >
      <span>best</span>
      <span style={{ color: BB.coral }}>buys</span>
      <span
        style={{
          display: "inline-block",
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: "50%",
          background: BB.amber,
          marginLeft: 2,
          alignSelf: "center",
          transform: `translateY(${-size * 0.05}px)`,
        }}
      />
    </div>
  );
}

const SearchIcon = ({ size = 18, color = BB.inkMute }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="6.2" stroke={color} strokeWidth="1.8" />
    <path
      d="M13.5 13.5L17 17"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const BackIcon = ({ size = 20, color = BB.ink }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M12.5 4L6.5 10l6 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const SparkleIcon = ({ size = 14, color = BB.coral }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M7 1.5l1.3 3.7L12 6.5l-3.7 1.3L7 11.5 5.7 7.8 2 6.5l3.7-1.3L7 1.5z"
      fill={color}
    />
    <circle cx="11.5" cy="2.5" r="0.8" fill={color} />
    <circle cx="2" cy="11.5" r="0.6" fill={color} />
  </svg>
);
const MicIcon = ({ size = 18, color = BB.inkSoft }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="7" y="3" width="6" height="10" rx="3" fill={color} />
    <path
      d="M4 10a6 6 0 0012 0M10 16v2"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

function Chip({ children, onClick, variant = "soft", icon }) {
  const styles = {
    soft: { bg: BB.chipBg, fg: BB.ink, border: "transparent" },
    outline: { bg: "#fff", fg: BB.ink, border: BB.line },
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
  const brand = product?.brand || "Sonara Audio";
  const model = product?.model || "Sonara Hush Pro — Over-Ear ANC";
  const price = product?.price;
  const rating = product?.rating ?? 4.8;
  const reviews = product?.reviews ?? 2300;
  return (
    <div
      style={{
        background: "#fff",
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
          background: `repeating-linear-gradient(135deg, ${BB.cream}, ${BB.cream} 8px, ${BB.chipBg} 8px, ${BB.chipBg} 16px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            color: BB.inkMute,
            background: "rgba(255,255,255,0.85)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          product image
        </div>
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
          <span style={{ color: BB.amber }}>★★★★★</span>
          <span>{rating.toFixed(1)} · {(reviews / 1000).toFixed(1)}k reviews</span>
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
            <span style={{ fontSize: 18, fontWeight: 800, color: BB.ink }}>
              {price != null ? `${price.toLocaleString("fr-FR")} €` : "$229"}
            </span>
          </div>
          <button
            style={{
              appearance: "none",
              border: 0,
              background: BB.ink,
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12,
              fontFamily: BB.body,
              cursor: "pointer",
            }}
          >
            View product →
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatScreen({ query, onBack, accent = BB.coral }) {
  const category = useMemo(() => detectCategory(query), [query]);
  const [messages, setMessages] = useState(() =>
    query ? [{ role: "user", text: query }] : [],
  );
  const [preferences, setPreferences] = useState({
    tags: [],
    budget_max: null,
    budget_min: null,
  });
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const initRan = useRef(false);

  const runTurn = async (history) => {
    setTyping(true);
    try {
      const result = await askAI({ messages: history, category });
      const reply = result?.reply || "…";
      const chips =
        result?.action === "ask" &&
        Array.isArray(result?.question?.choices) &&
        result.question.choices.length
          ? result.question.choices.map((c) => c.label)
          : undefined;
      const isRecommend = result?.action === "recommend";
      const aiMsg = {
        role: "ai",
        text: reply,
        chips,
        card: isRecommend,
        actions: isRecommend ? ["Perfect, thanks!", "Keep searching"] : undefined,
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
          text: `Sorry — the recommendation service didn't respond (${e.message}). Try again or restart.`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;
    const initial = query
      ? [{ role: "user", text: query }]
      : [{ role: "user", text: "I'm looking for a product, can you help?" }];
    runTurn(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const showInputBar = !done;

  const topProduct = useMemo(() => {
    if (!category) return null;
    const list = PRODUCTS[category]?.map((p) => ({ ...p, category })) || [];
    if (!list.length) return null;
    return rankByPreferences(list, preferences)[0];
  }, [category, preferences]);

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
          background: "#fff",
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
            AI Assistant
          </div>
          <div style={{ fontSize: 11, color: "#3CCB7F", fontWeight: 600 }}>
            ● Online · usually replies instantly
          </div>
        </div>
        <div
          style={{
            fontFamily: BB.display,
            fontWeight: 700,
            fontSize: 13,
            color: BB.ink,
          }}
        >
          best<span style={{ color: BB.coral }}>buys</span>
        </div>
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
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={typing ? "Thinking…" : "Type a message…"}
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

function SearchA({ onSubmit }) {
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
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
            <path
              d="M2 4l6-3 6 3v6l-6 3-6-3V4z"
              stroke={BB.ink}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: BB.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: BB.ink,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: BB.display,
          }}
        >
          JL
        </div>
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
          background: "#fff",
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

function SearchB({ onSubmit }) {
  const [q, setQ] = useState("");
  const submit = (text) => onSubmit(text || q || "Coffee maker");

  const categories = [
    { label: "Headphones", emoji: "🎧", tone: BB.chipBg },
    { label: "Laptops", emoji: "💻", tone: "#E8F1E8" },
    { label: "Coffee", emoji: "☕", tone: "#F1E4D2" },
    { label: "Watches", emoji: "⌚", tone: "#EFE6F1" },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, ${BB.cream} 0%, ${BB.paper} 40%)`,
        padding: "20px 18px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Logo size={22} />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#fff",
            border: `1px solid ${BB.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: BB.ink,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: BB.display,
          }}
        >
          JL
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div
          style={{
            fontFamily: BB.display,
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.1,
            color: BB.ink,
            letterSpacing: -0.6,
          }}
        >
          Hey Jordan,
          <br />
          what shall we
          <br />
          <span style={{ color: BB.coral }}>find today?</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          background: "#fff",
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
          Ask in plain words — "a quiet keyboard under $80"
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
            Browse
          </div>
          <div style={{ fontSize: 11, color: BB.inkMute, fontWeight: 600 }}>
            see all →
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {categories.map((c) => (
            <button
              key={c.label}
              onClick={() => submit(c.label.toLowerCase())}
              style={{
                appearance: "none",
                border: `1px solid ${BB.line}`,
                background: c.tone,
                padding: "14px 12px",
                borderRadius: 16,
                textAlign: "left",
                cursor: "pointer",
                fontFamily: BB.body,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.12s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.98)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div style={{ fontSize: 22 }}>{c.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BB.ink }}>
                {c.label}
              </div>
            </button>
          ))}
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
            Recent
          </div>
          <div style={{ fontSize: 11, color: BB.inkMute, fontWeight: 600 }}>
            see all →
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "10px 12px",
            border: `1px solid ${BB.line}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
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
            }}
          >
            🕓
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: 700,
              color: BB.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            "best lightweight running shoes"
          </div>
          <button
            onClick={() => submit("best lightweight running shoes")}
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
            }}
          >
            Continue
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}

export default function MobileApp() {
  const [view, setView] = useState("search");
  const [query, setQuery] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const start = (q) => {
    setQuery(q);
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
    }, 180);
  };

  const SearchScreen = VARIANT === "B" ? SearchB : SearchA;

  return (
    <div className="bb-mobile-root">
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.985)" : "scale(1)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
          "padding-top": "45px",
        }}
      >
        {view === "search" ? (
          <SearchScreen onSubmit={start} />
        ) : (
          <ChatScreen query={query} onBack={back} />
        )}
      </div>
    </div>
  );
}
