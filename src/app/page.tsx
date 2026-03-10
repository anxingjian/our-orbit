"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/*
 * Our Orbit — Cylinder Photo Gallery
 *
 * Photos are mapped onto the inner surface of a cylinder.
 * User drags to rotate, scroll to zoom slightly.
 * Photos arranged in a spiral or grid pattern on the cylinder's inner wall.
 * Camera sits inside the cylinder looking outward.
 */

// Placeholder: list photo filenames from public/photos/
// In production, these would be dynamically loaded
const PHOTOS: string[] = [];

// Generate demo gradient textures if no photos exist
function createDemoTexture(index: number): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d")!;

  const hue = (index * 37) % 360;
  const grad = ctx.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, `hsl(${hue}, 40%, 25%)`);
  grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 35%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "bold 48px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${index + 1}`, 200, 150);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ---- Scene Setup ----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.15);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ---- Cylinder Parameters ----
    const cylinderRadius = 8;
    const cylinderHeight = 12;
    const photosPerRing = 8;
    const rings = 3;
    const photoWidth = 2.2;
    const photoHeight = 1.6;
    const gap = 0.3;

    // ---- Create Photo Planes on Cylinder Inner Wall ----
    const photoGroup = new THREE.Group();
    const photoMeshes: THREE.Mesh[] = [];

    // Load real photos or use demos
    const loader = new THREE.TextureLoader();
    let photoFiles: string[] = PHOTOS;

    // Try to fetch photo manifest
    fetch("/photos/manifest.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((files: string[]) => {
        if (files.length > 0) photoFiles = files;
        buildGallery();
      })
      .catch(() => buildGallery());

    function buildGallery() {
      const totalPhotos = Math.max(photoFiles.length, photosPerRing * rings);

      for (let i = 0; i < totalPhotos; i++) {
        const ring = Math.floor(i / photosPerRing);
        const indexInRing = i % photosPerRing;
        const angleOffset = ring * ((Math.PI * 2) / photosPerRing / 2); // Stagger rings
        const angle =
          (indexInRing / photosPerRing) * Math.PI * 2 + angleOffset;

        // Position on cylinder inner wall, facing inward
        const x = Math.sin(angle) * cylinderRadius;
        const z = Math.cos(angle) * cylinderRadius;
        const y =
          (ring - (rings - 1) / 2) * (photoHeight + gap);

        const geometry = new THREE.PlaneGeometry(photoWidth, photoHeight);

        let texture: THREE.Texture;
        if (i < photoFiles.length) {
          texture = loader.load(`/photos/${photoFiles[i]}`);
          texture.colorSpace = THREE.SRGBColorSpace;
        } else {
          texture = createDemoTexture(i);
        }

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.FrontSide,
          transparent: true,
          opacity: 0.9,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        // Face inward (toward center)
        mesh.lookAt(0, y, 0);

        photoGroup.add(mesh);
        photoMeshes.push(mesh);
      }

      scene.add(photoGroup);
      setLoading(false);
    }

    // ---- Ambient particles (dust/stars) ----
    const particleCount = 500;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * (cylinderRadius - 1.5);
      particlePositions[i * 3] = Math.sin(angle) * r;
      particlePositions[i * 3 + 1] =
        (Math.random() - 0.5) * cylinderHeight * 1.2;
      particlePositions[i * 3 + 2] = Math.cos(angle) * r;
    }
    particleGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.3,
    });
    scene.add(new THREE.Points(particleGeom, particleMat));

    // ---- Interaction: drag to rotate ----
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotationY = 0; // Horizontal rotation
    let rotationX = 0; // Vertical look
    let velocityY = 0;
    let autoRotate = true;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      autoRotate = false;
      velocityY = 0;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      velocityY = dx * 0.003;
      rotationY += dx * 0.003;
      rotationX = Math.max(
        -0.5,
        Math.min(0.5, rotationX - dy * 0.002)
      );
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    // Scroll to zoom (adjust FOV)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.max(30, Math.min(90, camera.fov + e.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointerleave", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    // ---- Resize ----
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ---- Animate ----
    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);

      // Auto-rotate slowly when not interacting
      if (autoRotate) {
        rotationY += 0.001;
      } else if (!isDragging) {
        // Inertia
        rotationY += velocityY;
        velocityY *= 0.95;
        if (Math.abs(velocityY) < 0.00005) {
          autoRotate = true;
        }
      }

      // Camera looks outward from center, rotating around Y axis
      const lookX = Math.sin(rotationY) * 10;
      const lookZ = Math.cos(rotationY) * 10;
      const lookY = rotationX * 10;
      camera.lookAt(lookX, lookY, lookZ);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-screen h-screen relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-white/40 text-sm tracking-widest uppercase">
            Our Orbit
          </p>
        </div>
      )}
      {/* Title overlay */}
      <div className="absolute bottom-8 left-8 z-10 pointer-events-none select-none">
        <h1 className="text-white/20 text-xs tracking-[0.3em] uppercase">
          Our Orbit
        </h1>
      </div>
    </div>
  );
}
