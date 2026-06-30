"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Lighty signature motion — Lenis smooth scroll + GSAP ScrollTrigger.
 * Ported from the design's lighty-motion.js. Content renders visible; this
 * hides [data-reveal] then lights elements on enter. Honors reduced-motion.
 *
 * Markup hooks (set in components):
 *  - [data-spotlight]  → warm cursor glow follows the pointer
 *  - [data-reveal]     → fades/rises in on scroll (optional [data-delay])
 *  - [data-lamp]       → sets --lamp:1 and reveals nested [data-glow] on enter
 *  - [data-parallax]   → subtle vertical drift on scroll
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let lenis: { raf: (t: number) => void; destroy: () => void; on: (e: string, cb: () => void) => void } | null = null;
    let rafId = 0;
    let cleanupFns: (() => void)[] = [];
    let cancelled = false;
    // mark a fresh run so re-renders/navigations re-init
    delete (root as unknown as { __lightyMotion?: boolean }).__lightyMotion;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ----- Cursor spotlight (hero) — GPU transform, no per-frame repaint -----
    // Pointer-only (never runs on touch). The glow is a fixed-size radial that
    // we move with translate3d; the rAF loop only runs while the pointer moves.
    root.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((hero) => {
      if (reduce) return;
      const SIZE = 620;
      const glow = document.createElement("div");
      glow.setAttribute("aria-hidden", "true");
      glow.style.cssText = [
        "position:absolute", "top:0", "left:0",
        `width:${SIZE}px`, `height:${SIZE}px`,
        `margin:${-SIZE / 2}px 0 0 ${-SIZE / 2}px`,
        "pointer-events:none", "z-index:2", "opacity:0",
        "transition:opacity .5s ease", "mix-blend-mode:screen", "will-change:transform",
        "background:radial-gradient(circle at center, rgba(244,184,96,.5), rgba(244,184,96,.14) 40%, transparent 68%)",
      ].join(";");
      hero.appendChild(glow);
      cleanupFns.push(() => glow.remove());

      let tx = 0, ty = 0, cx = 0, cy = 0, running = false, raf = 0;
      const loop = () => {
        cx += (tx - cx) * 0.15;
        cy += (ty - cy) * 0.15;
        glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
          raf = requestAnimationFrame(loop);
        } else {
          running = false;
        }
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = hero.getBoundingClientRect();
        tx = e.clientX - r.left;
        ty = e.clientY - r.top;
        if (glow.style.opacity !== "1") glow.style.opacity = "1";
        if (!running) { running = true; raf = requestAnimationFrame(loop); }
      };
      const onLeave = () => { glow.style.opacity = "0"; };
      hero.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerleave", onLeave);
      cleanupFns.push(() => {
        hero.removeEventListener("pointermove", onMove);
        hero.removeEventListener("pointerleave", onLeave);
        cancelAnimationFrame(raf);
      });
    });

    const lampOn = (el: HTMLElement) => {
      el.style.setProperty("--lamp", "1");
      el.querySelectorAll<HTMLElement>("[data-glow]").forEach((g) => { g.style.opacity = "1"; });
    };

    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const lamps = Array.from(root.querySelectorAll<HTMLElement>("[data-lamp]"));

    if (reduce) {
      reveals.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
      lamps.forEach(lampOn);
      return () => cleanupFns.forEach((fn) => fn());
    }

    reveals.forEach((el) => {
      el.style.willChange = "opacity, transform";
      el.style.opacity = "0";
      el.style.transform = "translateY(42px)";
      el.style.transition =
        "opacity 1s cubic-bezier(.22,.61,.36,1), transform 1.1s cubic-bezier(.22,.61,.36,1)";
    });

    const revealAll = () => {
      reveals.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.willChange = "auto";
      });
      lamps.forEach(lampOn);
    };

    (async () => {
      try {
        const [{ gsap }, stMod, lenisMod] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("lenis"),
        ]);
        if (cancelled) return;
        const ST = stMod.ScrollTrigger;
        gsap.registerPlugin(ST);

        const Lenis = lenisMod.default;
        // lerp-based (frame-rate independent) + 1:1 wheel so it feels responsive,
        // not heavy/laggy. smoothWheel only — touch stays native (smoothest on mobile).
        lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true }) as unknown as typeof lenis;
        lenis!.on("scroll", ST.update);
        const raf = (t: number) => { lenis!.raf(t); rafId = requestAnimationFrame(raf); };
        rafId = requestAnimationFrame(raf);

        const vh = () => window.innerHeight || document.documentElement.clientHeight;
        // Reveal, then drop will-change so we don't keep hundreds of permanent
        // compositor layers (a common scroll-jank source).
        const showReveal = (el: HTMLElement, delay: number) =>
          window.setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "none";
            window.setTimeout(() => { el.style.willChange = "auto"; }, 1300);
          }, delay * 1000);

        reveals.forEach((el) => {
          const delay = parseFloat(el.getAttribute("data-delay") || "0");
          if (el.getBoundingClientRect().top < vh() * 0.92) { showReveal(el, delay); return; }
          ST.create({ trigger: el, start: "top 86%", once: true, onEnter: () => showReveal(el, delay) });
        });
        lamps.forEach((el) => {
          if (el.getBoundingClientRect().top < vh() * 0.9) { lampOn(el); return; }
          ST.create({ trigger: el, start: "top 82%", once: true, onEnter: () => lampOn(el) });
        });
        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = parseFloat(el.getAttribute("data-parallax") || "40");
          gsap.to(el, { y: -amt, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });
        ST.refresh();
        cleanupFns.push(() => ST.getAll().forEach((t) => t.kill()));
      } catch {
        revealAll();
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      try { lenis?.destroy(); } catch {}
      cleanupFns.forEach((fn) => fn());
    };
  }, [pathname]);

  return <div ref={rootRef}>{children}</div>;
}
