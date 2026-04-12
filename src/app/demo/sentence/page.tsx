'use client';

import { useMemo, useState } from 'react';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';

// Pattern types
type PatternType = 'A' | 'B' | 'C' | 'D';

interface PatternGroup {
  pattern: PatternType;
  photos: Photo[];
}

const PATTERN_SEQUENCE: PatternType[] = ['A', 'B', 'C', 'D'];

// Pattern A: 1 large(2fr) + 2 small(1fr+1fr) — 3 photos
// Pattern B: 3 equal — 3 photos
// Pattern C: 1 full width — 1 photo
// Pattern D: 2 small(1fr+1fr) + 1 large(2fr) — 3 photos
function patternSize(p: PatternType): number {
  return p === 'C' ? 1 : 3;
}

export default function SentenceLayout() {
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  const { groups, flatPhotos } = useMemo(() => {
    const sorted = [...(photosData as Photo[])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: PatternGroup[] = [];
    let photoIndex = 0;
    let patternIndex = 0;

    while (photoIndex < sorted.length) {
      const pattern = PATTERN_SEQUENCE[patternIndex % PATTERN_SEQUENCE.length];
      const size = patternSize(pattern);
      const chunk = sorted.slice(photoIndex, photoIndex + size);
      if (chunk.length === 0) break;
      groups.push({ pattern, photos: chunk });
      photoIndex += chunk.length;
      patternIndex++;
    }

    return { groups, flatPhotos: sorted };
  }, []);

  const activeIndex = activePhoto ? flatPhotos.indexOf(activePhoto) : null;

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', padding: '40px 24px' }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex', gap: '24px', marginBottom: '32px',
        fontFamily: 'var(--font-body)', fontSize: '12px',
        letterSpacing: '0.06em', color: 'var(--color-text-muted)',
      }}>
        <a href="/demo/breathing" style={{ textDecoration: 'none', color: 'inherit' }}>呼吸网格</a>
        <a href="/demo/scattered" style={{ textDecoration: 'none', color: 'inherit' }}>散落桌面</a>
        <a href="/demo/sentence" style={{ color: 'var(--color-text)', fontWeight: 500, textDecoration: 'none' }}>大小句式</a>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginLeft: 'auto' }}>← 返回</a>
      </div>

      {/* Sentence layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {groups.map((group, gi) => (
          <PatternRow
            key={gi}
            group={group}
            onSelect={setActivePhoto}
          />
        ))}
      </div>

      <PhotoDetail
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
        onPrev={() => {
          if (activeIndex !== null && activeIndex > 0) {
            setActivePhoto(flatPhotos[activeIndex - 1]);
          }
        }}
        onNext={() => {
          if (activeIndex !== null && activeIndex < flatPhotos.length - 1) {
            setActivePhoto(flatPhotos[activeIndex + 1]);
          }
        }}
        hasPrev={activeIndex !== null && activeIndex > 0}
        hasNext={activeIndex !== null && activeIndex < flatPhotos.length - 1}
      />
    </div>
  );
}

function PatternRow({
  group,
  onSelect,
}: {
  group: PatternGroup;
  onSelect: (photo: Photo) => void;
}) {
  const { pattern, photos } = group;
  const GAP = 7;

  if (pattern === 'C') {
    // Full width — single photo
    const photo = photos[0];
    return (
      <PhotoCell
        photo={photo}
        aspectRatio="16/5"
        onSelect={onSelect}
      />
    );
  }

  // Grid rows: A, B, D
  let gridTemplateColumns: string;
  if (pattern === 'A') {
    // 1 large(2fr) + 2 small(1fr+1fr) right column stacked
    // left: 2fr, right: 1fr split into two rows
    gridTemplateColumns = '2fr 1fr';
  } else if (pattern === 'B') {
    gridTemplateColumns = '1fr 1fr 1fr';
  } else {
    // D: 2 small + 1 large
    gridTemplateColumns = '1fr 2fr';
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns,
      gap: `${GAP}px`,
      height: '320px',
    }}>
      {pattern === 'A' && photos.length >= 3 ? (
        <>
          {/* Left: large */}
          <PhotoCell photo={photos[0]} style={{ height: '100%' }} onSelect={onSelect} />
          {/* Right: two small stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, height: '100%' }}>
            <PhotoCell photo={photos[1]} style={{ flex: 1, minHeight: 0 }} onSelect={onSelect} />
            <PhotoCell photo={photos[2]} style={{ flex: 1, minHeight: 0 }} onSelect={onSelect} />
          </div>
        </>
      ) : pattern === 'D' && photos.length >= 3 ? (
        <>
          {/* Left: two small stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, height: '100%' }}>
            <PhotoCell photo={photos[0]} style={{ flex: 1, minHeight: 0 }} onSelect={onSelect} />
            <PhotoCell photo={photos[1]} style={{ flex: 1, minHeight: 0 }} onSelect={onSelect} />
          </div>
          {/* Right: large */}
          <PhotoCell photo={photos[2]} style={{ height: '100%' }} onSelect={onSelect} />
        </>
      ) : (
        // Pattern B or partial patterns
        photos.map((photo) => (
          <PhotoCell key={photo.src} photo={photo} onSelect={onSelect} />
        ))
      )}
    </div>
  );
}

function PhotoCell({
  photo,
  style,
  aspectRatio,
  onSelect,
}: {
  photo: Photo;
  style?: React.CSSProperties;
  aspectRatio?: string;
  onSelect: (photo: Photo) => void;
}) {
  return (
    <div
      onClick={() => onSelect(photo)}
      style={{
        overflow: 'hidden',
        borderRadius: '2px',
        background: '#f0ece8',
        cursor: 'pointer',
        ...(aspectRatio ? { aspectRatio } : {}),
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.title || ''}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      />
    </div>
  );
}
