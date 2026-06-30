"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Interactive pendant hero. The lamp photo sits on the cream canvas (white
 * blended away via multiply); hovering a lamp casts a warm spotlight beam down
 * from its shade. Touch devices gently auto-cycle so the effect is visible.
 *
 * The image is clipped at the top (translateY) to shorten the cords so all five
 * lamps fit without scrolling. Overlays live INSIDE the shifted layer, so their
 * percentages stay relative to the full image and remain aligned.
 *
 * `cx` = lamp horizontal centre, `top` = shade mouth (beam origin), `w` = beam
 * width — all % of the full image.
 */
const LAMPS = [
  { name: "sand", hot: { l: 4, t: 56, w: 24, h: 26 }, cx: 22, top: 74, w: 19 },
  { name: "cream", hot: { l: 21, t: 34, w: 26, h: 26 }, cx: 35, top: 57, w: 23 },
  { name: "olive", hot: { l: 54, t: 36, w: 24, h: 24 }, cx: 63.5, top: 59, w: 19 },
  { name: "black", hot: { l: 37, t: 58, w: 28, h: 30 }, cx: 50.5, top: 82, w: 26 },
  { name: "terracotta", hot: { l: 70, t: 60, w: 24, h: 24 }, cx: 78, top: 78, w: 19 },
];

const CROP = 24; // % of the image height trimmed off the top (shorter cords)

export function PendantHero() {
  const [active, setActive] = useState<number | null>(null);
  const hoverCapable = useRef(true);

  useEffect(() => {
    hoverCapable.current = window.matchMedia("(hover: hover)").matches;
    if (hoverCapable.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(3);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % LAMPS.length;
      setActive(i);
    }, 1600);
    setActive(0);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-[720px] overflow-hidden"
      style={{ aspectRatio: `1023 / ${Math.round(941 * (1 - CROP / 100))}` }}
    >
      <div className="absolute inset-x-0 top-0" style={{ transform: `translateY(-${CROP}%)` }}>
        <Image
          src="/images/pendants.png"
          alt="Suspensions Lighty — cinq finitions"
          width={1023}
          height={941}
          priority
          sizes="(max-width: 768px) 92vw, 720px"
          className="h-auto w-full select-none [mix-blend-mode:multiply]"
          draggable={false}
        />

        {/* Spotlight beams — centred under each lamp, off until active */}
        {LAMPS.map((lamp, i) => (
          <div
            key={`${lamp.name}-beam`}
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 transition-opacity duration-500 ease-out"
            style={{
              left: `${lamp.cx}%`,
              top: `${lamp.top}%`,
              width: `${lamp.w}%`,
              height: `${98 - lamp.top}%`,
              opacity: active === i ? 1 : 0,
              background:
                "radial-gradient(120% 100% at 50% 0%, rgba(255,245,214,.95), rgba(244,184,96,.42) 32%, rgba(244,184,96,.12) 60%, rgba(244,184,96,0) 82%)",
              clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)",
              filter: "blur(7px)",
              zIndex: 1,
            }}
          />
        ))}

        {/* Hover hotspots (desktop) */}
        {hoverCapable.current &&
          LAMPS.map((lamp, i) => (
            <button
              key={`${lamp.name}-hot`}
              type="button"
              aria-label={`Allumer la suspension ${lamp.name}`}
              className="absolute cursor-pointer rounded-full focus:outline-none"
              style={{ left: `${lamp.hot.l}%`, top: `${lamp.hot.t}%`, width: `${lamp.hot.w}%`, height: `${lamp.hot.h}%`, zIndex: 3 }}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive((cur) => (cur === i ? null : cur))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((cur) => (cur === i ? null : cur))}
            />
          ))}
      </div>
    </div>
  );
}
