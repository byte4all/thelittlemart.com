import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import { satoshi } from "@/styles/fonts";
import HolyLoader from "holy-loader";
import Providers from "./providers";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import AuthSync from "@/components/auth/AuthSync";
import AuthProvider from "@/components/auth/AuthProvider";
import { SITE_NAME, SITE_TAGLINE, buildCanonical, getMetadataBase } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonical("/"),
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: buildCanonical("/"),
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: ["/twitter-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = "G-XQQ14H23QV";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={satoshi.className}>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${gaId}');
          `}
        </Script>
        <AuthProvider>
          <HolyLoader color="#868686" />
          <Providers>
            <AuthSync />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
