import React from "react";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import ProductCard from "./ProductCard";
import { Product } from "@/types/product.types";
import Link from "next/link";

type ProductListSecProps = {
  title: string;
  data: Product[];
  viewAllLink?: string;
  /** Use refined price + stars styling (main page only) */
  compact?: boolean;
};

const ProductListSec = ({ title, data, viewAllLink, compact = false }: ProductListSecProps) => {
  return (
    <section className="max-w-frame mx-auto text-center">
      <motion.h2
        initial={{ y: "100px", opacity: 0 }}
        whileInView={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={cn([
          integralCF.className,
          "text-[32px] md:text-5xl mb-8 md:mb-14 capitalize text-brand",
        ])}
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ y: "100px", opacity: 0 }}
        whileInView={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="relative w-full mb-6 md:mb-9">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="mx-4 xl:mx-0 gap-4 sm:gap-5 pr-4 sm:pr-5">
              {data.map((product, index) => (
                <CarouselItem
                  key={product.id}
                  className={cn(
                    "w-full max-w-[198px] sm:max-w-[295px] pl-0",
                    index === data.length - 1 && "mr-4 sm:mr-5"
                  )}
                >
                  <ProductCard data={product} compact={compact} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-y-1/2 top-1/2 hidden sm:flex h-9 w-9 rounded-full border-2 border-brand/30 bg-white/95 hover:bg-white shadow-md" />
            <CarouselNext className="right-0 -translate-y-1/2 top-1/2 hidden sm:flex h-9 w-9 rounded-full border-2 border-brand/30 bg-white/95 hover:bg-white shadow-md" />
          </Carousel>
        </div>
        {viewAllLink && (
          <div className="w-full px-4 sm:px-0 text-center">
            <Link
              href={viewAllLink}
              className="w-full inline-block sm:w-[218px] px-[54px] py-4 rounded-full bg-brand text-white hover:bg-brand/90 transition-all font-medium text-sm sm:text-base"
            >
              View All
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default ProductListSec;
