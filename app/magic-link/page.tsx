import { redirect } from "next/navigation";

export default function MagicLinkRedirect() {
  redirect("/auth/magic-link");
}
