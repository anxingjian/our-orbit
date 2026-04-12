'use client';

import { useMemo, useState } from 'react';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';
import MasonryGrid from '@/components/MasonryGrid';

// 确定性伪随机
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function PolaroidCell({ photo, index }: { photo: Photo; index: number }) {
  const rotation = (seeded(index * 3 + 1) - 0.5) * 2 * 7;
  const offsetX = (seeded(index * 7 + 2) - 0.5) * 2 * 12;
  const offsetY = (seeded(index * 11 + 3) - 0.5) * 2 * 10;

  return (
    <div
      style={{
        background: '#fff',
        padding: '7px 7px 26px 7px',
        boxShadow: '0 2px 10px rgba(28,26,23,0.10)',
        borderRadius: '1px',
        transform: `rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'rotate(0deg) translate(0,0) scale(1.05)';
        el.style.boxShadow = '0 12px 36px rgba(28,26,23,0.18)';
        el.style.zIndex = '10';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = `rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`;
        el.style.boxShadow = '0 2px 10px rgba(28,26,23,0.10)';
        el.style.zIndex = '1';
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.title || ''}
        loading="lazy"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '10px',
          letterSpacing: '0.08em', color: '#a8a5a1',
        }}>
          {formatMonthYear(photo.date)}
        </span>
      </div>
    </div>
  );
}

export default function ScatteredLayout() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const photos = useMemo(() =>
    [...(photosData as Photo[])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ), []);

  return (
    <div style={{ background: '#ede9e3', minHeight: '100vh', padding: '40px 32px 80px' }}>
      <nav style={{
        display: 'flex', gap: '24px', marginBottom: '48px',
        fontFamily: 'var(--font-body)', fontSize: '12px',
        letterSpacing: '0.06em', color: '#a8a5a1',
      }}>
        <a href="/demo/breathing" style={{ textDecoration: 'none', color: 'inherit' }}>Masonry A</a>
        <a href="/demo/scattered" style={{ color: '#1c1a17', fontWeight: 500, textDecoration: 'none' }}>Polaroid</a>
        <a href="/demo/sentence" style={{ textDecoration: 'none', color: 'inherit' }}>Sentence</a>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginLeft: 'auto' }}>← 返回</a>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <MasonryGrid
          photos={photos}
          cols={4}
          gap={28}
          onSelect={(_, i) => setActiveIndex(i)}
          renderCell={(photo, i) => <PolaroidCell photo={photo} index={i} />}
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
