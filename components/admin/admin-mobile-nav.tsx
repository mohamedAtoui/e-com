"use client";

import { Boxes, ClipboardList, LayoutDashboard, LogOut, Settings, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/actions/auth";
import { allows } from "@/lib/admin-guard-shared";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Résumé", icon: LayoutDashboard, page: "dashboard" },
  { href: "/admin/orders", label: "Commandes", icon: ClipboardList, page: "orders" },
  { href: "/admin/leads", label: "Paniers", icon: ShoppingCart, page: "leads" },
  { href: "/admin/products", label: "Produits", icon: Boxes, page: "products" },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, page: "settings" },
];

/** Sticky top navigation shown only on mobile (the sidebar is md+ only). */
export function AdminMobileNav({ pages }: { pages?: string[] }) {
  const pathname = usePathname();
  const links = pages ? LINKS.filter((l) => allows(pages, l.page)) : LINKS;
  return (
    <div className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-base font-bold">Lighty</span>
        <form action={signOut}>
          <button type="submit" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LogOut className="size-4" /> Sortir
          </button>
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
