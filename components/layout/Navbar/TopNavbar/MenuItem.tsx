"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

type MenuItemProps = {
  label: string;
  url?: string;
};

export function MenuItem({ label, url }: MenuItemProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href = url ?? "/";
  const [path, query] = href.split("?");
  const sameQuery = (a: URLSearchParams, q: string) => {
    const A = [...a.entries()].sort((x, y) => x[0].localeCompare(y[0]));
    const B = [...new URLSearchParams(q).entries()].sort((x, y) => x[0].localeCompare(y[0]));
    return A.length === B.length && A.every(([k, v], i) => k === B[i][0] && v === B[i][1]);
  };
  const isActive =
    pathname === path && (!query ? !searchParams.toString() : sameQuery(searchParams, query));

  return (
    <NavigationMenuItem>
      <Link
        href={href}
        scroll={false}
        className={cn(
          navigationMenuTriggerStyle(),
          "font-normal px-3 transition-colors",
          isActive
            ? "bg-neutral-100 text-foreground hover:bg-neutral-100 hover:text-foreground"
            : "text-foreground hover:text-foreground/80"
        )}
      >
        {isActive ? (
          <span className="text-brand">
            {label}
          </span>
        ) : (
          label
        )}
      </Link>
    </NavigationMenuItem>
  );
}
