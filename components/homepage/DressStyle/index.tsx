import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import * as motion from "framer-motion/client";
import DressStyleCard from "./DressStyleCard";

const DressStyle = () => {
  return (
    <div className="px-4 pt-6 xl:px-0">
      {/* pt only — no bottom padding so gap to Brands stays small */}
      <section className="max-w-frame mx-auto bg-[#1a1a1a] px-6 pb-4 pt-10 md:px-[70px] md:pt-[70px] md:pb-8 rounded-[40px] text-center">
        <motion.h2
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn([
            integralCF.className,
            "text-[32px] leading-[36px] md:text-5xl mb-8 md:mb-14 capitalize text-white",
          ])}
        >
          BROWSE BY Product Category
        </motion.h2>
        <motion.div
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row md:h-[289px] space-y-4 sm:space-y-0 sm:space-x-5 mb-4 sm:mb-5"
        >
          <DressStyleCard
            title="Kitchenware"
            url="/shop?category=kitchenware"
            imageSrc="/products/category/kitchenware/kitchenware.webp"
            imageSizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 40vw, 407px"
            className="h-[190px] md:max-w-[260px] lg:max-w-[360px] xl:max-w-[407px]"
          />
          <DressStyleCard
            title="Stationery"
            url="/shop?category=stationery"
            imageSrc="/products/category/stationery/stationery.webp"
            imageSizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 60vw, 684px"
            className="h-[190px] md:max-w-[684px]"
          />
        </motion.div>
        <motion.div
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-col sm:flex-row md:h-[289px] space-y-4 sm:space-y-0 sm:space-x-5 mb-4 sm:mb-5"
        >
          <DressStyleCard
            title="Household Items"
            url="/shop?category=household-items"
            imageSrc="/products/category/household-items/household-items.webp"
            imageSizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 60vw, 684px"
            className="h-[190px] md:max-w-[684px]"
          />
          <DressStyleCard
            title="Personal Care"
            url="/shop?category=personal-care"
            imageSrc="/products/category/personal-care/personal-care.webp"
            imageSizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 40vw, 407px"
            className="h-[190px] md:max-w-[260px] lg:max-w-[360px] xl:max-w-[407px]"
          />
        </motion.div>
        <motion.div
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-col sm:flex-row md:h-[289px] space-y-4 sm:space-y-0 sm:space-x-5 mb-2 sm:mb-4"
        >
          <DressStyleCard
            title="Baby & Kids"
            url="/shop?category=baby-kids"
            imageSrc="/products/category/baby-and-kids/baby-and-kids.webp"
            imageSizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 60vw, 684px"
            className="h-[190px] md:max-w-[684px]"
          />
          <DressStyleCard
            title="Condiments"
            url="/shop?category=condiments"
            imageSrc="/products/category/condiments/condiments.webp"
            imageSizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 40vw, 407px"
            className="h-[190px] md:max-w-[260px] lg:max-w-[360px] xl:max-w-[407px]"
          />
        </motion.div>
      </section>
    </div>
  );
};

export default DressStyle;
