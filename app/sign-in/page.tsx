import { redirect } from "next/navigation";
import { AUTH_LOGIN_PATH } from "@/lib/auth/login-path";

export default async function SignInRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
  }
  const qs = query.toString();
  redirect(`${AUTH_LOGIN_PATH}${qs ? `?${qs}` : ""}`);
}
