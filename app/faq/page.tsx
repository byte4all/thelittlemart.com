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
  const returnExchangeText =
    "You may return or exchange eligible items within 30 days of delivery. Items must be unused, in original packaging, and with proof of purchase. Refunds will be processed to the original payment method within 5-10 business days after we receive the return. For exchanges, please contact Customer Support to arrange size or product exchanges.";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What products does thelittlemart currently offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our current catalog focuses on practical essentials including Stationery, Household Items, Kitchenware, Condiments, Personal Care, and Baby & Kids.",
        },
      },
      {
        "@type": "Question",
        name: "How can I get support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can contact us through Customer Support or Contact Us. For order-related requests, include your order number for faster assistance.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept bank transfer, duitnow,major credit and debit cards (Visa, Mastercard). Payment is processed securely at checkout.",
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
          text: "We currently ship within Malaysia. Shipping fees and delivery estimates are shown at checkout.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer pickup and shipping?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Depending on your order and location, available fulfillment options are shown during checkout.",
        },
      },
      {
        "@type": "Question",
        name: "What is your return and exchange policy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: returnExchangeText,
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
        <a href="#orders-payment" className={s.link}>
          Orders & Payment
        </a>
        <a href="#shipping-pickup" className={s.link}>
          Shipping & Pickup
        </a>
        <a href="#returns-exchanges" className={s.link}>
          Returns & Exchanges
        </a>
        <a href="#products" className={s.link}>
          Product Categories
        </a>
      </nav>

      <div className="space-y-10">
        <section id="general" className={s.section}>
          <h2 className={s.h2}>General FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>What products does thelittlemart currently offer?</h3>
              <p className={s.p}>
                Our current catalog focuses on practical essentials including
                Stationery, Household Items, Kitchenware, Condiments, Personal
                Care, and Baby & Kids.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>How can I get support?</h3>
              <p className={s.p}>
                Visit{" "}
                <Link href="/customer-support" className={s.link}>
                  Customer Support
                </Link>{" "}
                or{" "}
                <Link href="/contact-us" className={s.link}>
                  Contact Us
                </Link>{" "}
                for assistance. For order issues, include your order number so
                we can help faster.
              </p>
            </div>
          </div>
        </section>

        <section id="orders-payment" className={s.section}>
          <h2 className={s.h2}>Orders & Payment</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>What payment methods do you accept?</h3>
              <p className={s.p}>
                We accept major credit and debit cards (Visa, Mastercard),
                PayPal, Apple Pay, and Google Pay.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>Can I review my order after checkout?</h3>
              <p className={s.p}>
                Yes. You can review order details in your account, and you will
                also receive order emails with key updates.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>Can I get a receipt or invoice reference?</h3>
              <p className={s.p}>
                Yes. Your order confirmation email serves as your receipt, and
                order details remain available in your account history.
              </p>
            </div>
          </div>
        </section>

        <section id="shipping-pickup" className={s.section}>
          <h2 className={s.h2}>Shipping & Pickup</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>Where do you ship?</h3>
              <p className={s.p}>
                We currently ship within Malaysia. Delivery estimates and
                shipping fees are shown during checkout.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>Do you offer pickup as well as shipping?</h3>
              <p className={s.p}>
                Yes. Depending on your order, available fulfillment options are
                shown at checkout.
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

        <section id="returns-exchanges" className={s.section}>
          <h2 className={s.h2}>Returns & Exchanges</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>What is your return and exchange policy?</h3>
              <p className={s.p}>{returnExchangeText}</p>
            </div>
            <div>
              <h3 className={s.h3}>Where can I read the full policy?</h3>
              <p className={s.p}>
                Please refer to our{" "}
                <Link href="/terms-of-service#return-exchange" className={s.link}>
                  Terms of Service
                </Link>{" "}
                for the full return and exchange terms.
              </p>
            </div>
          </div>
        </section>

        <section id="products" className={s.section}>
          <h2 className={s.h2}>Product Categories</h2>
          <div className="space-y-6">
            <div>
              <h3 className={s.h3}>How are product FAQs matched to items?</h3>
              <p className={s.p}>
                Product-page FAQs are matched to each item's current category or
                subcategory, such as Kitchenware, Stationery, Household Items,
                Condiments, Personal Care, and Baby & Kids.
              </p>
            </div>
            <div>
              <h3 className={s.h3}>Why are FAQs different between products?</h3>
              <p className={s.p}>
                Some subcategories use specialized FAQ templates for clearer
                guidance. For example, Cleaning Supplies, French Salt, or Pen &
                Pencils may show more specific usage answers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ContentPageLayout>
  );
}
