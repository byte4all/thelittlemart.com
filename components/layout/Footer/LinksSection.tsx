import { AUTH_LOGIN_PATH } from "@/lib/auth/login-path";
import { FooterLinks } from "./footer.types";
import Link from "next/link";
import { cn } from "@/lib/utils";

const footerLinksData: FooterLinks[] = [
  {
    id: 1,
    title: "company",
    children: [
      { id: 11, label: "About Us", url: "/about-us" },
      { id: 12, label: "Privacy Policy", url: "/privacy-policy" },
      { id: 13, label: "Terms Of Service", url: "/terms-of-service" },
    ],
  },
  {
    id: 2,
    title: "help",
    children: [
      { id: 21, label: "Contact Us", url: "/contact-us" },
      { id: 22, label: "Track My Order", url: "/track-my-order" },
      { id: 23, label: "Customer Support", url: "/customer-support" },
    ],
  },
  {
    id: 3,
    title: "faq",
    children: [
      { id: 31, label: "General FAQ", url: "/faq#general" },
      { id: 32, label: "Payment & Billing", url: "/faq#payment-billing" },
      { id: 33, label: "Shipping Questions", url: "/faq#shipping" },
    ],
  },
  {
    id: 4,
    title: "account",
    children: [
      { id: 41, label: "Login", url: AUTH_LOGIN_PATH },
      { id: 42, label: "Register", url: "/auth/sign-up" },
      { id: 43, label: "My Orders", url: "/account/orders" },
    ],
  },
];

const LinksSection = () => {
  return (
    <>
      {footerLinksData.map((item) => (
        <section className="flex flex-col mt-5" key={item.id}>
          <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">
            {item.title}
          </h3>
          {item.children.map((link) => (
            <Link
              href={link.url}
              key={link.id}
              className={cn([
                (link.id === 41 || link.id === 42 || link.id === 43) ? "" : "capitalize",
                "text-black/60 text-sm md:text-base mb-4 w-fit",
              ])}
            >
              {link.label}
            </Link>
          ))}
        </section>
      ))}
    </>
  );
};

export default LinksSection;
