import type { Metadata } from "next";
import { AccountView } from "@neondatabase/auth-ui";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import { noIndexMetadata } from "@/lib/seo";
import AccountShell from "@/components/account/AccountShell";
import PaymentsSection from "@/components/account/PaymentsSection";

export const dynamicParams = false;

const ORDERS_PATH = "orders";

export function generateStaticParams() {
  return [
    ...Object.values(accountViewPaths).map((path) => ({ path })),
    { path: ORDERS_PATH },
  ];
}

const titles: Record<string, string> = {
  settings: "Account Settings",
  security: "Security",
  orders: "Orders",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string }>;
}): Promise<Metadata> {
  const { path } = await params;
  const title = titles[path];
  return title ? noIndexMetadata(title) : noIndexMetadata("Account");
}

export default async function AccountPathPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  if (path === ORDERS_PATH) {
    return (
      <AccountShell>
        <h1 className="text-2xl font-semibold mb-6">Orders</h1>
        <PaymentsSection />
      </AccountShell>
    );
  }

  return (
    <AccountShell>
      <div className="min-w-0 [&_nav]:hidden [&_aside]:hidden">
        <AccountView path={path} />
      </div>
    </AccountShell>
  );
}
