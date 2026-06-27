import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import Link from "next/link";
import * as motion from "framer-motion/client";

const Header = () => {
  return (
    <header className="bg-gradient-to-b from-brand to-brand-accent pt-10 md:pt-24 overflow-hidden">
      <div className="md:max-w-frame mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <section className="max-w-frame px-4">
          <motion.h2
            initial={{ y: "100px", opacity: 0, rotate: 10 }}
            whileInView={{ y: "0", opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn([
              "font-bold text-3xl lg:text-[52px] lg:leading-[58px] mb-5 lg:mb-8 text-white"
            ])}
          >
            FROM THE KITCHEN TO THE CLASSROOM &mdash; FRENCH QUALITY YOU CAN TRUST
          </motion.h2>
          <motion.p
            initial={{ y: "100px", opacity: 0 }}
            whileInView={{ y: "0", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/90 text-xl leading-8 sm:text-xl sm:leading-8 lg:text-lg lg:leading-7 mb-6 lg:mb-8 max-w-[545px]"
          >
            Carefully selected French products for your home, kitchen and everyday life.
          </motion.p>
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            whileInView={{ y: "0", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 mb-5 md:mb-12"
          >
            <Link
              href="/shop"
              className="w-full sm:w-auto sm:flex-1 md:w-52 text-center bg-white hover:bg-white/90 transition-all text-brand font-semibold px-14 py-4 rounded-full hover:shadow-lg"
            >
              Shop Now
            </Link>
          </motion.div>
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            whileInView={{ y: "0", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="flex md:h-full md:max-h-11 lg:max-h-[52px] xl:max-h-[68px] items-center justify-center md:justify-start flex-nowrap gap-6 md:gap-3 lg:gap-6 xl:gap-8 mb-6 md:mb-[116px]"
          >
            <div className="flex flex-col text-center md:text-left">
              <span className="font-bold text-2xl md:text-xl lg:text-3xl xl:text-[40px] xl:mb-2 text-white">
                <AnimatedCounter from={0} to={8} />+
              </span>
              <span className="text-sm md:text-base xl:text-lg text-white/80 text-nowrap">
                French Brands
              </span>
            </div>
            <Separator
              className="ml-0 h-12 md:h-full bg-white/30 hidden sm:block"
              orientation="vertical"
            />
            <div className="flex flex-col ml-0 text-center md:text-left">
              <span className="font-bold text-2xl md:text-xl lg:text-3xl xl:text-[40px] xl:mb-2 text-white">
                <AnimatedCounter from={0} to={50} />+
              </span>
              <span className="text-sm md:text-base xl:text-lg text-white/80 text-nowrap">
                High-Quality Products
              </span>
            </div>
            <Separator
              className="hidden sm:block sm:h-12 md:h-full ml-0 bg-white/30"
              orientation="vertical"
            />
            <div className="flex flex-col w-full text-center sm:w-auto sm:text-left mt-0 sm:ml-0 md:ml-0">
              <span className="font-bold text-2xl md:text-xl lg:text-3xl xl:text-[40px] xl:mb-2 text-white">
                <AnimatedCounter from={0} to={100} />%
              </span>
              <span className="text-sm md:text-base xl:text-lg text-white/80 text-nowrap">
                French Sourced
              </span>
            </div>
          </motion.div>
        </section>
        <motion.section
          initial={{ y: "100px", opacity: 0, rotate: 10 }}
          whileInView={{ y: "0", opacity: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 2.3, duration: 0.8 }}
          className="relative md:px-4 min-h-[448px] md:min-h-[428px] mb-6 md:mb-0 bg-cover bg-top xl:bg-[center_top_-1.6rem] bg-no-repeat bg-[url('/products/homepage/homepage-package.webp')] md:bg-[url('/products/homepage/homepage-package.webp')]"
        >
        </motion.section>
      </div>
    </header>
  );
};

export default Header;
