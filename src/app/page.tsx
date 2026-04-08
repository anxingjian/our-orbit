"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PHOTO_COUNT = 25;
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) =>
  `/photos/${String(i + 1).padStart(2, "0")}.jpg`
);

interface PhotoPlacement {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width: number;
  height: number;
  zBase: number;
  tint: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generatePlacements(count: number, mobile: boolean): PhotoPlacement[] {
  const rand = seededRandom(42);
  const placements: PhotoPlacement[] = [];

  const canvasW = mobile ? 1200 : 2800;
  const canvasH = mobile ? 1800 : 2200;
  const cols = mobile ? 3 : 5;
  const rows = Math.ceil(count / cols);
  const cellW = canvasW / cols;
  const cellH = canvasH / rows;

  const zBases = Array.from({ length: count }, (_, i) => i);
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(rand() * (count - 1));
    [zBases[idx], zBases[idx + 1]] = [zBases[idx + 1], zBases[idx]];
  }

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const baseX = col * cellW + cellW * 0.15;
    const baseY = row * cellH + cellH * 0.15;

    const minW = mobile ? 90 : 180;
    const maxW = mobile ? 200 : 500;
    const w = minW + rand() * (maxW - minW);
    const isPortrait = rand() < 0.2;
    const h = isPortrait ? w * (1.2 + rand() * 0.3) : w * (0.62 + rand() * 0.28);

    const jitterX = (rand() - 0.5) * cellW * 0.55;
    const jitterY = (rand() - 0.5) * cellH * 0.45;

    placements.push({
      x: baseX + jitterX,
      y: baseY + jitterY,
      rotation: (rand() - 0.5) * 10,
      scale: 0.92 + rand() * 0.16,
      width: w,
      height: h,
      zBase: zBases[i],
      tint: rand(),
    });
  }
  return placements;
}

function getShadow(zBase: number, isHovered: boolean, count: number): string {
  if (isHovered) {
    return "drop-shadow(0 28px 56px rgba(0,0,0,0.28)) drop-shadow(0 8px 16px rgba(0,0,0,0.12))";
  }
  const depth = zBase / count;
  const blur = 8 + depth * 24;
  const alpha = 0.08 + depth * 0.1;
  return `drop-shadow(0 ${Math.round(4 + depth * 12)}px ${Math.round(blur)}px rgba(0,0,0,${alpha.toFixed(2)})) drop-shadow(0 2px 4px rgba(0,0,0,0.06))`;
}

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [placements, setPlacements] = useState<PhotoPlacement[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const didDrag = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  // Single init: detect mobile, generate placements, compute centered offset, then reveal
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 768;

    const p = generatePlacements(PHOTO_COUNT, mobile);
    setPlacements(p);

    // Center on bounding box of photos
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    p.forEach((ph) => {
      minX = Math.min(minX, ph.x);
      minY = Math.min(minY, ph.y);
      maxX = Math.max(maxX, ph.x + ph.width);
      maxY = Math.max(maxY, ph.y + ph.height);
    });
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const newOffset = { x: vw / 2 - cx, y: vh / 2 - cy };
    setOffset(newOffset);
    offsetRef.current = newOffset;

    // Small delay to let state settle before showing (avoids flash)
    requestAnimationFrame(() => setReady(true));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    didDrag.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    const newOff = {
      x: dragStart.current.ox + dx,
      y: dragStart.current.oy + dy,
    };
    setOffset(newOff);
    offsetRef.current = newOff;
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#f0ebe0]"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          opacity: 0.35,
          mixBlendMode: "multiply",
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-6 pointer-events-none">
        <h1 className="text-sm tracking-[0.4em] text-neutral-400 uppercase select-none font-light">
          Our Orbit
        </h1>
      </header>

      {/* Infinite canvas */}
      <div
        ref={containerRef}
        className="w-full h-full select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            willChange: "transform",
          }}
        >
          {placements.map((p, i) => {
            const isHovered = hoveredIdx === i;
            const src = PHOTOS[i];
            if (!src) return null;

            const r = Math.round(255 - p.tint * 8);
            const g = Math.round(252 - p.tint * 10);
            const b = Math.round(242 - p.tint * 18);
            const paperColor = `rgb(${r},${g},${b})`;

            const sidePad = Math.round(p.width * 0.045);
            const topPad = sidePad;
            const bottomPad = Math.round(p.width * 0.14);

            return (
              <div
                key={i}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  left: p.x,
                  top: p.y,
                  transform: `rotate(${isHovered ? p.rotation * 0.3 : p.rotation}deg) scale(${isHovered ? 1.05 : p.scale})`,
                  zIndex: isHovered ? 200 : p.zBase + 1,
                  filter: getShadow(p.zBase, isHovered, PHOTO_COUNT),
                  willChange: "transform, filter",
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  if (!didDrag.current) setSelected(i);
                }}
              >
                <div
                  style={{
                    background: paperColor,
                    paddingLeft: sidePad,
                    paddingRight: sidePad,
                    paddingTop: topPad,
                    paddingBottom: bottomPad,
                    width: p.width,
                    borderRadius: 2,
                    boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.6)`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.06'/%3E%3C/svg%3E")`,
                      backgroundSize: "100px 100px",
                      opacity: 0.5,
                      mixBlendMode: "multiply",
                      pointerEvents: "none",
                      borderRadius: 2,
                    }}
                  />
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    loading="eager"
                    className="block"
                    style={{
                      width: "100%",
                      height: p.height,
                      objectFit: "cover",
                      display: "block",
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <span className="text-xs tracking-[0.2em] text-neutral-300 uppercase select-none">
          A & M
        </span>
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <Lightbox
          photos={PHOTOS}
          index={selected}
          onClose={() => setSelected(null)}
          onChange={setSelected}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  // Swipe support for mobile
  const touchStart = useRef({ x: 0, y: 0 });
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) onChange((index + 1) % photos.length);
      else onChange((index - 1 + photos.length) % photos.length);
    }
  }, [index, onChange, photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        onChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [index, onClose, onChange, photos.length]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(10,9,8,0.92)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: "100%", height: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[index]}
          alt={`Photo ${index + 1}`}
          style={{
            maxHeight: "88vh",
            maxWidth: "88vw",
            objectFit: "contain",
            borderRadius: 2,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "monospace",
            fontSize: "0.625rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.3)",
            userSelect: "none",
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "1.5rem",
          color: "rgba(255,255,255,0.4)",
          background: "none",
          border: "none",
          fontSize: "1.25rem",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0.5rem",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        ✕
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((index - 1 + photos.length) % photos.length);
        }}
        style={{
          position: "absolute",
          left: "1.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.3)",
          background: "none",
          border: "none",
          fontSize: "2rem",
          cursor: "pointer",
          padding: "1rem 0.75rem",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
      >
        ‹
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((index + 1) % photos.length);
        }}
        style={{
          position: "absolute",
          right: "1.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.3)",
          background: "none",
          border: "none",
          fontSize: "2rem",
          cursor: "pointer",
          padding: "1rem 0.75rem",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
      >
        ›
      </button>
    </div>
  );
}
