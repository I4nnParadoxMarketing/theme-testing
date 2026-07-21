import { useRef, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { ProductThumb } from '../components/ProductThumb';
import { fileToProductImage } from '../lib/image';
import { useStore } from '../hooks/useStore';
import type { Category, Product } from '../types';

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function ProductSheet({ product, onClose }: Props) {
  const { addProduct, updateProduct, adjustStock } = useStore();
  const isEdit = Boolean(product);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [category, setCategory] = useState<Category>(product?.category ?? 'Tools');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [cost, setCost] = useState(String(product?.cost ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? '0'));
  const [reorderAt, setReorderAt] = useState(String(product?.reorderAt ?? '10'));
  const [unit, setUnit] = useState(product?.unit ?? 'ea');
  const [image, setImage] = useState(product?.image ?? '');
  const [restock, setRestock] = useState('10');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await fileToProductImage(file);
      setImage(dataUrl);
    } catch {
      setError('Could not read that image. Try another photo.');
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const priceN = Number(price);
    const costN = Number(cost);
    const stockN = Number(stock);
    const reorderN = Number(reorderAt);
    if (!name.trim() || !sku.trim()) {
      setError('Name and SKU are required.');
      return;
    }
    if ([priceN, costN, stockN, reorderN].some((n) => Number.isNaN(n) || n < 0)) {
      setError('Enter valid numbers for price, cost, and stock.');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      price: priceN,
      cost: costN,
      stock: stockN,
      reorderAt: reorderN,
      unit: unit.trim() || 'ea',
      image: image || undefined,
    };

    if (product) {
      updateProduct(product.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet-head">
          <h2 id="product-sheet-title">{isEdit ? 'Edit product' : 'Add product'}</h2>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="sheet-body form-grid">
          <div className="image-picker">
            <ProductThumb name={name || 'Product'} image={image || undefined} category={category} size="lg" />
            <div className="image-picker-actions">
              <p>Product photo</p>
              <button
                type="button"
                className="secondary-btn"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? 'Processing…' : image ? 'Change photo' : 'Add photo'}
              </button>
              {image && (
                <button type="button" className="ghost-btn" onClick={() => setImage('')}>
                  Remove
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  void onPickImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
          <label>
            Price
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>
            Cost
            <input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
          <label>
            Stock
            <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </label>
          <label>
            Reorder at
            <input
              inputMode="numeric"
              value={reorderAt}
              onChange={(e) => setReorderAt(e.target.value)}
            />
          </label>

          {product && (
            <div className="restock-row">
              <label>
                Quick restock
                <input
                  inputMode="numeric"
                  value={restock}
                  onChange={(e) => setRestock(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  const n = Number(restock);
                  if (!Number.isNaN(n) && n > 0) {
                    adjustStock(product.id, n);
                    setStock((prev) => String(Number(prev || 0) + n));
                  }
                }}
              >
                Add stock
              </button>
            </div>
          )}
        </div>

        <footer className="sheet-foot">
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="primary-btn" onClick={save} disabled={busy}>
            {isEdit ? 'Save changes' : 'Add to inventory'}
          </button>
        </footer>
      </div>
    </div>
  );
}
