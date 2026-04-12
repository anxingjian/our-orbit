'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from './PhotoList';

interface PhotoDetailProps {
  photo: Photo | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function PhotoDetail({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: PhotoDetailProps) {
  // 键盘控制
  useEffect(() => {
    if (!photo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photo, onClose, onPrev, onNext, hasPrev, hasNext]);

  // 锁定 body 滚动
  useEffect(() => {
    if (photo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [photo]);

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(250, 249, 246, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          {/* 照片容器 */}
          <motion.div
            key={photo.src}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 'min(90vw, 800px)',
              width: '100%',
            }}
          >
            {/* 照片 */}
            <div style={{
              borderRadius: '4px',
              overflow: 'hidden',
              lineHeight: 0,
              boxShadow: '0 8px 40px rgba(28,26,23,0.10)',
              maxHeight: '75vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.title || ''}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* 标题 + 日期 */}
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              {photo.title && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'var(--color-text)',
                  letterSpacing: '0.01em',
                }}>
                  {photo.title}
                </p>
              )}
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.06em',
              }}>
                {formatDateFull(photo.date)}
              </p>
            </div>
          </motion.div>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '20px',
              lineHeight: 1,
              padding: '8px',
              opacity: 0.6,
            }}
            aria-label="关闭"
          >
            ×
          </button>

          {/* 左右切换 */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              style={{
                position: 'fixed',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '24px',
                padding: '12px',
                opacity: 0.5,
              }}
              aria-label="上一张"
            >
              ‹
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              style={{
                position: 'fixed',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '24px',
                padding: '12px',
                opacity: 0.5,
              }}
              aria-label="下一张"
            >
              ›
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
