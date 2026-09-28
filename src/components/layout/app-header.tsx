import Link from "next/link";
import { Bell } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { NAV_BY_ROLE } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";

/**
 * The top bar for every signed-in area.
 *
 * It deliberately does not repeat the main navigation: on desktop that lives
 * in the sidebar, on mobile in either the bottom tab bar (member/trainer) or
 * the drawer this header opens (admin). What it does carry is the things
 * that must be reachable from every screen regardless of where you are —
 * identity, notifications and account actions.
 */
export function AppHeader({
  role,
  roleLabel,
  userName,
  userEmail,
  unreadNotificationCount,
  showMenuTrigger,
}: {
  role: Role;
  roleLabel: string;
  userName: string;
  userEmail?: string;
  unreadNotificationCount: number;
  /** ADMIN gets a drawer trigger on mobile; roles with a bottom tab bar don't need one. */
  showMenuTrigger: boolean;
}) {
  const nav = NAV_BY_ROLE[role];
  const hasUnread = unreadNotificationCount > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        {showMenuTrigger ? (
          <div className="lg:hidden">
            <MobileNavDrawer
              role={role}
              roleLabel={roleLabel}
              userName={userName}
              unreadNotificationCount={unreadNotificationCount}
            />
          </div>
        ) : null}

        {/* The sidebar carries the lockup from `lg` up, so it only appears
            here on the screens that have no sidebar. */}
        <div className="min-w-0 lg:hidden">
          <BrandMark href={nav.home} role={roleLabel} compact />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            className="relative border border-border/80 bg-card hover:bg-muted"
            render={
              <Link
                href={nav.notificationsHref}
                aria-label={
                  hasUnread
                    ? `Notifications, ${unreadNotificationCount} unread`
                    : "Notifications"
                }
              >
                <Bell aria-hidden="true" className="size-5" />
                {hasUnread ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-primary-foreground tabular-nums ring-2 ring-background"
                  >
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>
            }
          />

          <UserMenu name={userName} email={userEmail} roleLabel={roleLabel} />
        </div>
      </div>
    </header>
  );
}
