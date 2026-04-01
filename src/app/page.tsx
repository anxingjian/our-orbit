"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

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
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generatePlacements(count: number): PhotoPlacement[] {
  const rand = seededRandom(42);
  const placements: PhotoPlacement[] = [];

  // Spread photos across a large canvas area
  const canvasW = 4000;
  const canvasH = 3200;
  const cols = 5;
  const rows = Math.ceil(count / cols);
  const cellW = canvasW / cols;
  const cellH = canvasH / rows;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const baseX = col * cellW + cellW * 0.15;
    const baseY = row * cellH + cellH * 0.15;

    const w = 220 + rand() * 120; // 220-340
    const h = w * (0.65 + rand() * 0.5); // varying aspect ratios

    placements.push({
      x: baseX + (rand() - 0.5) * cellW * 0.5,
      y: baseY + (rand() - 0.5) * cellH * 0.4,
      rotation: (rand() - 0.5) * 8,
      scale: 0.9 + rand() * 0.2,
      width: w,
      height: h,
    });
  }
  return placements;
}

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const placements = useMemo(() => generatePlacements(PHOTO_COUNT), []);

  // Canvas drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const didDrag = useRef(false);

  // Center the canvas on mount
  useEffect(() => {
    if (containerRef.current) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Center on middle of the photo field
      setOffset({
        x: vw / 2 - 2000,
        y: vh / 2 - 1600,
      });
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    didDrag.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setOffset({
      x: dragStart.current.ox + dx,
      y: dragStart.current.oy + dy,
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#f0ebe0]"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
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
          {PHOTOS.map((src, i) => {
            const p = placements[i];
            const isHovered = hoveredIdx === i;
            return (
              <div
                key={i}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  left: p.x,
                  top: p.y,
                  transform: `rotate(${isHovered ? 0 : p.rotation}deg) scale(${isHovered ? 1.06 : p.scale})`,
                  zIndex: isHovered ? 100 : 1,
                  filter: isHovered
                    ? "drop-shadow(0 24px 48px rgba(0,0,0,0.2))"
                    : "drop-shadow(0 4px 16px rgba(0,0,0,0.08))",
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  if (!didDrag.current) setSelected(i);
                }}
              >
                <div className="bg-white p-2 rounded-sm" style={{ width: p.width }}>
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    loading="lazy"
                    className="w-full h-auto block"
                    style={{ height: p.height, objectFit: "cover" }}
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
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex"
      onClick={onClose}
    >
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[index]}
          alt={`Photo ${index + 1}`}
          className="max-h-[88vh] max-w-[calc(100%-120px)] object-contain rounded-sm"
        />
      </div>

      <div
        className="w-20 sm:w-24 flex flex-col items-center py-6 gap-2 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: "none" }}
      >
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
              i === index
                ? "border-white opacity-100"
                : "border-transparent opacity-40 hover:opacity-70"
            }`}
          >
            <img
              src={src}
              alt={`Thumb ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="absolute top-5 left-6 text-white/60 hover:text-white text-2xl transition-colors"
      >
        ✕
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((index - 1 + photos.length) % photos.length);
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-3xl transition-colors"
      >
        ‹
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((index + 1) % photos.length);
        }}
        className="absolute right-28 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-3xl transition-colors"
      >
        ›
      </button>
    </div>
  );
}
