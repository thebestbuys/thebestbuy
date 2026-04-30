import { useState, useEffect, useMemo } from 'react';
import type { CategoryId, Product, Message, Answers } from './types';
import { CATEGORIES } from './data/categories';
import { QUESTIONS } from './data/questions';
import { PRODUCTS } from './data/products';
import { rankProducts } from './lib/scoring';
import { HomePage } from './components/HomePage';
import { ChatPanel } from './components/ChatPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { ProductDetail } from './components/ProductDetail';

export function App() {
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [initialQuery, setInitialQuery] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);

  const questions = category ? QUESTIONS[category] : [];
  const products = category ? PRODUCTS[category] : [];
  const currentQuestion =
    !isTyping && questionIdx < questions.length ? questions[questionIdx] : null;
  const allDone = Boolean(category && questionIdx >= questions.length);
  const progress = questions.length
    ? Math.min(100, Math.round((questionIdx / questions.length) * 100))
    : 0;

  useEffect(() => {
    if (!category) return;
    const cat = CATEGORIES.find((c) => c.id === category)!;
    const initial: Message[] = [];
    if (initialQuery) {
      initial.push({ role: 'user', text: initialQuery });
    }
    initial.push({
      role: 'bot',
      text: initialQuery
        ? `Compris — je cherche dans la catégorie ${cat.label.toLowerCase()}. Quelques questions pour affiner :`
        : `Parfait, on cherche un ${cat.label.toLowerCase()}. Je vais vous poser quelques questions pour affiner.`,
    });
    setMessages(initial);
    setIsTyping(true);
    const t = setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: QUESTIONS[category][0].text }]);
      setIsTyping(false);
    }, 900);
    return () => clearTimeout(t);
  }, [category]);

  const ranked = useMemo<Product[]>(() => {
    if (!category) return [];
    return rankProducts(products, answers, questions).slice(0, 5);
  }, [category, answers, refreshKey]);

  const handlePick = (cat: CategoryId, query: string) => {
    setCategory(cat);
    setInitialQuery(query);
    setAnswers({});
    setMessages([]);
    setQuestionIdx(0);
    setIsTyping(false);
    setRefreshKey(0);
    setSelected(null);
  };

  const handleAnswer = (qId: string, choice: { id: string; label: string }) => {
    setMessages((m) => [...m, { role: 'user', text: choice.label }]);
    setAnswers((a) => ({ ...a, [qId]: choice.id }));
    setRefreshKey((k) => k + 1);

    const nextIdx = questionIdx + 1;
    setIsTyping(true);
    setTimeout(() => {
      if (nextIdx < questions.length) {
        setMessages((m) => [...m, { role: 'bot', text: questions[nextIdx].text }]);
        setQuestionIdx(nextIdx);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: 'bot',
            text: "Voilà ma sélection sur la droite. La carte mise en avant est mon meilleur match. Vous pouvez cliquer sur n'importe quel produit pour voir le détail.",
          },
        ]);
        setQuestionIdx(nextIdx);
      }
      setIsTyping(false);
    }, 800);
  };

  const handleFreeText = (text: string) => {
    setMessages((m) => [...m, { role: 'user', text }]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          text: allDone
            ? "Bien noté, j'ajuste les recommandations. Souhaitez-vous reprendre le questionnaire ?"
            : 'Merci, je tiens compte de cette précision. Voici la question suivante :',
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleRestart = () => {
    setCategory(null);
    setInitialQuery('');
    setAnswers({});
    setMessages([]);
    setQuestionIdx(0);
    setIsTyping(false);
    setSelected(null);
  };

  const handleBuy = (p: Product) => {
    setSelected(null);
    setMessages((m) => [
      ...m,
      { role: 'bot', text: `Je vous redirige vers le ${p.model} chez notre marchand partenaire ✓` },
    ]);
  };

  if (!category) {
    return <HomePage onPick={handlePick} />;
  }

  const cat = CATEGORIES.find((c) => c.id === category)!;

  return (
    <div className="app">
      <ChatPanel
        messages={messages}
        currentQuestion={currentQuestion}
        onAnswer={handleAnswer}
        onFreeText={handleFreeText}
        onRestart={handleRestart}
        isTyping={isTyping}
        progress={progress}
      />
      <ResultsPanel
        ranked={ranked}
        questions={questions}
        answeredCount={Object.keys(answers).length}
        categoryLabel={cat.label}
        allDone={allDone}
        onSelect={setSelected}
        refreshKey={refreshKey}
      />
      {selected && (
        <ProductDetail
          product={selected}
          onClose={() => setSelected(null)}
          onBuy={handleBuy}
        />
      )}
    </div>
  );
}

export default App;
