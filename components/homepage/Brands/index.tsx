"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";

const brandsData: { id: string; srcUrl: string }[] = [
  { id: "APTA", srcUrl: "/products/brands/APTA.svg" },
  { id: "BIC", srcUrl: "/products/brands/BIC.svg" },
  { id: "DOMEDIA", srcUrl: "/products/brands/DOMEDIA.svg" },
  { id: "Itinéraires Des Saveurs", srcUrl: "/products/brands/Itinéraires Des Saveurs.svg" },
  { id: "MAPED", srcUrl: "/products/brands/MAPED.svg" },
  { id: "OXFORD", srcUrl: "/products/brands/OXFORD.svg" },
  { id: "LABELL", srcUrl: "/products/brands/labell.svg" },
  { id: "Pomette", srcUrl: "/products/brands/pommette.webp" },
];

const AUTO_SCROLL_INTERVAL_MS = 2800;
const USER_PAUSE_MS = 5000;
const LOOP_MULTIPLIER = 3;

const Brands = () => {
  const [tappedName, setTappedName] = useState<string | null>(null);
  const [tappedCardKey, setTappedCardKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const currentIndexRef = useRef(0);
  const pauseTimeoutRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const loopedBrands = useMemo(
    () =>
      Array.from({ length: LOOP_MULTIPLIER }, (_, loopIndex) =>
        brandsData.map((brand, originalIndex) => ({
          ...brand,
          originalIndex,
          key: `${loopIndex}-${brand.id}-${originalIndex}`,
        }))
      ).flat(),
    []
  );

  const syncCards = useCallback(() => {
    const container = carouselRef.current;
    if (!container) {
      cardsRef.current = [];
      return;
    }
    cardsRef.current = Array.from(
      container.querySelectorAll<HTMLElement>("[data-brand-card='true']")
    );
  }, []);

  const handleTap = (name: string, key: string) => {
    if (tooltipTimeoutRef.current !== null) {
      window.clearTimeout(tooltipTimeoutRef.current);
    }
    setTappedName(name);
    setTappedCardKey(key);
    tooltipTimeoutRef.current = window.setTimeout(() => {
      setTappedName(null);
      setTappedCardKey(null);
    }, 1500);
  };

  const scrollToBrand = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
      const container = carouselRef.current;
      if (!container || brandsData.length === 0) return;

      const safeIndex = ((nextIndex % brandsData.length) + brandsData.length) % brandsData.length;
      const middleStartIndex = brandsData.length;
      const targetIndex = middleStartIndex + safeIndex;
      const cards = cardsRef.current;
      const targetCard = cards[targetIndex];
      if (!targetCard) return;

      currentIndexRef.current = safeIndex;
      setActiveIndex(safeIndex);
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetCard.getBoundingClientRect();
      const leftOffset = targetRect.left - containerRect.left + container.scrollLeft;
      const centeredLeft = leftOffset - (container.clientWidth - targetCard.clientWidth) / 2;
      container.scrollTo({
        left: Math.max(0, centeredLeft),
        behavior,
      });
    },
    []
  );

  const pauseAutoScroll = useCallback(() => {
    isPausedRef.current = true;
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(() => {
      isPausedRef.current = false;
    }, USER_PAUSE_MS);
  }, []);

  useEffect(() => {
    syncCards();
    scrollToBrand(0, "auto");
  }, [scrollToBrand, syncCards]);

  useEffect(() => {
    const handleResize = () => {
      syncCards();
      scrollToBrand(currentIndexRef.current, "auto");
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollToBrand, syncCards]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isPausedRef.current) return;
      scrollToBrand(currentIndexRef.current + 1);
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
      if (tooltipTimeoutRef.current !== null) {
        window.clearTimeout(tooltipTimeoutRef.current);
      }
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, [scrollToBrand]);

  const handleCarouselScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;

    const container = carouselRef.current;
    if (!container || brandsData.length === 0) return;

    const segmentWidth = container.scrollWidth / LOOP_MULTIPLIER;
    if (container.scrollLeft < segmentWidth * 0.5) {
      container.scrollLeft += segmentWidth;
    } else if (container.scrollLeft > segmentWidth * 1.5) {
      container.scrollLeft -= segmentWidth;
    }

    const cards = cardsRef.current;
    if (!cards.length) return;

      const middleStartIndex = brandsData.length;
      const middleStartCard = cards[middleStartIndex];
      const firstCard = cards[0];
      const secondCard = cards[1];
      if (!middleStartCard || !firstCard) return;

      const step =
        secondCard?.offsetLeft !== undefined
          ? secondCard.offsetLeft - firstCard.offsetLeft
          : firstCard.offsetWidth;
      if (!step) return;

      const centerX = container.scrollLeft + container.clientWidth / 2;
      const middleCenter = middleStartCard.offsetLeft + middleStartCard.offsetWidth / 2;
      const estimatedIndex =
        Math.round((centerX - middleCenter) / step) + middleStartIndex;
      const clampedIndex = Math.max(0, Math.min(cards.length - 1, estimatedIndex));
      const normalizedIndex = clampedIndex % brandsData.length;
      if (normalizedIndex === currentIndexRef.current) return;

    currentIndexRef.current = normalizedIndex;
    setActiveIndex(normalizedIndex);
    });
  }, []);

  return (
    <div className="hidden md:block bg-black relative">
      {/* Less top padding — sits closer to category section above */}
      <div className="max-w-frame mx-auto px-4 xl:px-0 pt-2 md:pt-4">
        <h2
          className={cn([
            integralCF.className,
            "text-white text-3xl sm:text-4xl md:text-5xl tracking-wide mb-5 md:mb-6 text-center",
          ])}
        >
          BRANDS
        </h2>
      </div>
      <div
        ref={carouselRef}
        onTouchStart={pauseAutoScroll}
        onMouseDown={pauseAutoScroll}
        onWheel={pauseAutoScroll}
        onScroll={handleCarouselScroll}
        className="max-w-frame mx-auto flex items-center gap-4 md:gap-5 pb-8 md:pb-10 px-4 xl:px-0 overflow-x-auto snap-x snap-mandatory"
      >
        {loopedBrands.map((brand) => (
          <div key={brand.key} className="relative pt-8">
            {tappedName === brand.id && tappedCardKey === brand.key && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-white/95 text-black text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                {brand.id}
              </div>
            )}
            <button
              type="button"
              title={brand.id}
              onClick={() => {
                pauseAutoScroll();
                handleTap(brand.id, brand.key);
              }}
              data-brand-card="true"
              className="snap-center rounded-lg flex items-center justify-center w-[176px] h-[96px] sm:w-[200px] sm:h-[108px] md:w-[224px] md:h-[120px] lg:w-[248px] lg:h-[132px] p-2 shrink-0 bg-white border border-white/50 hover:border-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-current={brand.originalIndex === activeIndex ? "true" : "false"}
            >
              <Image
                src={brand.srcUrl}
                width={248}
                height={132}
                loading="lazy"
                sizes="(max-width: 640px) 176px, (max-width: 768px) 200px, (max-width: 1024px) 224px, 248px"
                alt={brand.id}
                className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Brands;
