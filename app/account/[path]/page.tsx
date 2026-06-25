import type { Metadata } from "next";
import { AccountView } from "@neondatabase/auth-ui";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import { noIndexMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

const titles: Record<string, string> = {
  settings: "Account Settings",
  security: "Security",
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

  return (
    <main className="pt-10 pb-20 px-4 xl:px-0 max-w-frame mx-auto w-full">
      <AccountView path={path} />
    </main>
  );
}
