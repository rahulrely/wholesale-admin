import { NextResponse } from "next/server";
import { ACCESS_COOKIE, baseUrl, REFRESH_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Request origin was not accepted." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { identifier?: string; password?: string } | null;
  if (!body?.identifier?.trim() || !body.password) {
    return NextResponse.json({ message: "Enter your email or phone and password." }, { status: 400 });
  }
  try {
    const response = await fetch(`${baseUrl()}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: body.identifier.trim(), password: body.password }), cache: "no-store",
    });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) return NextResponse.json({ message: "Invalid sign-in details. Please try again." }, { status: response.status });
    const user = data.user as { role?: string } | undefined;
    if (!data.accessToken || !data.refreshToken || user?.role !== "OWNER") {
      if (data.refreshToken) await fetch(`${baseUrl()}/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: data.refreshToken }), cache: "no-store" }).catch(() => undefined);
      return NextResponse.json({ message: "This account does not have merchant access." }, { status: 403 });
    }
    const result = NextResponse.json({ user });
    const secure = process.env.NODE_ENV === "production";
    result.cookies.set(ACCESS_COOKIE, String(data.accessToken), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Number(data.expiresIn) || 900 });
    result.cookies.set(REFRESH_COOKIE, String(data.refreshToken), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return result;
  } catch {
    return NextResponse.json({ message: "The sign-in service is unavailable. Check that the backend is running." }, { status: 503 });
  }
}
