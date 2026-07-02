import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/base-url";

export const SITE_NAME = "thelittlemart.com";
export const SITE_TAGLINE =
  "Curated everyday essentials across kitchenware, stationery, household items, condiments, personal care, and baby and kids categories.";

export function getMetadataBase(): URL {
  return new URL(getBaseUrl());
}

export function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getMetadataBase()).toString();
}

export function buildCanonical(path: string): string {
  return toAbsoluteUrl(path);
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  imagePath = "/opengraph-image",
}: PageMetadataInput): Metadata {
  const canonical = buildCanonical(path);
  const image = toAbsoluteUrl(imagePath);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function noIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
    },
  };
}
