import { DeliveryFeesEditor } from "@/components/admin/delivery-fees-editor";
import { SettingsForm } from "@/components/admin/settings-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: fees }] = await Promise.all([
    supabase.from("settings").select("*").eq("id", true).single(),
    supabase.from("delivery_fees").select("*").order("wilaya_code"),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <SettingsForm settings={settings ?? null} />
      <DeliveryFeesEditor fees={fees ?? []} />
    </div>
  );
}
