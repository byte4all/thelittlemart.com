import { redirect } from "next/navigation";

export default function CallbackRedirect() {
  redirect("/auth/callback");
}
