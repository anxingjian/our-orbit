"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const PHOTO_COUNT = 25;
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) =>
  `/photos/${String(i + 1).padStart(2, "0")}.jpg`
);

type ViewState =
  | { mode: "cylinder" }
  | { mode: "grid" }
  | { mode: "detail"; index: number };

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>({ mode: "cylinder" });

  // ---- Cylinder View ----
  useEffect(() => {
    if (view.mode !== "cylinder") return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f0ed);

    const camera = new THREE.PerspectiveCamera(
      40, // Narrower FOV = less distortion
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Much larger radius = photos further away = less perspective distortion
    const radius = 22;
    const cols = 8;
    const rows = Math.ceil(PHOTOS.length / cols);
    const photoW = 4.5;
    const photoH = 3.2;
    const rowGap = 1.0;

    const photoGroup = new THREE.Group();
    const loader = new THREE.TextureLoader();
    const photoMeshes: THREE.Mesh[] = [];

    PHOTOS.forEach((src, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const stagger = row * ((Math.PI * 2) / cols / 2);
      const angle = (col / cols) * Math.PI * 2 + stagger;

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = (row - (rows - 1) / 2) * (photoH + rowGap);

      // Card backing
      const backGeo = new THREE.PlaneGeometry(photoW + 0.3, photoH + 0.3);
      const backMat = new THREE.MeshBasicMaterial({ color: 0xeae7e2, side: THREE.FrontSide });
      const back = new THREE.Mesh(backGeo, backMat);
      back.position.set(x, y, z);
      back.lookAt(0, y, 0);
      const norm = new THREE.Vector3().subVectors(new THREE.Vector3(0, y, 0), back.position).normalize();
      back.position.add(norm.clone().multiplyScalar(-0.05));
      photoGroup.add(back);

      // Photo
      const geo = new THREE.PlaneGeometry(photoW, photoH);
      const tex = loader.load(src);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.lookAt(0, y, 0);
      mesh.userData = { photoIndex: i };
      photoGroup.add(mesh);
      photoMeshes.push(mesh);
    });

    scene.add(photoGroup);

    // Interaction
    let isDragging = false;
    let prevX = 0;
    let rotationY = 0;
    let velocityY = 0;
    let autoRotate = true;
    let raf = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      autoRotate = false;
      velocityY = 0;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      velocityY = dx * 0.0008; // Slower drag
      rotationY += dx * 0.0008;
      prevX = e.clientX;
    };
    const onPointerUp = () => { isDragging = false; };

    // Click photo → detail
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPDown2 = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };
    const onClick = (e: MouseEvent) => {
      // Only trigger if not dragged
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(photoMeshes);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.photoIndex;
        if (idx !== undefined) setView({ mode: "detail", index: idx });
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.max(25, Math.min(60, camera.fov + e.deltaY * 0.03));
      camera.updateProjectionMatrix();
    };

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerdown", onPDown2);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);
    el.addEventListener("click", onClick);
    el.addEventListener("wheel", onWheel, { passive: false });

    // Hover cursor
    const onHover = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(photoMeshes);
      el.style.cursor = hits.length > 0 ? "pointer" : "grab";
    };
    el.addEventListener("mousemove", onHover);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    function animate() {
      raf = requestAnimationFrame(animate);

      if (autoRotate) {
        rotationY += 0.0006; // Much slower auto-rotate
      } else if (!isDragging) {
        rotationY += velocityY;
        velocityY *= 0.96;
        if (Math.abs(velocityY) < 0.00002) autoRotate = true;
      }

      photoGroup.rotation.y = rotationY;
      camera.lookAt(
        Math.sin(-rotationY) * 10,
        0,
        Math.cos(-rotationY) * 10
      );

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerdown", onPDown2);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
      el.removeEventListener("click", onClick);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousemove", onHover);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [view]);

  // ---- Detail View ----
  if (view.mode === "detail") {
    const idx = view.index;
    return (
      <div className="fixed inset-0 bg-[#f2f0ed] z-50 flex">
        {/* Main image area */}
        <div className="flex-1 flex items-center justify-center p-8 pr-4">
          <img
            src={PHOTOS[idx]}
            alt={`Photo ${idx + 1}`}
            className="max-h-[85vh] max-w-full object-contain rounded-md shadow-lg"
          />
        </div>

        {/* Right sidebar: vertical carousel */}
        <div className="w-20 sm:w-24 flex flex-col items-center py-6 gap-2 overflow-y-auto scrollbar-hide">
          {PHOTOS.map((src, i) => (
            <button
              key={i}
              onClick={() => setView({ mode: "detail", index: i })}
              className={`w-14 h-14 sm:w-18 sm:h-18 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === idx
                  ? "border-neutral-800 opacity-100 scale-105"
                  : "border-transparent opacity-50 hover:opacity-80"
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

        {/* Close / Back button */}
        <button
          onClick={() => setView({ mode: "cylinder" })}
          className="absolute top-5 left-6 text-sm text-neutral-500 hover:text-black transition-colors z-10"
        >
          ✕
        </button>

        {/* Keyboard nav */}
        <KeyboardNav
          onPrev={() => setView({ mode: "detail", index: (idx - 1 + PHOTOS.length) % PHOTOS.length })}
          onNext={() => setView({ mode: "detail", index: (idx + 1) % PHOTOS.length })}
          onClose={() => setView({ mode: "cylinder" })}
        />
      </div>
    );
  }

  // ---- Grid View ----
  if (view.mode === "grid") {
    return (
      <div className="min-h-screen bg-[#f2f0ed]">
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#f2f0ed]/80 backdrop-blur-sm">
          <button
            onClick={() => setView({ mode: "cylinder" })}
            className="text-sm text-neutral-500 hover:text-black transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-sm tracking-[0.25em] text-neutral-400 uppercase">
            All Images
          </h1>
          <span className="text-sm text-neutral-400">{PHOTOS.length}</span>
        </div>
        <div className="pt-20 pb-16 px-4 sm:px-8 md:px-16">
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3 sm:gap-4">
            {PHOTOS.map((src, i) => (
              <div key={i} className="mb-3 sm:mb-4 break-inside-avoid">
                <button onClick={() => setView({ mode: "detail", index: i })} className="w-full">
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    loading="lazy"
                    className="w-full rounded-sm shadow-sm hover:shadow-md transition-shadow duration-300"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Cylinder View ----
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f2f0ed]">
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* Top: site name */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 20 }}>
        <h1 className="text-sm tracking-[0.3em] text-neutral-400 uppercase select-none">
          Our Orbit
        </h1>
      </div>

      {/* Center: black sphere (CSS) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
        <button
          onClick={() => setView({ mode: "grid" })}
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#111] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer"
        >
          <span className="text-white text-base sm:text-lg font-light tracking-[0.15em]">
            Enter
          </span>
        </button>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 20 }}>
        <span className="text-xs tracking-[0.2em] text-neutral-400 uppercase select-none">
          A & M
        </span>
      </div>
    </div>
  );
}

// Keyboard navigation for detail view
function KeyboardNav({
  onPrev,
  onNext,
  onClose,
}: {
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") onPrev();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") onNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext, onClose]);
  return null;
}
