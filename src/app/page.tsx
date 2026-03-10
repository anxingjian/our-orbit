"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/*
 * Our Orbit — OpenPurpose-style Cylinder Gallery
 *
 * White background. Photos on cylinder inner wall with perspective.
 * Large black sphere in center with rotating text.
 * Click sphere → transitions to grid gallery ("All Images").
 * Drag to rotate cylinder. Auto-rotate when idle.
 */

const PHOTO_COUNT = 25;
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) =>
  `/photos/${String(i + 1).padStart(2, "0")}.jpg`
);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"cylinder" | "grid">("cylinder");
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    photoGroup: THREE.Group;
    sphere: THREE.Mesh;
    raf: number;
    rotationY: number;
    velocityY: number;
    isDragging: boolean;
    prevX: number;
    autoRotate: boolean;
  } | null>(null);

  // ---- Cylinder View (Three.js) ----
  useEffect(() => {
    if (view !== "cylinder") return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f0ed);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // ---- Photo layout on cylinder ----
    const radius = 9;
    const cols = 8; // photos per ring
    const rows = Math.ceil(PHOTOS.length / cols);
    const photoW = 2.4;
    const photoH = 1.7;
    const rowGap = 0.6;

    const photoGroup = new THREE.Group();
    const loader = new THREE.TextureLoader();

    PHOTOS.forEach((src, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const stagger = row * ((Math.PI * 2) / cols / 2);
      const angle = (col / cols) * Math.PI * 2 + stagger;

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = (row - (rows - 1) / 2) * (photoH + rowGap);

      const geo = new THREE.PlaneGeometry(photoW, photoH);
      const tex = loader.load(src);
      tex.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.92,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.lookAt(0, y, 0);

      // Subtle shadow/card effect via a backing plane
      const backGeo = new THREE.PlaneGeometry(photoW + 0.15, photoH + 0.15);
      const backMat = new THREE.MeshBasicMaterial({
        color: 0xe8e5e0,
        side: THREE.FrontSide,
      });
      const back = new THREE.Mesh(backGeo, backMat);
      back.position.copy(mesh.position);
      back.quaternion.copy(mesh.quaternion);
      // Push back slightly behind photo
      const normal = new THREE.Vector3(0, 0, -1).applyQuaternion(mesh.quaternion);
      back.position.add(normal.multiplyScalar(0.02));

      photoGroup.add(back);
      photoGroup.add(mesh);
    });

    scene.add(photoGroup);

    // ---- Black Sphere (center) ----
    const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    // ---- Interaction ----
    let isDragging = false;
    let prevX = 0;
    let rotationY = 0;
    let velocityY = 0;
    let autoRotate = true;

    const state = {
      renderer,
      scene,
      camera,
      photoGroup,
      sphere,
      raf: 0,
      rotationY,
      velocityY,
      isDragging,
      prevX,
      autoRotate,
    };
    sceneRef.current = state;

    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.prevX = e.clientX;
      state.autoRotate = false;
      state.velocityY = 0;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.prevX;
      state.velocityY = dx * 0.002;
      state.rotationY += dx * 0.002;
      state.prevX = e.clientX;
    };
    const onPointerUp = () => {
      state.isDragging = false;
    };

    // Click on sphere → grid view
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(sphere);
      if (hits.length > 0) {
        setView("grid");
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.max(30, Math.min(80, camera.fov + e.deltaY * 0.04));
      camera.updateProjectionMatrix();
    };

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);
    el.addEventListener("click", onClick);
    el.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ---- Animate ----
    function animate() {
      state.raf = requestAnimationFrame(animate);

      if (state.autoRotate) {
        state.rotationY += 0.0015;
      } else if (!state.isDragging) {
        state.rotationY += state.velocityY;
        state.velocityY *= 0.96;
        if (Math.abs(state.velocityY) < 0.00003) state.autoRotate = true;
      }

      // Rotate the photo group instead of the camera
      photoGroup.rotation.y = state.rotationY;

      // Camera looks forward
      camera.lookAt(
        Math.sin(-state.rotationY) * 10,
        0,
        Math.cos(-state.rotationY) * 10
      );

      renderer.render(scene, camera);
    }
    animate();

    // Cursor: pointer on sphere
    const onHover = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(sphere);
      el.style.cursor = hits.length > 0 ? "pointer" : "grab";
    };
    el.addEventListener("mousemove", onHover);

    return () => {
      cancelAnimationFrame(state.raf);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
      el.removeEventListener("click", onClick);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousemove", onHover);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [view]);

  // ---- Grid View ----
  if (view === "grid") {
    return (
      <div className="min-h-screen bg-[#f2f0ed]">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
          <button
            onClick={() => setView("cylinder")}
            className="text-sm text-neutral-500 hover:text-black transition-colors tracking-wide"
          >
            ← Back
          </button>
          <h1 className="text-sm tracking-[0.25em] text-neutral-400 uppercase">
            Our Orbit
          </h1>
          <span className="text-sm text-neutral-400">
            {PHOTOS.length} photos
          </span>
        </div>

        {/* Grid */}
        <div className="pt-20 pb-16 px-4 sm:px-8 md:px-16">
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3 sm:gap-4">
            {PHOTOS.map((src, i) => (
              <div key={i} className="mb-3 sm:mb-4 break-inside-avoid">
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  loading="lazy"
                  className="w-full rounded-sm shadow-sm hover:shadow-md transition-shadow duration-300"
                />
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
      <div ref={containerRef} className="w-full h-full" />

      {/* Top center: site name */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <h1 className="text-sm tracking-[0.3em] text-neutral-400 uppercase select-none">
          Our Orbit
        </h1>
      </div>

      {/* Center sphere label (CSS overlay, synced with Three.js sphere) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-white text-xl font-light tracking-widest select-none">
          Enter
        </div>
      </div>

      {/* Bottom: about link */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <span className="text-xs tracking-[0.2em] text-neutral-400 uppercase select-none">
          A & M
        </span>
      </div>
    </div>
  );
}
