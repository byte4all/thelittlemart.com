import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms Of Service",
  description: "Terms of service for thelittlemart.com",
  path: "/terms-of-service",
});

export default function TermsOfServicePage() {
  return (
    <ContentPageLayout
      title="Terms Of Service"
      subtitle={`Last updated: ${new Date().toLocaleDateString("en-MY", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`}
      centerTitle
      backLinkBelowTitle
      compactBottom
    >
      <div className="space-y-8">
        <section className={s.section}>
          <h2 className={s.h2}>1. Acceptance of Terms</h2>
          <p className={s.p}>
            By accessing and using this website, you accept and agree to be
            bound by these Terms of Service. If you do not agree, please do not
            use this site.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>2. Use of the Service</h2>
          <p className={s.p}>
            You may use this site for lawful purposes only. You are responsible
            for maintaining the confidentiality of your account and for all
            activity under your account.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>3. Products and Orders</h2>
          <p className={s.p}>
            We reserve the right to limit quantities, correct errors, and
            modify or discontinue products. We do not guarantee that all
            products will be available at all times.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>4. Limitation of Liability</h2>
          <p className={s.p}>
            To the fullest extent permitted by law, we shall not be liable for
            any indirect, incidental, special, or consequential damages arising
            from your use of this site or any products purchased through it.
          </p>
        </section>
        <section id="return-exchange" className={s.section}>
          <h2 className={s.h2}>5. Return & Exchange</h2>
          <p className={s.p}>
            We want you to be satisfied with your purchase. If you are not
            completely happy, you may return or exchange eligible items within
            30 days of delivery. Items must be unused, in original packaging,
            and with proof of purchase. Refunds will be processed to the
            original payment method within 5–10 business days after we receive
            the return. For exchanges, please contact Customer Support to
            arrange size or product exchanges.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>6. Contact</h2>
          <p className={s.p}>
            For questions about these Terms of Service, please contact us
            through the contact information provided on this website.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
