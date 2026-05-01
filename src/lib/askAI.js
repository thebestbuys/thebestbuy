export async function askAI({ messages, category }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      messages: messages.map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      })),
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody.error || JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`AI request failed (${res.status}): ${detail}`);
  }

  return res.json();
}
