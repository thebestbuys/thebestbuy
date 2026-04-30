import type { Product } from '../types';

interface Props {
  product: Product;
  size?: 'small' | 'normal' | 'large' | 'modal';
}

export function ProductImage({ product, size = 'normal' }: Props) {
  const { category, color } = product;

  if (category === 'phone') {
    return (
      <div className="prod-img-wrap" data-size={size}>
        <div className="prod-img phone-img" style={{ background: color }}>
          <div className="phone-screen" />
          <div className="phone-notch" />
          <div className="phone-camera" />
        </div>
      </div>
    );
  }

  if (category === 'laptop') {
    return (
      <div className="prod-img-wrap" data-size={size}>
        <div className="prod-img laptop-img">
          <div className="laptop-screen" style={{ background: color }} />
          <div className="laptop-base" />
        </div>
      </div>
    );
  }

  return (
    <div className="prod-img-wrap" data-size={size}>
      <div
        className="prod-img headphones-img"
        style={{ '--hp-color': color } as React.CSSProperties}
      >
        <div className="hp-band" />
        <div className="hp-cup hp-cup-l" />
        <div className="hp-cup hp-cup-r" />
      </div>
    </div>
  );
}
