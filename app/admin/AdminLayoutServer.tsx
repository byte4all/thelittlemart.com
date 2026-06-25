import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdminGate } from "@/lib/auth";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await getCurrentAdminGate();
  if (!gate.isAdmin) {
    if (gate.signedIn) {
      redirect("/");
    }
    redirect("/auth/sign-in?redirect=%2Fadmin");
  }
  return <AdminShell>{children}</AdminShell>;
}
