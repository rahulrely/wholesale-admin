import { redirect } from "next/navigation";
import { getMerchantUser } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  redirect((await getMerchantUser()) ? "/dashboard" : "/login");
}
