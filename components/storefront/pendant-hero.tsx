"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Interactive pendant hero. The lamp photo sits on the cream canvas (white
 * blended away via multiply); hovering a lamp "turns its light on" — a warm
 * bloom + soft beam fades in from its shade. Touch devices get a gentle
 * auto-cycle so the effect is visible without a cursor.
 *
 * Coordinates below are % of the image box, tuned to each lamp's shade opening.
 */
const LAMPS = [
  { name: "sand", hot: { l: 4, t: 56, w: 24, h: 26 }, x: 17.5, y: 75, w: 21 }, // lower-left
  { name: "cream", hot: { l: 21, t: 34, w: 26, h: 26 }, x: 35, y: 56, w: 24 }, // upper-left
  { name: "olive", hot: { l: 54, t: 36, w: 24, h: 24 }, x: 64, y: 58, w: 20 }, // upper-right
  { name: "black", hot: { l: 37, t: 58, w: 28, h: 30 }, x: 50.5, y: 81, w: 26 }, // center
  { name: "terracotta", hot: { l: 70, t: 60, w: 24, h: 24 }, x: 80.5, y: 78, w: 20 }, // lower-right
];

export function PendantHero() {
  const [active, setActive] = useState<number | null>(null);
  const hoverCapable = useRef(true);

  // Touch / no-hover devices: gently cycle the lamps so the effect is alive.
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
    <div className="relative mx-auto w-full max-w-[760px]">
      <Image
        src="/images/pendants.png"
        alt="Suspensions Lighty — cinq finitions"
        width={1023}
        height={941}
        priority
        sizes="(max-width: 768px) 92vw, 760px"
        className="h-auto w-full select-none [mix-blend-mode:multiply]"
        draggable={false}
      />

      {/* Light blooms — one per lamp, off until active */}
      {LAMPS.map((lamp, i) => (
        <div
          key={lamp.name}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ease-out"
          style={{
            left: `${lamp.x}%`,
            top: `${lamp.y}%`,
            width: `${lamp.w}%`,
            aspectRatio: "1.5 / 1",
            opacity: active === i ? 1 : 0,
            background:
              "radial-gradient(50% 60% at 50% 35%, rgba(255,243,210,.95), rgba(244,184,96,.55) 45%, rgba(244,184,96,0) 75%)",
            filter: "blur(6px)",
            zIndex: 2,
          }}
        />
      ))}

      {/* Soft downward beam per lamp */}
      {LAMPS.map((lamp, i) => (
        <div
          key={`${lamp.name}-beam`}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 transition-opacity duration-500 ease-out"
          style={{
            left: `${lamp.x}%`,
            top: `${lamp.y}%`,
            width: `${lamp.w * 1.05}%`,
            height: `${100 - lamp.y}%`,
            opacity: active === i ? 0.7 : 0,
            background:
              "linear-gradient(180deg, rgba(244,184,96,.4), rgba(244,184,96,0) 78%)",
            clipPath: "polygon(34% 0, 66% 0, 100% 100%, 0 100%)",
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
  );
}
