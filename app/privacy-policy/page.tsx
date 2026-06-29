import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Thelittlemart.com",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <ContentPageLayout
      title="Privacy Policy"
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
          <h2 className={s.h2}>1. Information We Collect</h2>
          <p className={s.p}>
            We may collect information you provide directly (name, email,
            address, payment details when you make a purchase) and information
            collected automatically (device information, cookies, usage data).
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>2. How We Use Your Information</h2>
          <p className={s.p}>
            We use your information to process orders, communicate with you,
            improve our services, and comply with legal obligations. We do not
            sell your personal information to third parties.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>3. Data Security</h2>
          <p className={s.p}>
            We implement appropriate technical and organizational measures to
            protect your personal data against unauthorized access, alteration,
            or destruction.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>4. Your Rights</h2>
          <p className={s.p}>
            Depending on your location, you may have the right to access,
            correct, delete, or port your personal data, or to object to or
            restrict certain processing. Contact us to exercise these rights.
          </p>
        </section>
        <section className={s.section}>
          <h2 className={s.h2}>5. Contact</h2>
          <p className={s.p}>
            For privacy-related questions or requests, please contact us through
            the contact information provided on this website.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
