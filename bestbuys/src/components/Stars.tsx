interface Props {
  rating: number;
}

export function Stars({ rating }: Props) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;

  return (
    <span className="stars" aria-label={`${rating} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const cls = i < full ? 'full' : i === full && half ? 'half' : 'empty';
        return (
          <span key={i} className={`star ${cls}`}>★</span>
        );
      })}
    </span>
  );
}
