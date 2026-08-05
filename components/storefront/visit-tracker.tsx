"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/** Stable per-browser id → lets the dashboard count unique daily visitors. */
function getVisitorId(): string {
  try {
    let id = localStorage.getItem("lighty-vid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("lighty-vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

/**
 * First-party page-view beacon. Logs one visit per path per session directly to
 * Supabase (anon RPC) — powers the "Visiteurs" panel in the admin dashboard.
 * Complements Vercel Web Analytics; costs no Vercel function invocations.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const key = `vlog:${pathname}`;
      if (sessionStorage.getItem(key)) return; // already logged this path this session
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage blocked — still log once per mount
    }
    const id = getVisitorId();
    if (!id) return;
    createClient()
      .rpc("log_visit", { p_visitor_id: id, p_path: pathname })
      .then(
        () => {},
        () => {},
      );
  }, [pathname]);

  return null;
}
