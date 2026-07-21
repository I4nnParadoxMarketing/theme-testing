import { categoryPlaceholder } from '../lib/image';
import type { Category } from '../types';

interface Props {
  name: string;
  image?: string;
  category?: Category | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProductThumb({ name, image, category, size = 'md', className = '' }: Props) {
  const src = image || categoryPlaceholder(category ?? 'Tools');
  return (
    <span className={`product-thumb size-${size} ${className}`.trim()} aria-hidden>
      <img src={src} alt="" loading="lazy" />
      <span className="product-thumb-fallback">{name.slice(0, 1)}</span>
    </span>
  );
}
