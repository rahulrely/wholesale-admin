import { NextRequest, NextResponse } from "next/server";
const ACCESS_COOKIE = "merchant_access";
const REFRESH_COOKIE = "merchant_refresh";
const baseUrl = () => (process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return NextResponse.next();
  const expiry = access ? tokenExpiry(access) : 0;
  if (expiry > Math.floor(Date.now() / 1000) + 45) return NextResponse.next();
  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }), cache: "no-store",
    });
    if (!response.ok) return NextResponse.next();
    const tokens = await response.json() as { accessToken: string; refreshToken: string; expiresIn?: number };
    const nextRequest = new Headers(request.headers);
    const updatedCookies = new Map(request.cookies.getAll().map(({ name, value }) => [name, value]));
    updatedCookies.set(ACCESS_COOKIE, tokens.accessToken);
    updatedCookies.set(REFRESH_COOKIE, tokens.refreshToken);
    nextRequest.set("cookie", [...updatedCookies].map(([name, value]) => `${name}=${value}`).join("; "));
    const next = NextResponse.next({ request: { headers: nextRequest } });
    const secure = process.env.NODE_ENV === "production";
    next.cookies.set(ACCESS_COOKIE, tokens.accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: tokens.expiresIn ?? 900 });
    next.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return next;
  } catch {
    return NextResponse.next();
  }
}

function tokenExpiry(token: string): number {
  try { return Number(JSON.parse(atob(token.split(".")[1])).exp) || 0; } catch { return 0; }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/logout).*)"] };
