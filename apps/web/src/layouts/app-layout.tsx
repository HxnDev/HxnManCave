import {
  FolderOpen,
  LayoutDashboard,
  Library,
  LogOut,
  Settings,
  Vault,
} from "lucide-react";
import { Link, Navigate, NavLink, Outlet } from "react-router";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/collections", label: "Collections", icon: Library },
  { to: "/app/categories", label: "Categories", icon: FolderOpen },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function FullScreenLoader() {
  return (
    <div className="vault-gradient flex min-h-svh flex-col items-center justify-center gap-4">
      <span className="grid size-14 animate-pulse place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <Vault className="size-7 text-primary" />
      </span>
      <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
        unlocking the vault
      </p>
    </div>
  );
}

export function AppLayout() {
  const { session, loading, signOut } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;

  const email = session.user.email ?? "";
  const displayName =
    (session.user.user_metadata.full_name as string | undefined) ??
    email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-5 py-6">
          <Link to="/app">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/app">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  "grid size-9 place-items-center rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="size-4.5" />
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-4 pt-20 pb-10 md:ml-60 md:px-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
