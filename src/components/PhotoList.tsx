'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface Photo {
  id: string;
  src: string;
  width: number;
  height: number;
  date: string;        // ISO string
  title?: string;
  dominantColor?: string;
}

interface PhotoItemProps {
  photo: Photo;
  index: number;
  prevPhoto?: Photo;
}

// 同月的第一张才显示月份标记
function shouldShowDateLabel(photo: Photo, prevPhoto?: Photo): boolean {
  if (!prevPhoto) return true;
  const curr = new Date(photo.date);
  const prev = new Date(prevPhoto.date);
  return (
    curr.getFullYear() !== prev.getFullYear() ||
    curr.getMonth() !== prev.getMonth()
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}.${m}`;
}

function PhotoItem({ photo, index, prevPhoto }: PhotoItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const showLabel = shouldShowDateLabel(photo, prevPhoto);
  const aspectRatio = photo.width / photo.height;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* 月份 / 年份标记 */}
      {showLabel && (
        <div
          style={{
            padding: '0 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
              opacity: 0.6,
            }}
          >
            {formatDate(photo.date)}
          </span>
        </div>
      )}

      {/* 照片 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delay: 0,
        }}
        style={{
          padding: '0 16px',
          marginBottom: '80px',
        }}
      >
        {/* 占位色块 + 图片 */}
        <div
          style={{
            borderRadius: '4px',
            overflow: 'hidden',
            background: photo.dominantColor || 'var(--color-bg-warm)',
            aspectRatio: `${aspectRatio}`,
          }}
        >
          <img
            src={photo.src}
            alt={photo.title || formatDate(photo.date)}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

interface PhotoListProps {
  photos: Photo[];
}

export default function PhotoList({ photos }: PhotoListProps) {
  // 照片按时间从新到旧排列
  const sorted = [...photos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        paddingTop: '80px',
        paddingBottom: '120px',
      }}
    >
      {sorted.map((photo, i) => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          index={i}
          prevPhoto={sorted[i - 1]}
        />
      ))}
    </div>
  );
}
