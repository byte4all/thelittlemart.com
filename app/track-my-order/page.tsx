import Link from "next/link";
import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Track My Order",
  description: "Track your thelittlemart order status.",
  path: "/track-my-order",
});

export default function TrackMyOrderPage() {
  return (
    <ContentPageLayout
      title="Track My Order"
      subtitle="Check the status of your order and delivery."
      centerTitle
      backLinkBelowTitle
      compactBottom
    >
      <div className="space-y-8">
        <section className={s.section}>
          <h2 className={s.h2}>How to track your order</h2>
          <p className={s.p}>
            If you have an account, you can view your order history and tracking
            information in your{" "}
            <Link href="/account/orders" className={s.link}>
              order
            </Link>{" "}
            page. Log in and go to Orders to see status and any tracking numbers.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>Order confirmation email</h2>
          <p className={s.p}>
            After placing an order, you'll receive a confirmation email with your
            order number and, once shipped, a tracking link if available. Check
            your spam folder if you don't see it.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>Need help?</h2>
          <p className={s.p}>
            If you can't find your order or have questions about delivery,
            visit{" "}
            <Link href="/customer-support" className={s.link}>
              Customer Support
            </Link>{" "}
            or{" "}
            <Link href="/contact-us" className={s.link}>
              Contact Us
            </Link>{" "}
            with your order number.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
