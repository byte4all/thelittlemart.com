"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account/settings", label: "Account Settings" },
  { href: "/account/security", label: "Security" },
  { href: "/account/orders", label: "Orders" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/account/orders") {
    return pathname === href || pathname.startsWith("/account/orders/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="pt-10 pb-20 px-4 xl:px-0 max-w-frame mx-auto w-full">
      <div className="flex flex-col gap-6 md:flex-row md:gap-12">
        <nav
          className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-56 md:flex-col md:gap-1"
          aria-label="Account"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-accent text-accent-foreground ring-[3px] ring-ring/50"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
