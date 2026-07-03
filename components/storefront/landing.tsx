"use client";

import Link from "next/link";

import { useLang } from "@/components/storefront/lang-provider";
import { PendantHero } from "@/components/storefront/pendant-hero";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductRow } from "@/types/database.types";

type FeaturedProduct = Pick<
  ProductRow,
  "slug" | "name_fr" | "name_ar" | "price" | "compare_at_price" | "images" | "stock_quantity" | "reserved_quantity"
>;

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div data-reveal className="mb-[26px] inline-flex items-center gap-[11px] text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: "#F4B860", boxShadow: "0 0 12px 3px rgba(244,184,96,.7)" }} />
      {children}
    </div>
  );
}

export function Landing({ products }: { products: FeaturedProduct[] }) {
  const { t, lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div style={{ fontSize: 17, lineHeight: 1.65 }}>
      {/* HERO — editorial headline above the interactive pendant lamps */}
      <section className="relative mx-auto flex max-w-[1180px] flex-col items-center overflow-hidden px-[clamp(18px,5vw,60px)] pb-[clamp(32px,5vh,56px)] pt-[clamp(34px,6vh,72px)]">
        <div className="relative z-[2] flex flex-col items-center text-center">
          <Kicker>{t.hero.kicker}</Kicker>
          <h1 data-reveal data-delay=".08" className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(48px,8vw,116px)", lineHeight: 0.92, letterSpacing: "-.03em" }}>
            {t.hero.titleA}
            {t.hero.titleB && (
              <>
                {" "}
                <span style={{ fontStyle: "italic", fontWeight: 400 }}>{t.hero.titleB}</span>
              </>
            )}
          </h1>
          <p data-reveal data-delay=".16" className="mx-auto mt-[clamp(18px,2.4vw,28px)] max-w-[32em] text-foreground/70" style={{ fontSize: "clamp(16px,1.4vw,19px)", lineHeight: 1.7 }}>
            {t.hero.lede}
          </p>
        </div>

        <div data-reveal data-delay=".22" className="relative z-[1] mt-[clamp(8px,2vh,24px)] w-full">
          <PendantHero />
        </div>

        <div data-reveal data-delay=".3" className="relative z-[2] -mt-[clamp(8px,3vh,28px)] flex flex-wrap items-center justify-center gap-[16px]">
          <Link href="/collection" className="inline-flex items-center gap-2.5 rounded-full bg-[#2B2724] px-[32px] py-[16px] text-[15.5px] font-semibold text-[#FAF7F2] transition-[transform,box-shadow] duration-500 hover:-translate-y-[3px] hover:shadow-[0_18px_44px_-12px_rgba(244,184,96,1)]">
            {t.hero.cta}
          </Link>
          <Link href="/#story" className="inline-flex items-center gap-2.5 border-b-[1.5px] border-foreground/25 pb-[3px] text-[15.5px] font-semibold transition-colors hover:border-[#F4B860]">
            {t.hero.cta2}
          </Link>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="relative px-[clamp(18px,5vw,60px)] py-[clamp(70px,10vh,130px)]" style={{ background: "linear-gradient(180deg,#FAF7F2,#F4EEE3)" }}>
        <div className="mx-auto max-w-[1080px]">
          <div data-reveal className="mb-[30px] inline-flex items-center gap-[11px] text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
            <span className="h-[1.5px] w-6" style={{ background: "#F4B860" }} />
            {t.story.kicker}
          </div>
          <h2 data-reveal data-delay=".06" className="m-0 max-w-[16em] font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(30px,4.6vw,58px)", lineHeight: 1.06, letterSpacing: "-.02em" }}>
            {t.story.title}
          </h2>
          <p data-reveal data-delay=".12" className="mt-7 max-w-[40em] text-foreground/68" style={{ fontSize: "clamp(16px,1.3vw,19px)", lineHeight: 1.75 }}>
            {t.story.body}
          </p>
          <div data-reveal data-delay=".18" className="mt-12 flex flex-wrap items-center gap-y-3.5">
            {t.story.crafts.map((craft) => (
              <span key={craft} className="inline-flex items-center gap-[18px] italic text-foreground/82" style={{ fontFamily: SERIF, fontSize: "clamp(17px,1.5vw,22px)" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#F4B860", boxShadow: "0 0 9px 2px rgba(244,184,96,.6)" }} />
                {craft}
                <span className="inline-block" style={{ width: "clamp(20px,4vw,48px)" }} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTION */}
      <section className="relative bg-[#F4EEE3] px-[clamp(18px,5vw,60px)] py-[clamp(70px,10vh,130px)]">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-[clamp(36px,5vw,60px)] flex flex-wrap items-end justify-between gap-6">
            <div>
              <div data-reveal className="mb-[18px] text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/50">{t.col.kicker}</div>
              <h2 data-reveal data-delay=".06" className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(30px,4.6vw,58px)", lineHeight: 1.04, letterSpacing: "-.02em" }}>
                {t.col.title}
              </h2>
            </div>
            <Link data-reveal data-delay=".1" href="/collection" className="inline-flex items-center gap-2.5 border-b-[1.5px] border-foreground/25 pb-[3px] text-[14.5px] font-semibold transition-colors hover:border-[#F4B860]">
              {t.col.cta}
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="py-12 text-center text-foreground/55">{t.col.empty}</p>
          ) : (
            <div className="grid gap-[clamp(16px,1.6vw,26px)]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,250px),1fr))" }}>
              {products.map((p) => (
                <div data-reveal key={p.slug}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AMBIANCE */}
      <section id="ambiance" className="relative px-[clamp(18px,5vw,60px)] py-[clamp(70px,10vh,130px)]" style={{ background: "linear-gradient(180deg,#F4EEE3,#FAF7F2)" }}>
        <div className="mx-auto grid max-w-[1280px] items-center gap-[clamp(32px,5vw,68px)]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))" }}>
          <div>
            <div data-reveal className="mb-6 inline-flex items-center gap-[11px] text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
              <span className="h-[1.5px] w-6" style={{ background: "#F4B860" }} />
              {t.amb.kicker}
            </div>
            <h2 data-reveal data-delay=".06" className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(30px,4.4vw,56px)", lineHeight: 1.06, letterSpacing: "-.02em" }}>
              {t.amb.title}
            </h2>
            <p data-reveal data-delay=".12" className="mt-[26px] max-w-[34em] text-foreground/68" style={{ fontSize: "clamp(16px,1.3vw,18.5px)", lineHeight: 1.75 }}>
              {t.amb.body}
            </p>
            <div data-reveal data-delay=".18" className="mt-[34px] flex flex-wrap gap-2.5">
              {t.amb.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/70 px-[18px] py-[9px] text-[13.5px] font-semibold text-foreground/70">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="relative bg-background px-[clamp(18px,5vw,60px)] py-[clamp(70px,10vh,120px)]">
        <div className="mx-auto max-w-[1180px]">
          <div data-reveal className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/50">{t.val.kicker}</div>
          <h2 data-reveal data-delay=".06" className="m-0 mb-[clamp(40px,5vw,64px)] max-w-[14em] font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(28px,4.2vw,52px)", lineHeight: 1.06, letterSpacing: "-.02em" }}>
            {t.val.title}
          </h2>
          <div className="grid gap-[clamp(28px,3vw,48px)]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))" }}>
            {t.val.items.map((v) => (
              <div data-reveal key={v.t} className="relative pt-[30px]">
                <span className="absolute left-0 top-0 h-[11px] w-[11px] rounded-full" style={{ background: "#F4B860", boxShadow: "0 0 16px 4px rgba(244,184,96,.55)", insetInlineStart: 0, insetInlineEnd: "auto" }} />
                <h3 className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: 21, letterSpacing: "-.01em" }}>{v.t}</h3>
                <p className="mt-[11px] text-[15px] leading-[1.65] text-foreground/62">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-lamp className="relative mx-[clamp(12px,3vw,40px)] mb-[clamp(16px,3vw,40px)] overflow-hidden rounded-[32px] px-[clamp(24px,6vw,80px)] py-[clamp(60px,9vw,120px)] text-center" style={{ ["--lamp" as string]: 0, background: "linear-gradient(160deg,#F3E8D6,#EFE2CE)" }}>
        <div data-glow className="absolute left-1/2 top-[-30%] -translate-x-1/2 opacity-0 transition-opacity duration-[2000ms]" style={{ width: "120%", height: "110%", background: "radial-gradient(45% 45% at 50% 0%,rgba(244,184,96,.6),transparent 65%)", zIndex: 0 }} />
        <div className="relative z-[1] mx-auto max-w-[760px]">
          <h2 data-reveal className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(34px,5.4vw,72px)", lineHeight: 1.02, letterSpacing: "-.025em" }}>{t.cta.title}</h2>
          <p data-reveal data-delay=".08" className="mx-auto mt-6 max-w-[30em] text-foreground/68" style={{ fontSize: "clamp(16px,1.4vw,19px)", lineHeight: 1.7 }}>{t.cta.body}</p>
          <Link data-reveal data-delay=".16" href="/collection" className="mt-[38px] inline-flex items-center gap-2.5 rounded-full bg-[#2B2724] px-9 py-4 text-[16px] font-semibold text-[#FAF7F2] transition-[transform,box-shadow] duration-500 hover:-translate-y-[3px] hover:shadow-[0_18px_46px_-12px_rgba(244,184,96,1)]">
            {t.cta.btn}
          </Link>
        </div>
        <span className="sr-only">{isAr ? "" : ""}</span>
      </section>
    </div>
  );
}
