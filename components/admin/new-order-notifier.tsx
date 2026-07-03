"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatDZD } from "@/lib/money";

/**
 * Live in-dashboard alert for new orders. Subscribes to Supabase Realtime
 * INSERTs on `orders` (RLS restricts the stream to admins) and pops a toast +
 * a short chime the moment a COD order lands. Works alongside the Telegram push
 * (which reaches the owner's phone when the dashboard is closed).
 */
export function NewOrderNotifier() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as {
            order_number?: number;
            customer_name?: string;
            total?: number;
          };
          chime();
          toast.success(`Nouvelle commande #${o.order_number ?? ""}`, {
            description: [o.customer_name, o.total != null ? formatDZD(o.total) : null]
              .filter(Boolean)
              .join(" · "),
            duration: 12000,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function chime() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = ctxRef.current ?? new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      // Two-note "ding-dong" from a single oscillator.
      [880, 1174.66].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = now + i * 0.18;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch {
      // audio is best-effort; the toast is the primary signal
    }
  }

  return null;
}
