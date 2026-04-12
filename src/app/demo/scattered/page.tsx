'use client';

import { useMemo, useState } from 'react';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';

// 确定性伪随机
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface PolaroidProps {
  photo: Photo;
  index: number;
  onClick: () => void;
}

function Polaroid({ photo, index, onClick }: PolaroidProps) {
  const rotation = (seeded(index * 3 + 1) - 0.5) * 2 * 8; // ±8°
  const offsetX = (seeded(index * 7 + 2) - 0.5) * 2 * 18; // ±18px
  const offsetY = (seeded(index * 11 + 3) - 0.5) * 2 * 14; // ±14px
  const zIndex = Math.floor(seeded(index * 13) * 10) + 1;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        transform: `rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
        zIndex,
        cursor: 'pointer',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, z-index 0s',
        willChange: 'transform',
        background: '#fff',
        padding: '8px 8px 28px 8px',
        boxShadow: '0 2px 12px rgba(28,26,23,0.10), 0 1px 3px rgba(28,26,23,0.06)',
        borderRadius: '1px',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'rotate(0deg) translate(0,0) scale(1.06)';
        el.style.boxShadow = '0 12px 40px rgba(28,26,23,0.18), 0 4px 12px rgba(28,26,23,0.10)';
        el.style.zIndex = '50';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = `rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`;
        el.style.boxShadow = '0 2px 12px rgba(28,26,23,0.10), 0 1px 3px rgba(28,26,23,0.06)';
        el.style.zIndex = String(zIndex);
      }}
    >
      {/* 照片 */}
      <div style={{
        overflow: 'hidden',
        background: '#f5f3ee',
        aspectRatio: `${photo.width}/${photo.height}`,
        maxWidth: '100%',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.title || ''}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* 拍立得底部：日期 */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '10px',
          letterSpacing: '0.08em',
          color: '#a8a5a1',
        }}>
          {formatMonthYear(photo.date)}
        </span>
      </div>
    </div>
  );
}

export default function ScatteredLayout() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const photos = useMemo(() => {
    return [...(photosData as Photo[])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  return (
    <div style={{ background: '#f0ece6', minHeight: '100vh', padding: '40px 32px 80px' }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex', gap: '24px', marginBottom: '48px',
        fontFamily: 'var(--font-body)', fontSize: '12px',
        letterSpacing: '0.06em', color: '#a8a5a1',
      }}>
        <a href="/demo/breathing" style={{ textDecoration: 'none', color: 'inherit' }}>呼吸网格</a>
        <a href="/demo/scattered" style={{ color: '#1c1a17', fontWeight: 500, textDecoration: 'none' }}>散落桌面</a>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginLeft: 'auto' }}>← 返回</a>
      </div>

      {/* 4 列松散网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '32px 24px',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
      }}>
        {photos.map((photo, i) => (
          <Polaroid
            key={photo.src}
            photo={photo}
            index={i}
            onClick={() => setActiveIndex(i)}
          />
        ))}
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
