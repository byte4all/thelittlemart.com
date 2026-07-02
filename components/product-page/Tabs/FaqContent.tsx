"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCategoryKey, getFaqsForCategory } from "@/lib/product-page-content";
import type { CategoryKey } from "@/lib/product-page-content";

type FaqContentProps = {
  /** Category slugs from the product to pick FAQ set when categoryKey not set. */
  categorySlugs?: string[];
  /** Override: use this template key instead of deriving from categorySlugs. */
  categoryKey?: CategoryKey;
};

const FaqContent = ({ categorySlugs = [], categoryKey: categoryKeyOverride }: FaqContentProps) => {
  const categoryKey = categoryKeyOverride ?? getCategoryKey(categorySlugs);
  const faqsData = getFaqsForCategory(categoryKey);

  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-bold text-black mb-5 sm:mb-6">
        Frequently asked questions
      </h3>
      <Accordion type="single" collapsible>
        {faqsData.map((faq, idx) => (
          <AccordionItem key={idx} value={`item-${idx + 1}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FaqContent;
