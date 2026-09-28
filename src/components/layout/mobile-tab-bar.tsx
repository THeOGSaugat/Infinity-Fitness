"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_BY_ROLE } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";
import { cn } from "cn";

/**
 * The persistent bottom navigation for MEMBER and TRAINER on phones.
 *
 * These roles have a small, task-shaped set of destinations, which is
 * exactly what a tab bar is for: every primary section is one thumb-reach
 * tap away from every other, with no menu to open first. Each tab is a full
 * 56px-tall target, sits above the iOS home indicator via `pb-safe`, and
 * marks the current section with a lime icon and label, a lime marker bar
 * above it and `aria-current` — never colour alone.
 */
export function MobileTabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role].tabs;

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 backdrop-blur-lg pb-safe lg:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 pt-2.5 pb-2 text-[0.6875rem] transition-colors",
                  active ? "font-semibold text-primary" : "font-medium text-muted-foreground hover:text-foreground"
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                  />
                ) : null}
                <Icon aria-hidden="true" className={cn("size-[1.375rem]", active && "stroke-[2.4]")} />
                <span className="w-full truncate text-center">
                  {item.shortLabel ?? item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
