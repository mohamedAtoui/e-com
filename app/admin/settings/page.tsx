import { DeliveryFeesEditor } from "@/components/admin/delivery-fees-editor";
import { OrderStatusesEditor } from "@/components/admin/order-statuses-editor";
import { RolesEditor } from "@/components/admin/roles-editor";
import { SettingsForm } from "@/components/admin/settings-form";
import { UsersManager } from "@/components/admin/users-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { guardPage, myPages } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatusRow, RoleRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await guardPage("settings");
  const pages = await myPages();
  const supabase = await createClient();

  const [{ data: settings }, { data: fees }, { data: statuses }, { data: roles }, { data: users }] =
    await Promise.all([
      supabase.from("settings").select("*").eq("id", true).single(),
      supabase.from("delivery_fees").select("*").order("wilaya_code"),
      supabase.from("order_statuses").select("*").order("sort_order"),
      supabase.from("roles").select("*").order("name"),
      supabase.from("profiles").select("id, email, full_name, role_id").order("created_at"),
    ]);

  // pages === null → RBAC not active yet (pre-0009): show all sections.
  const can = (p: string) => pages === null || pages.includes(p);
  const canStatuses = can("statuses");
  const canRoles = can("roles");
  const canUsers = can("users");

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="delivery">Livraison</TabsTrigger>
          {canStatuses && <TabsTrigger value="statuses">Statuts</TabsTrigger>}
          {canRoles && <TabsTrigger value="roles">Rôles</TabsTrigger>}
          {canUsers && <TabsTrigger value="users">Utilisateurs</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="pt-4">
          <SettingsForm settings={settings ?? null} />
        </TabsContent>
        <TabsContent value="delivery" className="pt-4">
          <DeliveryFeesEditor fees={fees ?? []} />
        </TabsContent>
        {canStatuses && (
          <TabsContent value="statuses" className="pt-4">
            <OrderStatusesEditor statuses={(statuses ?? []) as OrderStatusRow[]} />
          </TabsContent>
        )}
        {canRoles && (
          <TabsContent value="roles" className="pt-4">
            <RolesEditor roles={(roles ?? []) as RoleRow[]} />
          </TabsContent>
        )}
        {canUsers && (
          <TabsContent value="users" className="pt-4">
            <UsersManager users={users ?? []} roles={(roles ?? []) as RoleRow[]} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
