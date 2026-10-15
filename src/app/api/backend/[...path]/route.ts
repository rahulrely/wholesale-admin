import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, baseUrl, REFRESH_COOKIE } from "@/lib/auth";

async function forward(request: Request, path: string[], method: string) {
  if (!["GET", "HEAD"].includes(method)) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "Request origin was not accepted." }, { status: 403 });
    }
  }
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const target = `${baseUrl()}/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  const call = (token: string) => fetch(target, {
    method, headers: { Authorization: `Bearer ${token}`, ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type")! } : {}) },
    ...(method === "GET" || method === "HEAD" ? {} : { body: request.body }), cache: "no-store", // BFF forwards authenticated requests only
    duplex: method === "GET" || method === "HEAD" ? undefined : "half",
  } as RequestInit);
  if (!access && !refresh) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  try {
    if (!access && refresh) {
      const renewed = await refreshSession(refresh);
      if (!renewed) return NextResponse.json({ message: "Session expired." }, { status: 401 });
      access = renewed.accessToken;
    }
    let upstream = await call(access!);
    let renewed: { accessToken: string; refreshToken: string } | null = null;
    if (upstream.status === 401 && refresh) {
      renewed = await refreshSession(refresh);
      if (renewed) upstream = await call(renewed.accessToken);
    }
    const response = new NextResponse(upstream.body, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } });
    if (renewed) {
      const secure = process.env.NODE_ENV === "production";
      response.cookies.set(ACCESS_COOKIE, renewed.accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 900 });
      response.cookies.set(REFRESH_COOKIE, renewed.refreshToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    }
    return response;
  } catch {
    return NextResponse.json({ message: "The backend service is unavailable." }, { status: 503 });
  }
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${baseUrl()}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }), cache: "no-store" });
  return response.ok ? await response.json() as { accessToken: string; refreshToken: string } : null;
}

type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) { return forward(request, (await context.params).path, "GET"); }
export async function POST(request: Request, context: Context) { return forward(request, (await context.params).path, "POST"); }
export async function PATCH(request: Request, context: Context) { return forward(request, (await context.params).path, "PATCH"); }
export async function PUT(request: Request, context: Context) { return forward(request, (await context.params).path, "PUT"); }
