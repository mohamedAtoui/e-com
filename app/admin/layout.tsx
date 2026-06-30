import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated (e.g. the login page): render without the admin shell.
  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-muted/20 p-4 md:flex md:flex-col">
        <div className="mb-6 px-3 text-lg font-bold">Ma Boutique</div>
        <AdminNav />
        <p className="mt-auto truncate px-3 pt-4 text-xs text-muted-foreground">
          {user.email}
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 overflow-x-hidden bg-background">{children}</main>
      </div>
    </div>
  );
}
