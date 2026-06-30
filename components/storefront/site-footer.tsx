"use client";

import Link from "next/link";

import { LightyLogo } from "@/components/storefront/lighty-logo";
import { useLang } from "@/components/storefront/lang-provider";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="bg-background px-[clamp(18px,5vw,60px)] pb-[clamp(32px,4vw,48px)] pt-[clamp(40px,6vw,72px)]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start justify-between gap-7">
        <LightyLogo size={26} />
        <nav className="flex flex-wrap gap-[clamp(16px,2.4vw,30px)] text-[14.5px] font-medium">
          {t.foot.nav.map((f, i) => (
            <Link
              key={i}
              href={i === 0 ? "/collection" : i === 1 ? "/#story" : i === 2 ? "/#ambiance" : "/collection"}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {f}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-[clamp(28px,4vw,44px)] max-w-[1280px] border-t border-foreground/8 pt-[22px] text-[13px] text-foreground/50">
        {t.foot.note}
      </div>
    </footer>
  );
}
