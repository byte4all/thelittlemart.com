import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description: "Learn more about thelittlemart.com",
  path: "/about-us",
});

const aboutImageSrc = "/products/footer/about-us/stacked-zen-stones-sand-background-art-balance-concept.webp";

export default function AboutUsPage() {
  return (
    <ContentPageLayout title="About Us" centerTitle backLinkBelowTitle compactBottom>
      <div className="space-y-8">
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 items-center"
          aria-label="About thelittlemart"
        >
          <div className="relative w-full aspect-[4/3] min-h-[200px] rounded-lg overflow-hidden bg-black/5">
            <Image
              src={aboutImageSrc}
              alt="Stacked zen stones on sand — balance and quality"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          <div className={s.section}>
            <p className={s.p}>
              We curate practical, quality products for everyday living. Our
              catalog spans kitchenware, stationery, household items, condiments,
              personal care, and baby and kids essentials.
            </p>
            <p className={s.p}>
              We focus on useful products, clear information, and dependable
              quality so shopping for daily essentials is simple and reliable.
            </p>
          </div>
        </section>

        <section className={s.section}>
          <p className={s.p}>
            For questions or support, please use the{" "}
            <Link href="/contact-us" className={s.link}>
              Contact
            </Link>{" "}
            or{" "}
            <Link href="/customer-support" className={s.link}>
              Customer Support
            </Link>{" "}
            options in the footer.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
