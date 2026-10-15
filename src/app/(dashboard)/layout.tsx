import { redirect } from "next/navigation";
import { getMerchantUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { ReactNode } from "react";

export const instant = false;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user=await getMerchantUser(); if(!user)redirect("/login");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
