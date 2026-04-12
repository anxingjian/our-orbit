'use client';

import { useMemo, useState } from 'react';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';

// 确定性"随机"——用索引做种子，不用 Math.random（避免 SSR 不一致）
function seededRand(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  const r = x - Math.floor(x);
  return min + r * (max - min);
}

interface PhotoWithLayout extends Photo {
  span: 'normal' | 'featured' | 'full';
}

export default function BreathingLayout() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const photos = useMemo(() => {
    const sorted = [...(photosData as Photo[])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const result: PhotoWithLayout[] = [];
    let sinceLastFeatured = 0;
    let sinceLastFull = 0;

    sorted.forEach((photo, i) => {
      const hasPriority = !!photo.description;
      let span: PhotoWithLayout['span'] = 'normal';

      // 全宽优先级最高
      if (sinceLastFull >= 15 && photo.width > photo.height) {
        span = 'full';
        sinceLastFull = 0;
        sinceLastFeatured = 0;
      }
      // 放大图
      else if (
        sinceLastFeatured >= 5 &&
        (hasPriority || seededRand(i, 0, 1) > 0.6)
      ) {
        span = 'featured';
        sinceLastFeatured = 0;
        sinceLastFull += 1;
      } else {
        sinceLastFeatured += 1;
        sinceLastFull += 1;
      }

      result.push({ ...photo, span });
    });

    return result;
  }, []);

  const flatPhotos = photos as Photo[];

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', padding: '40px 24px' }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex', gap: '24px', marginBottom: '32px',
        fontFamily: 'var(--font-body)', fontSize: '12px',
        letterSpacing: '0.06em', color: 'var(--color-text-muted)',
      }}>
        <a href="/demo/breathing" style={{ color: 'var(--color-text)', fontWeight: 500, textDecoration: 'none' }}>呼吸网格</a>
        <a href="/demo/scattered" style={{ textDecoration: 'none', color: 'inherit' }}>散落桌面</a>
        <a href="/demo/sentence" style={{ textDecoration: 'none', color: 'inherit' }}>大小句式</a>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginLeft: 'auto' }}>← 返回</a>
      </div>

      {/* 网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridAutoFlow: 'dense',
        gap: '7px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            onClick={() => setActiveIndex(i)}
            style={{
              gridColumn: photo.span === 'full' ? '1 / -1' : photo.span === 'featured' ? 'span 2' : 'span 1',
              gridRow: photo.span === 'featured' ? 'span 2' : 'span 1',
              cursor: 'pointer',
              overflow: 'hidden',
              borderRadius: '2px',
              background: '#f0ece8',
              aspectRatio: photo.span === 'full' ? '16/5' : photo.span === 'featured' ? '1/1' : `${photo.width}/${photo.height}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.title || ''}
              loading="lazy"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        ))}
      </div>

      <PhotoDetail
        photo={activeIndex !== null ? flatPhotos[activeIndex] : null}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex(i => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() => setActiveIndex(i => (i !== null && i < flatPhotos.length - 1 ? i + 1 : i))}
        hasPrev={activeIndex !== null && activeIndex > 0}
        hasNext={activeIndex !== null && activeIndex < flatPhotos.length - 1}
      />
    </div>
  );
}
