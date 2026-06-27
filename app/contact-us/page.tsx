import Link from "next/link";
import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us",
  description: "Get in touch with Thelittlemart.",
  path: "/contact-us",
});

export default function ContactUsPage() {
  return (
    <ContentPageLayout
      title="Contact Us"
      subtitle="Have a question or feedback? We'd love to hear from you."
      centerTitle
      backLinkBelowTitle
      compactBottom
    >
      <div className="space-y-8">
        <section className={s.section}>
          <h2 className={s.h2}>Get in touch</h2>
          <p className={s.p}>
            For general enquiries, order support, or partnership opportunities,
            reach out using the details below. We'll get back to you as soon as
            we can.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>Contact details</h2>
          <ul className="list-none space-y-2 pl-0 text-black/60 text-sm md:text-base">
            <li>
              <span className="text-black/90 font-medium">Email:</span>{" "}
              <a
                href="mailto:support@thelittlemart.com"
                className={s.link}
              >
                support@thelittlemart.com
              </a>
            </li>
            <li>
              <span className="text-black/90 font-medium">Customer support:</span>{" "}
              Use the{" "}
              <Link href="/customer-support" className={s.link}>
                Customer Support
              </Link>{" "}
              page for help with orders and returns.
            </li>
          </ul>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>Before you contact us</h2>
          <p className={s.p}>
            Check our{" "}
            <Link href="/faq" className={s.link}>
              FAQ
            </Link>{" "}
            for quick answers to common questions about orders, payment, and
            shipping.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
