import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export function SettingsPage() {
  const { session } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" description="Your account and preferences." />

      <Card className="max-w-lg">
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
            <span className="text-muted-foreground">User ID</span>
            <span className="truncate font-mono text-xs">{session?.user.id}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium capitalize">
              {session?.user.app_metadata.provider ?? "email"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
