import { cookies } from "next/headers";

const ACCESS_COOKIE = "merchant_access";
const REFRESH_COOKIE = "merchant_refresh";
const baseUrl = () => (process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export type MerchantUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "OWNER" | "RETAILER";
};

export async function getMerchantUser(): Promise<MerchantUser | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) return null;

  const me = async (token: string) => fetch(`${baseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  try {
    const response = await me(access);
    if (response?.ok) {
      const user = (await response.json()) as MerchantUser;
      return user.role === "OWNER" ? user : null;
    }
    return null;
  } catch {
    return null;
  }
}

export { ACCESS_COOKIE, REFRESH_COOKIE, baseUrl };
