"use client";

import { Boxes, ClipboardList, Settings, ShoppingCart, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/orders", label: "Commandes", icon: ClipboardList, page: "orders" },
  { href: "/admin/leads", label: "Paniers abandonnés", icon: ShoppingCart, page: "leads" },
  { href: "/admin/products", label: "Produits", icon: Boxes, page: "products" },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, page: "settings" },
];

export function AdminNav({ pages }: { pages?: string[] }) {
  const pathname = usePathname();
  const links = pages ? LINKS.filter((l) => pages.includes(l.page)) : LINKS;
  return (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const active = pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {l.label}
          </Link>
        );
      })}
      <div className="mt-4 space-y-1 border-t pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Store className="size-4" />
          Voir la boutique
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Se déconnecter
          </Button>
        </form>
      </div>
    </nav>
  );
}
