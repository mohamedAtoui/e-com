"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { DICT, type Lang, type StorefrontDict } from "@/lib/i18n/storefront";

interface LangContextValue {
  lang: Lang;
  t: StorefrontDict;
  dir: "ltr" | "rtl";
  toggle: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const s = localStorage.getItem("lighty-lang");
      if (s === "ar" || s === "fr") setLang(s);
    } catch {}
  }, []);

  useEffect(() => {
    const t = DICT[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang]);

  const toggle = () =>
    setLang((l) => {
      const next: Lang = l === "fr" ? "ar" : "fr";
      try {
        localStorage.setItem("lighty-lang", next);
      } catch {}
      return next;
    });

  const t = DICT[lang];
  return (
    <LangContext.Provider value={{ lang, t, dir: t.dir, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
