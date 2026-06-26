"use client";

/* eslint-disable @next/next/no-img-element */

// Cursor image-trail overlay for the hero. Renders the trail items and wires up
// the GSAP-driven animation on mount. Each item's photo is clipped into one of
// the hero SVG shapes (chosen at random) via a CSS mask.

import { useEffect, useState } from "react";
import { initImageTrail } from "@/app/javascript/hero-cursor";
import "@/app/hero.css";

const TRAIL_IMAGES = [
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f69cd4f5ebc0676bf_cursor-trail-1.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f5d1c4cf365a233ea_cursor-trail-2.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f41234aeca6122868_cursor-trail-3.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f26b40ce34b76bd14_cursor-trail-4.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9ff0e9944f7a772a8c_cursor-trail-5.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f0bd979d3d6280fc8_cursor-trail-6.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9ff0cb7ef9ce6d4b4a_cursor-trail-7.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f7bf12612bbb66235_cursor-trail-8.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9f916943fe31e14fe7_cursor-trail-9.avif",
  "https://cdn.prod.website-files.com/679b7e7de9b9ad0339d5524e/679b8e9fcba222367b58fd97_cursor-trail-10.avif",
];

// Lightweight shape-only masks (outline extracted from the heavy hero SVGs).
const SHAPES = [
  "/icons/hero/mask/shape_hero.svg",
  "/icons/hero/mask/shape_hero_2.svg",
  "/icons/hero/mask/shape_hero_3.svg",
  "/icons/hero/mask/shape_hero_4.svg",
  "/icons/hero/mask/shape_hero_5.svg",
];

const randomShape = () => SHAPES[Math.floor(Math.random() * SHAPES.length)];

export default function HeroCursorTrail() {
  // Deterministic mapping for SSR, then randomized on the client to avoid a
  // hydration mismatch. Items are hidden until hover, so there's no flash.
  const [shapes, setShapes] = useState(() => TRAIL_IMAGES.map((_, i) => SHAPES[i % SHAPES.length]));

  useEffect(() => {
    const id = requestAnimationFrame(() => setShapes(TRAIL_IMAGES.map(randomShape)));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const cleanup = initImageTrail({
      minWidth: 992,
      moveDistance: 15,
      stopDuration: 350,
      trailLength: 8,
    });

    return () => cleanup?.();
  }, []);

  return (
    <div className="trail-wrap" aria-hidden="true">
      <div className="trail-list">
        {TRAIL_IMAGES.map((src, i) => (
          <div
            key={i}
            data-trail="item"
            className="trail-item"
            style={{ maskImage: `url(${shapes[i]})`, WebkitMaskImage: `url(${shapes[i]})` }}
          >
            <img src={src} alt="" className="trail-item__img" />
          </div>
        ))}
      </div>
    </div>
  );
}
