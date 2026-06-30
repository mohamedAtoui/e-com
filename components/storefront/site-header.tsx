"use client";

import Link from "next/link";

import { LightyLogo } from "@/components/storefront/lighty-logo";
import { useLang } from "@/components/storefront/lang-provider";

export function SiteHeader() {
  const { t, toggle } = useLang();
  return (
    <>
      {/* Trust strip */}
      <div className="flex items-center justify-center gap-2.5 bg-[#2B2724] px-4 py-2.5 text-center text-[12.5px] font-medium tracking-[0.05em] text-[#FAF7F2]">
        <span
          className="h-1.5 w-1.5 flex-none rounded-full"
          style={{ background: "#F4B860", boxShadow: "0 0 10px 2px rgba(244,184,96,.8)", animation: "lightyPulse 2.4s ease-in-out infinite" }}
        />
        <span>{t.trustStrip}</span>
      </div>

      <header className="sticky top-0 z-[60] flex items-center justify-between gap-4 px-[clamp(18px,5vw,60px)] py-3.5 backdrop-blur-md" style={{ background: "rgba(250,247,242,.72)" }}>
        <LightyLogo />
        <nav className="hidden items-center gap-[clamp(16px,2.4vw,34px)] text-[14.5px] font-medium md:flex">
          <Link href="/collection" className="text-foreground/72 transition-colors hover:text-foreground">
            {t.nav.collections}
          </Link>
          <Link href="/#story" className="text-foreground/72 transition-colors hover:text-foreground">
            {t.nav.story}
          </Link>
          <Link href="/#ambiance" className="text-foreground/72 transition-colors hover:text-foreground">
            {t.nav.ambiance}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={t.dir === "rtl" ? "Passer au français" : "التبديل إلى العربية"}
            className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold tracking-[0.02em] transition-colors hover:bg-foreground/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4B860]"
          >
            {t.langLabel}
          </button>
          <Link
            href="/collection"
            className="inline-flex items-center rounded-full bg-[#2B2724] px-4 py-2 text-[13.5px] font-semibold text-[#FAF7F2] transition-shadow hover:shadow-[0_8px_26px_-8px_rgba(244,184,96,.9)]"
          >
            {t.nav.collections}
          </Link>
        </div>
      </header>
    </>
  );
}
