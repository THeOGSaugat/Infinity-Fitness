import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { NAV_BY_ROLE, ROLE_LABEL } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";

/**
 * The application shell every signed-in area renders inside.
 *
 * One component owns the whole chrome — sidebar on desktop, header
 * everywhere, bottom tab bar on mobile for the roles that have one — so the
 * three role layouts stay three lines of configuration rather than three
 * copies of a layout that can drift apart. The role's navigation comes from
 * `nav-config.ts`; nothing here decides what a role may see, which is still
 * entirely the layout's `requireRole` plus the service-layer policies.
 */
export function AppShell({
  role,
  userName,
  userEmail,
  unreadNotificationCount,
  children,
}: {
  role: Role;
  userName: string;
  userEmail?: string;
  unreadNotificationCount: number;
  children: React.ReactNode;
}) {
  const nav = NAV_BY_ROLE[role];
  const roleLabel = ROLE_LABEL[role];
  const hasTabBar = nav.tabs.length > 0;

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:pl-64">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      <AppSidebar
        role={role}
        roleLabel={roleLabel}
        userName={userName}
        userEmail={userEmail}
        unreadNotificationCount={unreadNotificationCount}
      />

      <AppHeader
        role={role}
        roleLabel={roleLabel}
        userName={userName}
        userEmail={userEmail}
        unreadNotificationCount={unreadNotificationCount}
        showMenuTrigger={!hasTabBar}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className={
          // Bottom padding clears the fixed tab bar on mobile; it's removed
          // once the sidebar takes over at `lg`.
          hasTabBar
            ? "flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 lg:pb-10"
            : "flex-1 px-4 pt-6 pb-10 outline-none sm:px-6"
        }
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <MobileTabBar role={role} />
    </div>
  );
}
