'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
export interface Photo {
  src: string;
  date: string;
  width: number;
  height: number;
  title?: string;
}

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
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface PhotoItemProps {
  photo: Photo;
  prevPhoto?: Photo;
}

function PhotoItem({ photo, prevPhoto }: PhotoItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const showLabel = shouldShowDateLabel(photo, prevPhoto);

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
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* 月份标记 */}
      {showLabel && (
        <div style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            opacity: 0.55,
          }}>
            {formatDate(photo.date)}
          </span>
        </div>
      )}

      {/* 照片 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '0 16px', marginBottom: '80px' }}
      >
        <div style={{ borderRadius: '3px', overflow: 'hidden', lineHeight: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.title || formatDate(photo.date)}
            loading="lazy"
            style={{ width: '100%', height: 'auto', display: 'block' }}
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
  const sorted = [...photos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingTop: '80px', paddingBottom: '120px' }}>
      {sorted.map((photo, i) => (
        <PhotoItem key={photo.src} photo={photo} prevPhoto={sorted[i - 1]} />
      ))}
    </div>
  );
}
