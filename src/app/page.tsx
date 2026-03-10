"use client";

import { useState, useEffect, useRef, useMemo } from "react";

const PHOTO_COUNT = 25;
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) =>
  `/photos/${String(i + 1).padStart(2, "0")}.jpg`
);

interface PhotoLayout {
  x: number; // % from left
  y: number; // px from top
  rotation: number; // degrees
  scale: number;
  zIndex: number;
}

function generateLayouts(count: number): PhotoLayout[] {
  // Seed-based random for consistent layout across renders
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  const layouts: PhotoLayout[] = [];
  const cols = 4;
  const rowHeight = 420;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Base grid position with randomness
    const baseX = (col / cols) * 80 + 5; // 5-85% range
    const baseY = row * rowHeight + 80;

    layouts.push({
      x: baseX + (rand() - 0.5) * 15,
      y: baseY + (rand() - 0.5) * 80,
      rotation: (rand() - 0.5) * 12, // -6 to 6 degrees
      scale: 0.85 + rand() * 0.3,
      zIndex: Math.floor(rand() * 10),
    });
  }
  return layouts;
}

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hoveredZ, setHoveredZ] = useState<number | null>(null);
  const layouts = useMemo(() => generateLayouts(PHOTO_COUNT), []);

  const totalHeight = useMemo(() => {
    const maxY = Math.max(...layouts.map((l) => l.y));
    return maxY + 500;
  }, [layouts]);

  return (
    <div className="min-h-screen bg-[#f0ebe0] relative" style={{ cursor: "default" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-6 pointer-events-none">
        <h1 className="text-sm tracking-[0.4em] text-neutral-400 uppercase select-none font-light">
          Our Orbit
        </h1>
      </header>

      {/* Scattered photos */}
      <div className="relative" style={{ minHeight: totalHeight }}>
        {PHOTOS.map((src, i) => {
          const l = layouts[i];
          const isHovered = hoveredZ === i;
          return (
            <div
              key={i}
              className="absolute transition-all duration-500 ease-out"
              style={{
                left: `${l.x}%`,
                top: l.y,
                transform: `rotate(${isHovered ? 0 : l.rotation}deg) scale(${isHovered ? 1.08 : l.scale})`,
                zIndex: isHovered ? 100 : l.zIndex,
                filter: isHovered
                  ? "drop-shadow(0 20px 40px rgba(0,0,0,0.2))"
                  : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
              }}
              onMouseEnter={() => setHoveredZ(i)}
              onMouseLeave={() => setHoveredZ(null)}
              onClick={() => setSelected(i)}
            >
              <div className="bg-white p-2 sm:p-3 rounded-sm cursor-pointer">
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  loading="lazy"
                  className="w-44 sm:w-56 md:w-64 h-auto block"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
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
      {/* Main image */}
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

      {/* Right sidebar carousel */}
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

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 left-6 text-white/60 hover:text-white text-2xl transition-colors"
      >
        ✕
      </button>

      {/* Nav arrows */}
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
