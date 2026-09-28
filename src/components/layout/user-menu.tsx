"use client";

import { Menu } from "@base-ui/react/menu";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Account affordance in the header: who you are, what role you're using, and
 * log out. On desktop this duplicates what the sidebar footer shows, which
 * is intentional — the header is where people reach for account actions, and
 * on mobile (where there is no sidebar) it is the only place they live.
 *
 * Log out stays a Server Action form submit, so the session is still cleared
 * server-side exactly as before.
 */
export function UserMenu({
  name,
  email,
  roleLabel,
}: {
  name: string;
  email?: string;
  roleLabel: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Account menu for ${name}`}>
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-[0.8125rem] font-bold text-primary-foreground"
            >
              {initial}
            </span>
          </Button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-56 origin-(--transform-origin) rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-[transform,opacity] duration-150 data-closed:scale-95 data-closed:opacity-0">
            <div className="flex flex-col gap-0.5 px-2.5 py-2">
              <p className="truncate text-sm font-medium">{name}</p>
              {email ? (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              ) : null}
              <p className="mt-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                {roleLabel}
              </p>
            </div>

            <div className="my-1 h-px bg-border" />

            <form action={logoutAction}>
              <Menu.Item
                nativeButton
                render={
                  <button
                    type="submit"
                    className="flex min-h-10 w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium outline-none select-none focus:bg-muted data-highlighted:bg-muted"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    Log out
                  </button>
                }
              />
            </form>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
