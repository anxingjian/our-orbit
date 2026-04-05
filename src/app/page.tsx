"use client";

import { useState, useEffect } from "react";

const PHOTO_COUNT = 25;
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) =>
  `/photos/${String(i + 1).padStart(2, "0")}.jpg`
);

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0ebe0",
        padding: "0",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem 0",
          background: "rgba(240,235,224,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <h1
          style={{
            fontSize: "0.6875rem",
            letterSpacing: "0.4em",
            color: "#b0a898",
            textTransform: "uppercase",
            fontWeight: 300,
            userSelect: "none",
          }}
        >
          Our Orbit
        </h1>
      </header>

      {/* Masonry Grid */}
      <main
        style={{
          padding: "1.5rem",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <MasonryGrid photos={PHOTOS} onSelect={setSelected} />
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "3rem 0 2rem",
        }}
      >
        <span
          style={{
            fontSize: "0.625rem",
            letterSpacing: "0.25em",
            color: "#c8bfb4",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          A &amp; M
        </span>
      </footer>

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

function MasonryGrid({
  photos,
  onSelect,
}: {
  photos: string[];
  onSelect: (i: number) => void;
}) {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setColumns(2);
      else if (w < 1024) setColumns(3);
      else setColumns(4);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Distribute photos into columns
  const cols: number[][] = Array.from({ length: columns }, () => []);
  photos.forEach((_, i) => {
    cols[i % columns].push(i);
  });

  const gap = "10px";

  return (
    <div
      style={{
        display: "flex",
        gap,
        alignItems: "flex-start",
      }}
    >
      {cols.map((colIndices, colIdx) => (
        <div
          key={colIdx}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap,
          }}
        >
          {colIndices.map((photoIdx) => (
            <PhotoCard
              key={photoIdx}
              src={photos[photoIdx]}
              index={photoIdx}
              onClick={() => onSelect(photoIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function PhotoCard({
  src,
  index,
  onClick,
}: {
  src: string;
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        transform: hovered ? "scale(1.015)" : "scale(1)",
        transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.35s",
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        position: "relative",
        background: "#e8e2d8",
      }}
    >
      <img
        src={src}
        alt={`Photo ${index + 1}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
        draggable={false}
      />
      {/* Subtle warm overlay on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(240,230,210,0.08)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s",
          pointerEvents: "none",
        }}
      />
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10,9,8,0.93)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* Image */}
      <div
        style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[index]}
          alt={`Photo ${index + 1}`}
          style={{
            maxHeight: "88vh",
            maxWidth: "88vw",
            objectFit: "contain",
            borderRadius: "4px",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
            display: "block",
          }}
        />
      </div>

      {/* Counter */}
      <div
        style={{
          position: "absolute",
          bottom: "1.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "monospace",
          fontSize: "0.5625rem",
          letterSpacing: "0.35em",
          color: "rgba(255,255,255,0.28)",
          userSelect: "none",
        }}
      >
        {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
      </div>

      {/* Close */}
      <LightboxBtn
        onClick={onClose}
        style={{ position: "absolute", top: "1.25rem", left: "1.5rem", fontSize: "1.125rem" }}
      >
        ✕
      </LightboxBtn>

      {/* Prev */}
      <LightboxBtn
        onClick={(e) => { e.stopPropagation(); onChange((index - 1 + photos.length) % photos.length); }}
        style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", fontSize: "2rem", padding: "1rem 0.875rem" }}
      >
        ‹
      </LightboxBtn>

      {/* Next */}
      <LightboxBtn
        onClick={(e) => { e.stopPropagation(); onChange((index + 1) % photos.length); }}
        style={{ position: "absolute", right: "1.25rem", top: "50%", transform: "translateY(-50%)", fontSize: "2rem", padding: "1rem 0.875rem" }}
      >
        ›
      </LightboxBtn>
    </div>
  );
}

function LightboxBtn({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick: React.MouseEventHandler;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.32)",
        transition: "color 0.2s",
        lineHeight: 1,
        padding: "0.5rem",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
