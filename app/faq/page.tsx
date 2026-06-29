import Link from "next/link";
import type { Metadata } from "next";
import {
  ContentPageLayout,
  contentSectionStyles as s,
} from "@/components/layout/ContentPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about thelittlemart.",
  path: "/faq",
});

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is thelittlemart?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "thelittlemart offers quality essentials for your body and home, from luxurious soaps to Saint-Tropez inspired towels. We focus on comfort, quality, and timeless style.",
        },
      },
      {
        "@type": "Question",
        name: "How do I create an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can sign up from the Sign In page. An account lets you save addresses, view order history, and track orders.",
        },
      },
      {
        "@type": "Question",
        name: "How can I get help?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Visit our Customer Support or Contact Us page for assistance.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept major credit and debit cards (Visa, Mastercard), PayPal, Apple Pay, and Google Pay. Payment is processed securely at checkout.",
        },
      },
      {
        "@type": "Question",
        name: "When will I be charged?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your payment method is charged when your order is placed. For pre-orders or backorders, we may charge at shipment depending on the product.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get an invoice?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. After your order is placed, you'll receive an order confirmation email that can serve as a receipt. You can also view order details in your account.",
        },
      },
      {
        "@type": "Question",
        name: "Where do you ship?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We ship within Malaysia. Delivery times and fees are shown at checkout based on your location.",
        },
      },
      {
        "@type": "Question",
        name: "How long does shipping take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Standard delivery typically takes 3-7 business days after your order is shipped. You'll receive a tracking number by email when your order is dispatched.",
        },
      },
      {
        "@type": "Question",
        name: "How do I track my order?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the tracking link in your shipping confirmation email, or check your order status in your account or on our Track My Order page.",
        },
      },
    ],
  };

  return (
    <ContentPageLayout
      title="Frequently Asked Questions"
      subtitle={
        <>
          <p className="text-center">Quick answers to common questions.</p>
          <p className="mt-1">Jump to a section below.</p>
        </>
      }
      centerTitle
      backLinkBelowTitle
      compactBottom
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <nav
        className="mb-10 flex flex-wrap gap-3 text-sm font-medium"
        aria-label="FAQ sections"
      >
        <a href="#general" className={s.link}>
          General FAQ
        </a>
        <a href="#payment-billing" className={s.link}>
          Payment & Billing
        </a>
        <a href="#shipping" className={s.link}>
          Shipping Questions
        </a>
      </nav>

      <div className="space-y-10">
        <section id="general" className={s.section}>
          <h2 className={s.h2}>General FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>What is thelittlemart?</h3>
              <p className={s.p}>
                thelittlemart offers quality essentials for your body and home, from
                luxurious soaps to Saint-Tropez inspired towels. We focus on
                comfort, quality, and timeless style.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>How do I create an account?</h3>
              <p className={s.p}>
                You can sign up from the Sign In page. An account lets you save
                addresses, view order history, and track orders.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>How can I get help?</h3>
              <p className={s.p}>
                Visit our{" "}
                <Link href="/customer-support" className={s.link}>
                  Customer Support
                </Link>{" "}
                or{" "}
                <Link href="/contact-us" className={s.link}>
                  Contact Us
                </Link>{" "}
                page for assistance.
              </p>
            </div>
          </div>
        </section>

        <section id="payment-billing" className={s.section}>
          <h2 className={s.h2}>Payment & Billing</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>What payment methods do you accept?</h3>
              <p className={s.p}>
                We accept major credit and debit cards (Visa, Mastercard),
                PayPal, Apple Pay, and Google Pay. Payment is processed securely
                at checkout.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>When will I be charged?</h3>
              <p className={s.p}>
                Your payment method is charged when your order is placed. For
                pre-orders or backorders, we may charge at shipment depending on
                the product.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>Can I get an invoice?</h3>
              <p className={s.p}>
                Yes. After your order is placed, you'll receive an order
                confirmation email that can serve as a receipt. You can also
                view order details in your account.
              </p>
            </div>
          </div>
        </section>

        <section id="shipping" className={s.section}>
          <h2 className={s.h2}>Shipping Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>Where do you ship?</h3>
              <p className={s.p}>
                We ship within Malaysia. Delivery times and fees are shown at
                checkout based on your location.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>How long does shipping take?</h3>
              <p className={s.p}>
                Standard delivery typically takes 3–7 business days after your
                order is shipped. You'll receive a tracking number by email when
                your order is dispatched.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>How do I track my order?</h3>
              <p className={s.p}>
                Use the tracking link in your shipping confirmation email, or
                check your order status in your{" "}
                <Link href="/account" className={s.link}>
                  account
                </Link>{" "}
                or on our{" "}
                <Link href="/track-my-order" className={s.link}>
                  Track My Order
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ContentPageLayout>
  );
}
