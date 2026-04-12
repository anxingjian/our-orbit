'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PhotoDetail from './PhotoDetail';

export interface Photo {
  src: string;
  date: string;
  width: number;
  height: number;
  title?: string;
  description?: string;
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
  onClick: () => void;
  compact?: boolean;
}

function PhotoItem({ photo, prevPhoto, onClick, compact }: PhotoItemProps) {
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
      {showLabel && !compact && (
        <div style={{ padding: '0', marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
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

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: compact ? '16px' : '80px' }}
      >
        <div
          onClick={onClick}
          style={{
            borderRadius: '3px',
            overflow: 'hidden',
            lineHeight: 0,
            cursor: 'pointer',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.title || formatDate(photo.date)}
            loading="lazy"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.015)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ── Date separator for masonry ── */
function DateSeparator({ dateStr }: { dateStr: string }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      padding: '24px 0 8px',
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: 'var(--color-text-muted)',
        opacity: 0.55,
      }}>
        {formatDate(dateStr)}
      </span>
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

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── Desktop: two-column masonry ── */
  if (isDesktop) {
    // Split into two columns by alternating, preserving time order
    const col1: { photo: Photo; idx: number }[] = [];
    const col2: { photo: Photo; idx: number }[] = [];
    
    // Group by month first
    type MonthGroup = { key: string; photos: { photo: Photo; idx: number }[] };
    const groups: MonthGroup[] = [];
    let currentKey = '';
    
    sorted.forEach((photo, idx) => {
      const key = formatDate(photo.date);
      if (key !== currentKey) {
        groups.push({ key, photos: [] });
        currentKey = key;
      }
      groups[groups.length - 1].photos.push({ photo, idx });
    });

    // Distribute to columns
    let colToggle = 0;
    groups.forEach(group => {
      group.photos.forEach(item => {
        if (colToggle % 2 === 0) col1.push(item);
        else col2.push(item);
        colToggle++;
      });
    });

    return (
      <>
        <div style={{
          maxWidth: '1080px',
          margin: '0 auto',
          paddingTop: '80px',
          paddingBottom: '120px',
          paddingLeft: '24px',
          paddingRight: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'start',
        }}>
          {/* Left column */}
          <div style={{ paddingTop: '40px' }}>
            {col1.map((item) => (
              <PhotoItem
                key={item.photo.src}
                photo={item.photo}
                onClick={() => setActiveIndex(item.idx)}
                compact
              />
            ))}
          </div>
          {/* Right column — offset for masonry feel */}
          <div>
            {col2.map((item) => (
              <PhotoItem
                key={item.photo.src}
                photo={item.photo}
                onClick={() => setActiveIndex(item.idx)}
                compact
              />
            ))}
          </div>
        </div>

        <PhotoDetail
          photo={activeIndex !== null ? sorted[activeIndex] : null}
          onClose={() => setActiveIndex(null)}
          onPrev={() => setActiveIndex(i => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setActiveIndex(i => (i !== null && i < sorted.length - 1 ? i + 1 : i))}
          hasPrev={activeIndex !== null && activeIndex > 0}
          hasNext={activeIndex !== null && activeIndex < sorted.length - 1}
        />
      </>
    );
  }

  /* ── Mobile: single column ── */
  return (
    <>
      <div style={{ maxWidth: '720px', margin: '0 auto', paddingTop: '80px', paddingBottom: '120px', padding: '80px 16px 120px' }}>
        {sorted.map((photo, i) => (
          <PhotoItem
            key={photo.src}
            photo={photo}
            prevPhoto={sorted[i - 1]}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>

      <PhotoDetail
        photo={activeIndex !== null ? sorted[activeIndex] : null}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex(i => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() => setActiveIndex(i => (i !== null && i < sorted.length - 1 ? i + 1 : i))}
        hasPrev={activeIndex !== null && activeIndex > 0}
        hasNext={activeIndex !== null && activeIndex < sorted.length - 1}
      />
    </>
  );
}
