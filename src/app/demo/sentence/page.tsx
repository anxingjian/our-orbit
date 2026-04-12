'use client';

import { useMemo, useState } from 'react';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';

type PatternType = 'A' | 'B' | 'C' | 'D';

interface PatternGroup {
  pattern: PatternType;
  photos: Photo[];
}

const PATTERN_SEQUENCE: PatternType[] = ['A', 'B', 'C', 'D'];

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
      <div style={{
        display: 'flex', gap: '24px', marginBottom: '32px',
        fontFamily: 'var(--font-body)', fontSize: '12px',
        letterSpacing: '0.06em', color: 'var(--color-text-muted)',
      }}>
        <a href="/demo/scattered" style={{ textDecoration: 'none', color: 'inherit' }}>散落桌面</a>
        <a href="/demo/sentence" style={{ color: 'var(--color-text)', fontWeight: 500, textDecoration: 'none' }}>大小句式</a>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginLeft: 'auto' }}>← 返回</a>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {groups.map((group, gi) => (
          <PatternRow key={gi} group={group} onSelect={setActivePhoto} />
        ))}
      </div>

      <PhotoDetail
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
        onPrev={() => {
          if (activeIndex !== null && activeIndex > 0) setActivePhoto(flatPhotos[activeIndex - 1]);
        }}
        onNext={() => {
          if (activeIndex !== null && activeIndex < flatPhotos.length - 1) setActivePhoto(flatPhotos[activeIndex + 1]);
        }}
        hasPrev={activeIndex !== null && activeIndex > 0}
        hasNext={activeIndex !== null && activeIndex < flatPhotos.length - 1}
      />
    </div>
  );
}

function PhotoCell({
  photo,
  flexBasis,
  onSelect,
}: {
  photo: Photo;
  flexBasis?: string;
  onSelect: (photo: Photo) => void;
}) {
  const ratio = photo.width / photo.height;

  return (
    <div
      onClick={() => onSelect(photo)}
      style={{
        flex: flexBasis ? `0 0 ${flexBasis}` : '1',
        cursor: 'pointer',
        borderRadius: '2px',
        overflow: 'hidden',
        background: '#f0ece8',
      }}
    >
      {/* 用 padding-top 撑开正确比例，不裁切 */}
      <div style={{ position: 'relative', width: '100%', paddingTop: `${(1 / ratio) * 100}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.title || ''}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            transition: 'opacity 0.3s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        />
      </div>
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

  // Pattern C: 全宽单张
  if (pattern === 'C') {
    return (
      <div style={{ width: '100%' }}>
        <PhotoCell photo={photos[0]} onSelect={onSelect} />
      </div>
    );
  }

  // Pattern A: 大(2fr) + 右侧两小叠
  if (pattern === 'A' && photos.length >= 3) {
    return (
      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
        <div style={{ flex: 2 }}>
          <PhotoCell photo={photos[0]} onSelect={onSelect} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
          <PhotoCell photo={photos[1]} onSelect={onSelect} />
          <PhotoCell photo={photos[2]} onSelect={onSelect} />
        </div>
      </div>
    );
  }

  // Pattern D: 左侧两小叠 + 大(2fr)
  if (pattern === 'D' && photos.length >= 3) {
    return (
      <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
          <PhotoCell photo={photos[0]} onSelect={onSelect} />
          <PhotoCell photo={photos[1]} onSelect={onSelect} />
        </div>
        <div style={{ flex: 2 }}>
          <PhotoCell photo={photos[2]} onSelect={onSelect} />
        </div>
      </div>
    );
  }

  // Pattern B: 三等分
  return (
    <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
      {photos.map((photo) => (
        <div key={photo.src} style={{ flex: 1 }}>
          <PhotoCell photo={photo} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}
