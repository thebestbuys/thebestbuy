interface Props {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 64 }: Props) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 85
      ? 'var(--accent-good)'
      : score >= 70
      ? 'var(--accent)'
      : 'var(--text-muted)';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="3"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring-num" style={{ fontSize: size * 0.32 }}>
        {score}<span className="score-pct">%</span>
      </div>
    </div>
  );
}
