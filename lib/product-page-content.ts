/**
 * Category-specific FAQ and Product Details (specs) for current catalog categories.
 */

export type FaqItem = { question: string; answer: string };
export type SpecItem = { label: string; value: string };

export type CategoryKey =
  | "stationery"
  | "stationery-pen-and-pencils"
  | "stationery-papers-filing"
  | "stationery-geometry"
  | "stationery-staplers-and-staples"
  | "household-items"
  | "household-items-cleaning-supplies"
  | "household-items-laundry-and-drying"
  | "household-items-insect-repellents"
  | "kitchenware"
  | "kitchenware-cooking-tools"
  | "kitchenware-bakeware-and-ovenware"
  | "kitchenware-bar-and-drinks"
  | "kitchenware-dining"
  | "kitchenware-candles-and-party"
  | "kitchenware-kitchen-tools"
  | "condiments"
  | "condiments-french-salt"
  | "condiments-oil-and-vinegars"
  | "personal-care"
  | "baby-kids"
  | "default";

export const TEMPLATE_OPTIONS: { value: CategoryKey | ""; label: string }[] = [
  { value: "", label: "Auto (from category)" },
  { value: "stationery", label: "Stationery (general)" },
  { value: "stationery-pen-and-pencils", label: "Stationery - Pen & Pencils" },
  { value: "stationery-papers-filing", label: "Stationery - Papers & Filing" },
  { value: "stationery-geometry", label: "Stationery - Geometry" },
  { value: "stationery-staplers-and-staples", label: "Stationery - Staplers & Staples" },
  { value: "household-items", label: "Household Items (general)" },
  { value: "household-items-cleaning-supplies", label: "Household - Cleaning Supplies" },
  { value: "household-items-laundry-and-drying", label: "Household - Laundry & Drying" },
  { value: "household-items-insect-repellents", label: "Household - Insect Repellents" },
  { value: "kitchenware", label: "Kitchenware (general)" },
  { value: "kitchenware-cooking-tools", label: "Kitchenware - Cooking Tools" },
  { value: "kitchenware-bakeware-and-ovenware", label: "Kitchenware - Bakeware & Ovenware" },
  { value: "kitchenware-bar-and-drinks", label: "Kitchenware - Bar & Drinks" },
  { value: "kitchenware-dining", label: "Kitchenware - Dining" },
  { value: "kitchenware-candles-and-party", label: "Kitchenware - Candles & Party" },
  { value: "kitchenware-kitchen-tools", label: "Kitchenware - Kitchen Tools" },
  { value: "condiments", label: "Condiments (general)" },
  { value: "condiments-french-salt", label: "Condiments - French Salt" },
  { value: "condiments-oil-and-vinegars", label: "Condiments - Oil & Vinegars" },
  { value: "personal-care", label: "Personal Care" },
  { value: "baby-kids", label: "Baby & Kids" },
  { value: "default", label: "Default" },
];

const RETURN_EXCHANGE_TEXT =
  "You may return or exchange eligible items within 30 days of delivery. Items must be unused, in original packaging, and with proof of purchase. Refunds are processed to the original payment method within 5-10 business days after we receive the return.";

/** Resolve category key from assigned category slugs. */
export function getCategoryKey(categorySlugs: string[]): CategoryKey {
  const lower = categorySlugs.map((s) => s.toLowerCase().trim());

  // Hybrid strategy: check subcategory-specific keys first.
  if (lower.includes("pen-and-pencils")) return "stationery-pen-and-pencils";
  if (lower.includes("papers-filing")) return "stationery-papers-filing";
  if (lower.includes("geometry")) return "stationery-geometry";
  if (lower.includes("staplers-and-staples")) return "stationery-staplers-and-staples";

  if (lower.includes("cleaning-supplies")) return "household-items-cleaning-supplies";
  if (lower.includes("laundry-and-drying")) return "household-items-laundry-and-drying";
  if (lower.includes("insect-repellents")) return "household-items-insect-repellents";

  if (lower.includes("cooking-tools")) return "kitchenware-cooking-tools";
  if (lower.includes("bakeware-and-ovenware")) return "kitchenware-bakeware-and-ovenware";
  if (lower.includes("bar-and-drinks")) return "kitchenware-bar-and-drinks";
  if (lower.includes("dining")) return "kitchenware-dining";
  if (lower.includes("candles-and-party")) return "kitchenware-candles-and-party";
  if (lower.includes("kitchen-tools")) return "kitchenware-kitchen-tools";

  if (lower.includes("french-salt")) return "condiments-french-salt";
  if (lower.includes("oil-and-vinegars")) return "condiments-oil-and-vinegars";

  if (lower.includes("stationery")) return "stationery";
  if (lower.includes("household-items")) return "household-items";
  if (lower.includes("kitchenware")) return "kitchenware";
  if (lower.includes("condiments")) return "condiments";
  if (lower.includes("personal-care")) return "personal-care";
  if (lower.includes("baby-kids")) return "baby-kids";

  return "default";
}

const FAQ_BY_CATEGORY: Record<CategoryKey, FaqItem[]> = {
  stationery: [
    { question: "Who are these stationery products suitable for?", answer: "Our stationery range is suitable for school, office, and home use. Product pages show specific sizes and formats where relevant." },
    { question: "Are these items sold individually or in packs?", answer: "Both. Some items are sold as single pieces while others are sold in multipacks. Check the product title and description for exact quantity." },
    { question: "How can I choose the right stationery item?", answer: "Use the product description and images to confirm dimensions, paper format, tip type, or refill compatibility before ordering." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "stationery-pen-and-pencils": [
    { question: "Are these pens and pencils suitable for daily writing?", answer: "Yes. They are selected for everyday school and office writing, with product descriptions indicating lead type, ink type, or tip category." },
    { question: "Do writing instruments come pre-filled or ready to use?", answer: "Most products are ready to use. Refill-based products are labeled clearly in the product name and description." },
    { question: "Can I find color information before ordering?", answer: "Yes. Available colors and product images are shown on each product page when color variants apply." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "stationery-papers-filing": [
    { question: "What paper formats are available in this category?", answer: "Products include practical formats such as A4 and card sizes. Exact dimensions and quantity per pack are listed on each product page." },
    { question: "Are these products compatible with standard binders and folders?", answer: "Most filing products are designed for common binder formats. Please verify compatibility details in each product description." },
    { question: "How do I confirm sheet count before purchase?", answer: "Sheet or unit count is stated in the product title and description." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "stationery-geometry": [
    { question: "Are these geometry tools suitable for school use?", answer: "Yes. Items such as rulers, protractors, set squares, and compasses are suitable for classroom and homework use." },
    { question: "Are measurement markings visible and accurate?", answer: "Products are selected for clear, readable markings. Refer to product images for visual confirmation of scale style." },
    { question: "What materials are these tools made from?", answer: "Most geometry tools are durable plastics or standard school-safe materials; exact material is listed when provided by the supplier." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "stationery-staplers-and-staples": [
    { question: "How do I know if staples are compatible with my stapler?", answer: "Check the staple size noted in the product title and compare with your stapler model requirements." },
    { question: "Do staplers include starter staples?", answer: "Some staplers include starter staples while others do not. This is indicated on the product page." },
    { question: "Are refill staples sold separately?", answer: "Yes. Staple refill products are available and listed with quantity per box or pack." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "household-items": [
    { question: "What type of products are in Household Items?", answer: "This category includes practical home essentials for cleaning, laundry, and everyday household maintenance." },
    { question: "How do I choose the right household product?", answer: "Check intended use, quantity, and safety instructions in the product description before purchase." },
    { question: "Can I use these products daily?", answer: "Most products are designed for routine use, but always follow care and safety instructions shown on packaging and product pages." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "household-items-cleaning-supplies": [
    { question: "Which surfaces are these cleaning products suitable for?", answer: "Surface suitability varies by product. Please read each product description to confirm recommended uses and avoid incompatible surfaces." },
    { question: "Are these products intended for household use?", answer: "Yes. Products in this category are selected for regular home cleaning tasks." },
    { question: "Do cleaning products include usage guidance?", answer: "Yes. Usage direction is provided in product descriptions and should be followed for best results." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "household-items-laundry-and-drying": [
    { question: "What products are included in laundry and drying?", answer: "This section includes practical accessories such as clothespins and hanging clips for everyday laundry use." },
    { question: "Are these items reusable?", answer: "Yes. Most products in this section are durable and intended for repeated use." },
    { question: "Can they be used indoors and outdoors?", answer: "Most laundry accessories can be used both indoors and outdoors; check product details where needed." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "household-items-insect-repellents": [
    { question: "What kind of pest-control products are in this section?", answer: "This section includes household insect-control products intended for crawling insects and common home pest situations." },
    { question: "How should these products be used safely?", answer: "Follow all label instructions and keep products away from children, food-contact surfaces, and direct inhalation when not indicated." },
    { question: "Can I use these products indoors?", answer: "Usage setting depends on each product. Check the product page and label instructions for indoor/outdoor suitability." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  kitchenware: [
    { question: "What does the Kitchenware category include?", answer: "Kitchenware includes cooking tools, bakeware, drink accessories, dining tools, and party table accessories." },
    { question: "Are these products suitable for everyday home use?", answer: "Yes. Products are selected for daily household kitchen and dining use unless otherwise stated." },
    { question: "Can I find dimensions and capacities before ordering?", answer: "Yes. Product pages provide relevant dimensions, capacities, and usage notes where available." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "kitchenware-cooking-tools": [
    { question: "What products are considered cooking tools?", answer: "Examples include utensils, preparation tools, and serving tools used directly during food preparation." },
    { question: "Are these safe for regular kitchen tasks?", answer: "Yes. They are intended for common household cooking and prep use. Check material notes per product." },
    { question: "How should I care for cooking tools?", answer: "Care instructions vary by material. Refer to each product description and packaging guidance for cleaning recommendations." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "kitchenware-bakeware-and-ovenware": [
    { question: "Are these dishes oven-safe?", answer: "Bakeware and ovenware products are listed with intended heat use. Check each product page for usage compatibility before purchase." },
    { question: "Can these be used in microwave or dishwasher?", answer: "Compatibility differs by product. Refer to each product description for microwave and dishwasher guidance." },
    { question: "How do I choose the right dish size?", answer: "Use the dimensions in the title/specification to match your recipe portion and oven space." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "kitchenware-bar-and-drinks": [
    { question: "What products are included in Bar & Drinks?", answer: "This section includes drinkware and bar accessories such as glasses, corkscrews, stoppers, and measuring tools." },
    { question: "Are these items suitable for hosting and events?", answer: "Yes. Products are chosen for practical use during gatherings, celebrations, and everyday beverage service." },
    { question: "Do product pages mention capacity and quantity?", answer: "Yes. Volume and pack quantity are specified where relevant." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "kitchenware-dining": [
    { question: "What kind of dining products are available?", answer: "Dining products include table-use accessories and specialty serving tools for home meals and occasions." },
    { question: "Are these products reusable?", answer: "Most products in this section are reusable unless specifically labeled as disposable." },
    { question: "How do I verify what is included in a set?", answer: "Set quantity is stated in the product title and description." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "kitchenware-candles-and-party": [
    { question: "What products are in Candles & Party?", answer: "This section includes celebration candles and related party table accessories." },
    { question: "Are these products intended for occasional use?", answer: "Yes. Most items are designed for birthdays, parties, and special events." },
    { question: "Are safety instructions provided?", answer: "Please follow standard candle and party safety guidance and any notes shown on product packaging." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "kitchenware-kitchen-tools": [
    { question: "How are kitchen tools different from cooking tools?", answer: "Kitchen tools here focus on measurement, utility, and prep support tasks rather than direct stovetop utensils." },
    { question: "Are these tools easy to clean?", answer: "Most are designed for practical kitchen maintenance. Check each product page for care instructions." },
    { question: "Can I use these in a home kitchen setup?", answer: "Yes. They are curated for everyday home kitchen use." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  condiments: [
    { question: "What products are in the Condiments category?", answer: "Condiments include gourmet salts, vinegars, and flavor-enhancing pantry items." },
    { question: "How should condiments be stored?", answer: "Store in a cool, dry place and keep containers sealed after opening unless product labels state otherwise." },
    { question: "Can I use these for daily cooking?", answer: "Yes. Condiments are intended for regular seasoning, finishing, and recipe use based on product type." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "condiments-french-salt": [
    { question: "What is French salt used for?", answer: "French salts can be used for cooking, seasoning, or finishing dishes depending on grain size and style." },
    { question: "What is the difference between coarse and fine salt?", answer: "Coarse salt is often used in cooking or grinding, while fine salt is easier for direct table use and quick seasoning." },
    { question: "How should I store these salts?", answer: "Keep salts in a dry, airtight container away from moisture." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "condiments-oil-and-vinegars": [
    { question: "How can I use these vinegars in cooking?", answer: "They are suitable for dressings, marinades, seasoning, and flavor balancing in both cold and cooked dishes." },
    { question: "Do these products include volume information?", answer: "Yes. Product pages list bottle volume where provided by supplier data." },
    { question: "How should I store oils and vinegars?", answer: "Store tightly closed in a cool place away from direct sunlight to preserve quality." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "personal-care": [
    { question: "What products are included in Personal Care?", answer: "This category currently includes daily hygiene essentials such as toilet paper and related home personal-use items." },
    { question: "Are these suitable for everyday home use?", answer: "Yes. Products are selected for daily household use and convenience." },
    { question: "How do I check pack quantity before ordering?", answer: "Pack count and format are shown in the product title and description." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  "baby-kids": [
    { question: "What type of products are in Baby & Kids?", answer: "This category includes child and family-oriented essentials. Please review each product page for age or usage guidance when relevant." },
    { question: "How do I choose the right product for my child?", answer: "Check product description, usage notes, and any age-specific guidance before purchase." },
    { question: "Can adults use some products in this category?", answer: "Some items may be family-friendly; always rely on each product's intended usage description." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
  default: [
    { question: "How do I know if this product is right for my needs?", answer: "Review the product description, images, and specifications for intended use, size, and quantity before ordering." },
    { question: "How should I care for or store this product?", answer: "Follow instructions on product packaging and any care notes shown on the product page." },
    { question: "Where can I check shipping details?", answer: "Shipping timelines and charges are shown during checkout based on your location and order." },
    { question: "What is your return and exchange policy?", answer: RETURN_EXCHANGE_TEXT },
  ],
};

const SPECS_BY_CATEGORY: Record<CategoryKey, SpecItem[]> = {
  stationery: [
    { label: "Use case", value: "School, office, and home organization" },
    { label: "Format", value: "Varies by product" },
    { label: "Pack details", value: "See product title and description" },
    { label: "Care", value: "Store in a dry place" },
  ],
  "stationery-pen-and-pencils": [
    { label: "Writing type", value: "Pen, pencil, or marker depending on product" },
    { label: "Color", value: "See product images and available colors" },
    { label: "Quantity", value: "Single item or pack as listed" },
    { label: "Use", value: "Daily writing and drawing tasks" },
  ],
  "stationery-papers-filing": [
    { label: "Format", value: "A4/card sizes depending on product" },
    { label: "Quantity", value: "See pack count in product title" },
    { label: "Compatibility", value: "Standard filing/binder formats where noted" },
    { label: "Use", value: "Filing, notes, and document organization" },
  ],
  "stationery-geometry": [
    { label: "Tool type", value: "Ruler, protractor, set square, or compass" },
    { label: "Measurement", value: "Graduated markings for school/office use" },
    { label: "Material", value: "Durable plastic or standard tool material" },
    { label: "Use", value: "Geometry and technical drawing" },
  ],
  "stationery-staplers-and-staples": [
    { label: "Category", value: "Staplers and refill staples" },
    { label: "Size", value: "Staple size indicated per product" },
    { label: "Quantity", value: "Pack/box count shown per item" },
    { label: "Use", value: "Document binding for school and office" },
  ],
  "household-items": [
    { label: "Category", value: "Home maintenance essentials" },
    { label: "Use", value: "Cleaning, laundry, and upkeep tasks" },
    { label: "Safety", value: "Follow product-specific usage guidance" },
    { label: "Storage", value: "Keep in dry, appropriate household storage" },
  ],
  "household-items-cleaning-supplies": [
    { label: "Use", value: "General home surface and floor cleaning" },
    { label: "Application", value: "See product instructions for suitable surfaces" },
    { label: "Safety", value: "Use as directed on label" },
    { label: "Storage", value: "Store away from children and food prep areas" },
  ],
  "household-items-laundry-and-drying": [
    { label: "Use", value: "Laundry support and drying accessories" },
    { label: "Material", value: "Varies by item (wood, plastic, or mixed)" },
    { label: "Durability", value: "Designed for repeated household use" },
    { label: "Storage", value: "Store dry between uses" },
  ],
  "household-items-insect-repellents": [
    { label: "Use", value: "Household insect control" },
    { label: "Target", value: "Common crawling insects (product dependent)" },
    { label: "Application", value: "Indoor/outdoor as specified per product" },
    { label: "Safety", value: "Follow all label precautions" },
  ],
  kitchenware: [
    { label: "Category", value: "Cooking, serving, and kitchen utility products" },
    { label: "Material", value: "Varies by product (glass, steel, wood, etc.)" },
    { label: "Use", value: "Everyday food prep, serving, and hosting" },
    { label: "Care", value: "Refer to individual product guidance" },
  ],
  "kitchenware-cooking-tools": [
    { label: "Use", value: "Food preparation and cooking support" },
    { label: "Material", value: "Wood, stainless steel, or mixed" },
    { label: "Compatibility", value: "Typical home cookware and prep tasks" },
    { label: "Care", value: "Clean according to product material guidance" },
  ],
  "kitchenware-bakeware-and-ovenware": [
    { label: "Use", value: "Baking, roasting, and oven preparation" },
    { label: "Size", value: "See listed dimensions for each dish" },
    { label: "Compatibility", value: "Oven/microwave/dishwasher as specified per item" },
    { label: "Care", value: "Avoid sudden thermal shock for glassware" },
  ],
  "kitchenware-bar-and-drinks": [
    { label: "Use", value: "Drink service and bar accessories" },
    { label: "Capacity", value: "See product volume/capacity details" },
    { label: "Set size", value: "Quantity per pack indicated on each item" },
    { label: "Care", value: "Handle and clean according to material" },
  ],
  "kitchenware-dining": [
    { label: "Use", value: "Dining accessories and table service tools" },
    { label: "Set details", value: "Number of pieces listed in product title" },
    { label: "Material", value: "See product specifications" },
    { label: "Care", value: "Follow material-specific cleaning instructions" },
  ],
  "kitchenware-candles-and-party": [
    { label: "Use", value: "Celebrations and party table setup" },
    { label: "Quantity", value: "Pack size shown per product" },
    { label: "Safety", value: "Keep candles away from open drafts and children" },
    { label: "Storage", value: "Store in a cool, dry place" },
  ],
  "kitchenware-kitchen-tools": [
    { label: "Use", value: "Measuring and kitchen utility support" },
    { label: "Accuracy", value: "Product-specific measurement utility where applicable" },
    { label: "Material", value: "See product details" },
    { label: "Care", value: "Clean and dry after use" },
  ],
  condiments: [
    { label: "Category", value: "Seasoning and flavor products" },
    { label: "Use", value: "Cooking, finishing, and taste balancing" },
    { label: "Storage", value: "Store sealed in a cool, dry place" },
    { label: "Origin details", value: "See product description where provided" },
  ],
  "condiments-french-salt": [
    { label: "Type", value: "Fine, coarse, or fleur de sel variants" },
    { label: "Use", value: "Cooking or finishing depending on grain type" },
    { label: "Storage", value: "Airtight container away from moisture" },
    { label: "Pack size", value: "See product title for weight" },
  ],
  "condiments-oil-and-vinegars": [
    { label: "Type", value: "Vinegar and related flavoring products" },
    { label: "Use", value: "Dressings, marinades, and seasoning" },
    { label: "Volume", value: "See product page for bottle size" },
    { label: "Storage", value: "Keep sealed away from direct heat/sunlight" },
  ],
  "personal-care": [
    { label: "Category", value: "Daily hygiene essentials" },
    { label: "Use", value: "Routine personal or household hygiene use" },
    { label: "Pack details", value: "See quantity on product title/description" },
    { label: "Storage", value: "Store dry and clean" },
  ],
  "baby-kids": [
    { label: "Category", value: "Family and child-focused essentials" },
    { label: "Use", value: "Refer to product-specific intended use" },
    { label: "Guidance", value: "Check age/usage notes where provided" },
    { label: "Storage", value: "Store safely out of children's reach unless in use" },
  ],
  default: [
    { label: "Details", value: "See product description" },
    { label: "Use", value: "Follow instructions on packaging and product page" },
    { label: "Shipping", value: "Shown at checkout based on delivery address" },
  ],
};

export function getFaqsForCategory(categoryKey: CategoryKey): FaqItem[] {
  return FAQ_BY_CATEGORY[categoryKey] ?? FAQ_BY_CATEGORY.default;
}

export function getSpecsForCategory(categoryKey: CategoryKey): SpecItem[] {
  return SPECS_BY_CATEGORY[categoryKey] ?? SPECS_BY_CATEGORY.default;
}
