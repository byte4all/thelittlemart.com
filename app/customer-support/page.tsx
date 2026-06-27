import Link from "next/link";
import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Customer Support",
  description: "Get help from Thelittlemart customer support.",
  path: "/customer-support",
});

export default function CustomerSupportPage() {
  return (
    <ContentPageLayout
      title="Customer Support"
      subtitle="We're here to help with orders, products, and any questions."
      centerTitle
      backLinkBelowTitle
      compactBottom
    >
      <div className="space-y-8">
        <section className={s.section}>
          <h2 className={s.h2}>How we can help</h2>
          <p className={s.p}>
            Our support team can assist you with order status, returns and
            exchanges, product information, shipping, and payment issues. Use
            the options below to get in touch.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>Quick links</h2>
          <ul className={s.ul}>
            <li>
              <Link href="/contact-us" className={s.link}>
                Contact Us
              </Link>{" "}
              — Send us a message or find our contact details.
            </li>
            <li>
              <Link href="/terms-of-service#return-exchange" className={s.link}>
                Return & Exchange
              </Link>{" "}
              — Policy and how to start a return.
            </li>
            <li>
              <Link href="/track-my-order" className={s.link}>
                Track My Order
              </Link>{" "}
              — Check your order status.
            </li>
            <li>
              <Link href="/faq" className={s.link}>
                FAQ
              </Link>{" "}
              — Common questions and answers.
            </li>
          </ul>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>Response times</h2>
          <p className={s.p}>
            We aim to respond to all enquiries within 24–48 hours on business
            days. For urgent order issues, please include your order number when
            you contact us.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
