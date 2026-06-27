"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { MenuListData } from "../navbar.types";

export type MenuListProps = {
  data: MenuListData;
  label: string;
};

export function MenuList({ data, label }: MenuListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Highlight Shop only when viewing a category (e.g. Body Wash, Towels); not when Best Sellers or Brands is active
  const isShopActive =
    pathname.startsWith("/shop") && searchParams.has("category");

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          "font-normal px-3 transition-colors",
          isShopActive
            ? "bg-neutral-100 rounded-md"
            : "text-foreground hover:text-foreground/80"
        )}
      >
        {isShopActive ? (
          <span className="text-brand">
            {label}
          </span>
        ) : (
          label
        )}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
          {data.map((item) => (
            <ListItem key={item.id} title={item.label} href={item.url ?? "/"}>
              {item.description ?? ""}
            </ListItem>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function hrefToPathAndQuery(
  href: React.ComponentPropsWithoutRef<typeof Link>["href"]
): [path: string, query: string] {
  const s =
    typeof href === "string"
      ? href
      : href && typeof href === "object" && "pathname" in href
        ? (href.pathname ?? "/") +
          (href.query && Object.keys(href.query).length
            ? "?" +
              new URLSearchParams(
                href.query as Record<string, string>
              ).toString()
            : "")
        : "/";
  const [path = "/", query = ""] = s.split("?");
  return [path, query];
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { title: string }
>(({ className, title, children, href = "/", ...props }, ref) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [path, query] = hrefToPathAndQuery(href);
  const sameQuery = (a: URLSearchParams, q: string) => {
    const A = [...a.entries()].sort((x, y) => x[0].localeCompare(y[0]));
    const B = [...new URLSearchParams(q).entries()].sort((x, y) => x[0].localeCompare(y[0]));
    return A.length === B.length && A.every(([k, v], i) => k === B[i][0] && v === B[i][1]);
  };
  const isActive =
    pathname === path && (!query ? !searchParams.toString() : sameQuery(searchParams, query));

  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href}
          scroll={false}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            isActive && "bg-neutral-100",
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "text-sm font-medium leading-none",
              isActive && "text-brand"
            )}
          >
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
