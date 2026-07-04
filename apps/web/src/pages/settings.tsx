import { Download, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/motion/page-transition";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useItems } from "@/hooks/use-items";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function SettingsPage() {
  const { session } = useAuth();
  const { data: items } = useItems();

  const [displayName, setDisplayName] = useState(
    (session?.user.user_metadata.full_name as string | undefined) ?? "",
  );
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    const name = displayName.trim();
    if (!name) {
      toast.error("Name can't be empty");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ display_name: name })
        .eq("id", session!.user.id);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (!items || items.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    const header = [
      "Name", "Category", "Brand", "Series", "Status", "Condition",
      "Quantity", "Purchase Price", "Current Value", "Currency",
      "Purchase Date", "Location", "Tags", "Notes", "Custom Fields", "Added",
    ];
    const lines = items.map((item) =>
      [
        item.name,
        item.category.name,
        item.brand,
        item.series,
        item.status,
        item.condition,
        item.quantity,
        item.purchase_price,
        item.current_value,
        item.currency,
        item.purchase_date,
        item.location,
        item.tags.map((t) => t.name).join("; "),
        item.notes,
        JSON.stringify(item.custom_fields),
        item.created_at.slice(0, 10),
      ]
        .map(csvEscape)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mancave-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${items.length} items`);
  };

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Your account and preferences." />

      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear in the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <Button onClick={() => void saveProfile()} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Save
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Managed through Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate font-medium">{session?.user.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium capitalize">
                {session?.user.app_metadata.provider ?? "email"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">User ID</span>
              <span className="truncate font-mono text-xs">{session?.user.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>
              Download your entire inventory as a CSV — every field, tag and
              custom attribute included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={exportCsv}>
              <Download /> Export {items?.length ?? 0} items to CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
