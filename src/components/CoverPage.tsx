'use client';

import { useEffect, useState } from 'react';

// An 和 Ming 在一起的日期（根据实际情况改）
const TOGETHER_SINCE = new Date('2015-01-13');

export default function CoverPage() {
  const [days, setDays] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // 计算在一起的天数
    const diff = Math.floor(
      (Date.now() - TOGETHER_SINCE.getTime()) / (1000 * 60 * 60 * 24)
    );
    setDays(diff);

    // 视差滚动
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const opacity = Math.max(0, 1 - scrollY / 300);

  return (
    <section
      style={{
        height: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        position: 'relative',
        opacity,
      }}
    >
      {/* 轨道动画 */}
      <div
        style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          marginBottom: '40px',
        }}
      >
        {/* 轨道圆 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(28, 26, 23, 0.10)',
          }}
        />
        {/* 圆点 A */}
        <div
          className="dot-a"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-text)',
            marginTop: '-3px',
            marginLeft: '-3px',
          }}
        />
        {/* 圆点 B */}
        <div
          className="dot-b"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'var(--color-text-secondary)',
            marginTop: '-2.5px',
            marginLeft: '-2.5px',
            opacity: 0.5,
          }}
        />
      </div>

      {/* 标题 */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 8vw, 56px)',
          fontWeight: 500,
          color: 'var(--color-text)',
          letterSpacing: '0.01em',
          marginBottom: '16px',
          lineHeight: 1,
        }}
      >
        Our Orbit
      </h1>

      {/* 在一起第 N 天 */}
      {days > 0 && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          在一起的第 {days.toLocaleString()} 天
        </p>
      )}

      {/* 向下箭头 */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--color-text-muted)',
          fontSize: '12px',
          letterSpacing: '0.06em',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          animation: 'fadeInUp 1s ease-out 0.8s forwards',
          opacity: 0,
        }}
      >
        <span style={{ opacity: 0.5 }}>↓</span>
      </div>
    </section>
  );
}
