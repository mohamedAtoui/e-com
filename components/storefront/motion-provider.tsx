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

    // ----- Cursor spotlight (hero) -----
    root.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((hero) => {
      const glow = document.createElement("div");
      glow.setAttribute("aria-hidden", "true");
      glow.style.cssText = [
        "position:absolute", "inset:-10%", "pointer-events:none", "z-index:2",
        "opacity:0", "transition:opacity .6s ease", "mix-blend-mode:screen",
        "background:radial-gradient(280px circle at 50% 50%, rgba(244,184,96,.55), rgba(244,184,96,.16) 38%, transparent 66%)",
      ].join(";");
      hero.appendChild(glow);
      cleanupFns.push(() => glow.remove());
      if (reduce) return;
      let tx = 0.5, ty = 0.5, cx = 0.5, cy = 0.5, inside = false, raf = 0;
      const onMove = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width;
        ty = (e.clientY - r.top) / r.height;
        if (!inside) { inside = true; glow.style.opacity = "1"; }
      };
      const onLeave = () => { inside = false; glow.style.opacity = "0"; };
      const loop = () => {
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        glow.style.background =
          "radial-gradient(300px circle at " + (cx * 100).toFixed(2) + "% " + (cy * 100).toFixed(2) +
          "%, rgba(244,184,96,.55), rgba(244,184,96,.16) 38%, transparent 66%)";
        raf = requestAnimationFrame(loop);
      };
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(loop);
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
      reveals.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
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
        lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9, lerp: 0.1 }) as unknown as typeof lenis;
        lenis!.on("scroll", ST.update);
        const raf = (t: number) => { lenis!.raf(t); rafId = requestAnimationFrame(raf); };
        rafId = requestAnimationFrame(raf);

        const vh = () => window.innerHeight || document.documentElement.clientHeight;
        const showReveal = (el: HTMLElement, delay: number) =>
          window.setTimeout(() => { el.style.opacity = "1"; el.style.transform = "none"; }, delay * 1000);

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
