'use client';

import { useMemo, useState } from 'react';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';
import MasonryGrid from '@/components/MasonryGrid';

export default function BreathingLayout() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const photos = useMemo(() =>
    [...(photosData as Photo[])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ), []);

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', padding: '40px 24px' }}>
      <nav style={{
        display: 'flex', gap: '24px', marginBottom: '32px',
        fontFamily: 'var(--font-body)', fontSize: '12px',
        letterSpacing: '0.06em', color: 'var(--color-text-muted)',
      }}>
        <a href="/demo/breathing" style={{ color: 'var(--color-text)', fontWeight: 500, textDecoration: 'none' }}>Masonry A</a>
        <a href="/demo/scattered" style={{ textDecoration: 'none', color: 'inherit' }}>Polaroid</a>
        <a href="/demo/sentence" style={{ textDecoration: 'none', color: 'inherit' }}>Sentence</a>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginLeft: 'auto' }}>← 返回</a>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <MasonryGrid
          photos={photos}
          cols={4}
          gap={7}
          onSelect={(_, i) => setActiveIndex(i)}
        />
      </div>

      <PhotoDetail
        photo={activeIndex !== null ? photos[activeIndex] : null}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex(i => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() => setActiveIndex(i => (i !== null && i < photos.length - 1 ? i + 1 : i))}
        hasPrev={activeIndex !== null && activeIndex > 0}
        hasNext={activeIndex !== null && activeIndex < photos.length - 1}
      />
    </div>
  );
}
