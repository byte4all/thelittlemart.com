import { redirect } from "next/navigation";

export default function AccountPaymentsPage() {
  redirect("/account/orders");
}
