'use client';

import { useMemo } from 'react';
import type { Photo } from '@/components/PhotoList';

interface MasonryGridProps {
  photos: Photo[];
  cols?: number;
  gap?: number;
  onSelect: (photo: Photo, index: number) => void;
  renderCell?: (photo: Photo, index: number) => React.ReactNode;
}

export default function MasonryGrid({
  photos,
  cols = 4,
  gap = 7,
  onSelect,
  renderCell,
}: MasonryGridProps) {
  // JS 分列：每张照片放入当前最矮的列
  const columns = useMemo(() => {
    const cols_arr: Photo[][] = Array.from({ length: cols }, () => []);
    const colHeights = Array(cols).fill(0);

    photos.forEach((photo) => {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      cols_arr[shortestCol].push(photo);
      // 用宽高比估算相对高度（以列宽 1 为单位）
      colHeights[shortestCol] += photo.height / photo.width;
    });

    return cols_arr;
  }, [photos, cols]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: `${gap}px`,
      alignItems: 'start',
    }}>
      {columns.map((colPhotos, colIndex) => (
        <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
          {colPhotos.map((photo) => {
            const globalIndex = photos.indexOf(photo);
            return (
              <div
                key={photo.src}
                onClick={() => onSelect(photo, globalIndex)}
                style={{ cursor: 'pointer', lineHeight: 0 }}
              >
                {renderCell ? renderCell(photo, globalIndex) : (
                  <DefaultCell photo={photo} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DefaultCell({ photo }: { photo: Photo }) {
  return (
    <div style={{ borderRadius: '2px', overflow: 'hidden', background: '#f0ece8' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.title || ''}
        loading="lazy"
        style={{
          width: '100%', height: 'auto', display: 'block',
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      />
    </div>
  );
}
