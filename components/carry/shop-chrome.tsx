"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Fingerprint,
  Globe2,
  LockKeyhole,
  PackageCheck,
} from "lucide-react";
import { useLang } from "@/components/storefront/lang-provider";

export function CarryHeader() {
  const { lang, toggle } = useLang();
  const ar = lang === "ar";
  return (
    <>
      <a className="carry-announcement" href="/carry#livraison">
        {ar
          ? "التوصيل إلى 58 ولاية · الدفع عند الاستلام"
          : "Livraison dans 58 wilayas · Payez à la réception"}
        <ArrowUpRight size={13} />
      </a>
      <header className="carry-header carry-container">
        <Link
          href="/carry"
          className="carry-logo"
          aria-label="CARRY — Accueil"
        >
          <span className="carry-logo-mark" aria-hidden="true">
            <Fingerprint className="carry-mark-print" strokeWidth={1.5} />
            <LockKeyhole className="carry-mark-lock" strokeWidth={1.8} />
          </span>
          <span>
            CARRY<span className="carry-logo-sub">SACS / ALGÉRIE</span>
          </span>
        </Link>
        <nav aria-label={ar ? "القائمة الرئيسية" : "Navigation principale"}>
          <Link href="/carry#collection">
            {ar ? "المجموعة" : "La collection"}
          </Link>
          <Link href="/carry#experience">
            {ar ? "التجربة" : "L’expérience"}
          </Link>
        </nav>
        <button
          className="carry-language"
          onClick={toggle}
          aria-label={ar ? "Passer en français" : "التغيير إلى العربية"}
        >
          <Globe2 size={16} />
          {ar ? "FR" : "العربية"}
        </button>
      </header>
    </>
  );
}

export function CarryFooter() {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <footer className="carry-footer">
      <div className="carry-container">
        <div className="carry-footer-top">
          <div>
            <p className="carry-eyebrow">CARRY</p>
            <h2>
              {ar ? (
                "كل يوم. وجهة جديدة."
              ) : (
                <>
                  Chaque jour.
                  <br />
                  Un nouveau départ.
                </>
              )}
            </h2>
          </div>
          <Link
            href="/carry#collection"
            className="carry-round-link"
            aria-label={ar ? "اكتشف المجموعة" : "Explorer la collection"}
          >
            <ArrowUpRight size={28} />
          </Link>
        </div>
        <div className="carry-footer-bottom">
          <span>© {new Date().getFullYear()} CARRY</span>
          <span>
            <PackageCheck size={15} />
            {ar
              ? "الدفع عند الاستلام فقط"
              : "Paiement à la livraison uniquement"}
          </span>
          <Link href="/">
            {ar ? "متجر الإضاءة Lighty" : "Découvrir Lighty ↗"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
