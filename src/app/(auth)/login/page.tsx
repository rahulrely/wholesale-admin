import { redirect } from "next/navigation";
import { getMerchantUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const instant = false;

export default async function LoginPage() {
  if (await getMerchantUser()) redirect("/dashboard");
  return <main className="min-h-screen bg-[#f5f7fb] lg:grid lg:grid-cols-[1.1fr_.9fr]">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-[#202c45] p-12 text-white lg:flex"><div className="absolute -right-36 -top-36 size-136 rounded-full border border-white/10"/><a className="relative flex items-center gap-3 text-lg font-semibold" href="/login"><span className="grid size-10 place-items-center rounded-xl bg-indigo-500 font-bold">O</span> octen <span className="text-sm text-white/45">/ merchant</span></a><div className="relative max-w-xl pb-10"><p className="mb-5 text-xs font-semibold uppercase tracking-[.22em] text-indigo-300">Wholesale, in control</p><h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">Every order,<br/>customer, and rupee<br/>in its right place.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">A clearer view of the daily work behind your wholesale business.</p></div><p className="relative text-xs text-slate-400">© 2026 Octen Operations</p></section>
    <section className="flex min-h-screen items-center justify-center px-5 py-12"><div className="w-full max-w-102.5"><a href="/login" className="mb-12 flex items-center gap-3 font-semibold text-slate-800 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">O</span> octen <span className="font-normal text-slate-400">/ merchant</span></a><div className="mb-8"><p className="text-sm font-medium text-indigo-600">Merchant workspace</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to manage your wholesale operations.</p></div><LoginForm/><p className="mt-8 text-center text-xs text-slate-400">Secure access for authorized merchant accounts</p></div></section>
  </main>;
}
