"use client";

import Image from "next/image";
import Link from "next/link";

import { useLang } from "@/components/storefront/lang-provider";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductRow } from "@/types/database.types";

type FeaturedProduct = Pick<
  ProductRow,
  "slug" | "name_fr" | "name_ar" | "price" | "compare_at_price" | "images" | "stock_quantity" | "reserved_quantity"
>;

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

function Lamp({ stalk, lampW, lampH, left, glowH, delay, z }: { stalk: string; lampW: string; lampH: string; left: string; glowH: string; delay: string; z: number }) {
  return (
    <div aria-hidden className="absolute top-0 flex flex-col items-center" style={{ left, transform: "translateX(-50%)", zIndex: z, animation: `lightyBob ${7 + z * 0.4}s ease-in-out ${delay} infinite` }}>
      <div style={{ width: 2, height: stalk, background: "linear-gradient(#2B2724,#6b5f54)" }} />
      <div className="relative flex flex-col items-center">
        <div className="pointer-events-none absolute left-1/2 top-[94%] -translate-x-1/2 opacity-[var(--lamp,0)] transition-opacity duration-1000" style={{ width: "220%", height: glowH, zIndex: 0, background: "radial-gradient(50% 80% at 50% 0,rgba(244,184,96,.45),rgba(244,184,96,.1) 42%,transparent 72%)" }} />
        <div className="relative z-[2]" style={{ width: lampW, height: lampH, background: "linear-gradient(118deg,#F6DEAA 4%,#D7A748 40%,#9C6C26 88%)", borderRadius: "50% 50% 16% 16%/64% 64% 18% 18%", boxShadow: "inset -9px -7px 20px rgba(74,46,8,.5),inset 11px 9px 18px rgba(255,242,206,.52),0 24px 40px -18px rgba(43,39,36,.5)" }} />
        <div className="absolute left-1/2 top-[-5px] z-[3] -translate-x-1/2" style={{ width: "18%", height: 9, background: "linear-gradient(#3a332d,#211d19)", borderRadius: 3 }} />
        <div className="absolute bottom-[-6px] left-1/2 z-[3] -translate-x-1/2 transition-[box-shadow] duration-1000" style={{ width: "78%", height: "clamp(16px,2vw,24px)", borderRadius: "50%", background: "radial-gradient(62% 100% at 50% 28%,#FFF2D2,#F4B860 52%,rgba(244,184,96,.2))", boxShadow: "0 0 30px 9px rgba(244,184,96,calc(.16 + var(--lamp,0)*.7))" }} />
      </div>
    </div>
  );
}

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
      {/* HERO */}
      <section data-spotlight className="relative mx-auto grid max-w-[1280px] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(18px,5vw,60px)] pb-[clamp(64px,9vh,120px)] pt-[clamp(40px,7vh,96px)]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))" }}>
        <div className="relative z-[3]">
          <Kicker>{t.hero.kicker}</Kicker>
          <h1 data-reveal data-delay=".08" className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(50px,8.6vw,124px)", lineHeight: 0.92, letterSpacing: "-.025em" }}>
            {t.hero.titleA}
            <br />
            <span style={{ fontStyle: "italic", fontWeight: 400 }}>{t.hero.titleB}</span>
          </h1>
          <p data-reveal data-delay=".16" className="mt-[30px] max-w-[30em] text-foreground/70" style={{ fontSize: "clamp(17px,1.4vw,19px)", lineHeight: 1.7 }}>
            {t.hero.lede}
          </p>
          <div data-reveal data-delay=".24" className="mt-[38px] flex flex-wrap items-center gap-[18px]">
            <Link href="/collection" className="inline-flex items-center gap-2.5 rounded-full bg-[#2B2724] px-[30px] py-[15px] text-[15.5px] font-semibold text-[#FAF7F2] transition-[transform,box-shadow] duration-500 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_-12px_rgba(244,184,96,.95)]">
              {t.hero.cta}
            </Link>
            <Link href="/#story" className="inline-flex items-center gap-2.5 border-b-[1.5px] border-foreground/25 pb-[3px] text-[15.5px] font-semibold transition-colors hover:border-[#F4B860]">
              {t.hero.cta2}
            </Link>
          </div>
        </div>

        {/* Floating lamps */}
        <div aria-hidden data-reveal data-delay=".18" data-lamp className="relative z-[1]" style={{ ["--lamp" as string]: 0, height: "clamp(440px,60vh,640px)" }}>
          <div data-glow className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 opacity-0 blur-[8px] transition-opacity duration-[1800ms]" style={{ width: "118%", height: "78%", zIndex: 0, background: "radial-gradient(48% 50% at 50% 24%,rgba(244,184,96,.5),rgba(244,184,96,.13) 46%,transparent 72%)" }} />
          <Lamp stalk="clamp(60px,11vh,112px)" lampW="clamp(52px,6.6vw,76px)" lampH="clamp(58px,7.4vw,86px)" left="19%" glowH="clamp(120px,18vh,200px)" delay="0s" z={2} />
          <Lamp stalk="clamp(110px,17vh,188px)" lampW="clamp(86px,10.6vw,124px)" lampH="clamp(98px,12vw,142px)" left="48%" glowH="clamp(160px,24vh,280px)" delay=".7s" z={3} />
          <Lamp stalk="clamp(40px,7vh,82px)" lampW="clamp(60px,7.6vw,88px)" lampH="clamp(68px,8.6vw,100px)" left="78%" glowH="clamp(130px,19vh,210px)" delay="1.4s" z={2} />
        </div>

        <div data-reveal data-delay=".5" className="absolute bottom-[clamp(14px,3vh,30px)] left-1/2 z-[4] flex -translate-x-1/2 flex-col items-center gap-[9px] text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/40">
          <span>{t.hero.scrollHint}</span>
          <span className="relative h-[38px] w-px overflow-hidden" style={{ background: "linear-gradient(rgba(43,39,36,.3),transparent)" }}>
            <span className="absolute left-0 top-0 h-[12px] w-px" style={{ background: "#F4B860", animation: "lightyScroll 2.1s ease-in-out infinite" }} />
          </span>
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
          <div data-reveal data-delay=".1" data-lamp className="relative" style={{ ["--lamp" as string]: 0 }}>
            <div data-glow className="absolute inset-[-10%] opacity-0 blur-[8px] transition-opacity duration-[1800ms]" style={{ background: "radial-gradient(55% 45% at 50% 30%,rgba(244,184,96,.5),transparent 70%)", zIndex: 0 }} />
            <div className="relative z-[1] overflow-hidden rounded-[24px]" style={{ boxShadow: "0 44px 80px -34px rgba(43,39,36,.42)" }}>
              <Image
                src="/images/pendants-room.jpg"
                alt={t.amb.title}
                width={900}
                height={600}
                className="block h-[clamp(380px,52vh,560px)] w-full object-cover transition-[filter] duration-[1800ms]"
                style={{ filter: "brightness(calc(.74 + var(--lamp,0)*.26)) saturate(calc(.8 + var(--lamp,0)*.25))" }}
              />
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
