import type { IconName } from "@/lib/icons";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProductTag = "Local" | "Personalised" | "Premium" | "Sustainable" | "Useful";

export interface Category {
  slug: string;
  title: string;
  blurb: string;
  icon: IconName;
  productCount: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  icon: IconName;
  tags: ProductTag[];
  blurb: string;
  priceBand: string;
}

export interface WhyPoint {
  title: string;
  body: string;
  icon: IconName;
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface Stat {
  value: string;
  label: string;
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export const categories: Category[] = [
  {
    slug: "employee-appreciation",
    title: "Employee Appreciation",
    blurb:
      "Everyday recognition that lands — work anniversaries, milestone thanks and team wins, wrapped beautifully.",
    icon: "Gift",
    productCount: 48,
  },
  {
    slug: "client-cxo",
    title: "Client & CXO",
    blurb:
      "Boardroom-grade gifts that open doors and keep them open. Quietly premium, never forgettable.",
    icon: "Briefcase",
    productCount: 36,
  },
  {
    slug: "festive-diwali",
    title: "Festive & Diwali",
    blurb:
      "Hamper season, handled — artisan mithai tins, hand-poured candles and handloom textiles.",
    icon: "Flame",
    productCount: 52,
  },
  {
    slug: "new-joiner-kits",
    title: "New Joiner Kits",
    blurb:
      "Day-one welcome kits new hires actually keep — useful, branded and boxed with care.",
    icon: "Package",
    productCount: 24,
  },
  {
    slug: "corporate-events",
    title: "Corporate Events",
    blurb:
      "Speaker gifts, attendee kits and stage-ready swag — minus the landfill.",
    icon: "PartyPopper",
    productCount: 31,
  },
  {
    slug: "custom-bespoke",
    title: "Custom & Bespoke",
    blurb:
      "One brief in, a fully bespoke gift programme out. Designed with our makers, end to end.",
    icon: "PenTool",
    productCount: 18,
  },
];

export const featuredProducts: Product[] = [
  {
    id: "blue-pottery-desk-set",
    name: "Blue Pottery Desk Set",
    category: "Client & CXO",
    icon: "NotebookPen",
    tags: ["Premium", "Local"],
    blurb: "Hand-glazed Jaipur blue pottery — pen stand, coaster pair and card holder.",
    priceBand: "₹1,800–₹2,600",
  },
  {
    id: "soy-wax-candle-trio",
    name: "Soy Wax Candle Trio",
    category: "Festive & Diwali",
    icon: "Flame",
    tags: ["Local", "Sustainable"],
    blurb: "Three hand-poured candles — sandalwood, oud and neroli — in reusable tins.",
    priceBand: "₹1,200–₹1,800",
  },
  {
    id: "artisanal-leather-journal",
    name: "Artisanal Leather Journal",
    category: "Custom & Bespoke",
    icon: "NotebookPen",
    tags: ["Personalised", "Premium"],
    blurb: "Full-grain leather, hand-stitched in Rajasthan and foil-monogrammed with your mark.",
    priceBand: "₹1,500–₹2,200",
  },
  {
    id: "brass-planter-duo",
    name: "Brass Planter Duo",
    category: "Employee Appreciation",
    icon: "Flower2",
    tags: ["Useful", "Local"],
    blurb: "Hand-cast brass planters with a live jade and snake-plant pairing.",
    priceBand: "₹1,200–₹1,800",
  },
  {
    id: "cashmere-travel-wrap",
    name: "Cashmere Travel Wrap",
    category: "Client & CXO",
    icon: "Gem",
    tags: ["Premium"],
    blurb: "Featherweight cashmere blend, rolled into a ribbon-tied gift tube.",
    priceBand: "₹4,500–₹6,000",
  },
  {
    id: "tea-connoisseur-chest",
    name: "Tea Connoisseur Chest",
    category: "Festive & Diwali",
    icon: "Coffee",
    tags: ["Premium", "Useful"],
    blurb: "Eight single-estate teas with a double-walled glass brewer.",
    priceBand: "₹2,000–₹3,000",
  },
  {
    id: "recycled-cork-desk-mat",
    name: "Recycled Cork Desk Mat",
    category: "New Joiner Kits",
    icon: "Layers",
    tags: ["Sustainable", "Useful"],
    blurb: "Cork-and-rubber desk mat, laser-etched with your logo or their initials.",
    priceBand: "₹800–₹1,200",
  },
  {
    id: "mysore-silk-stole",
    name: "Mysore Silk Stole",
    category: "Corporate Events",
    icon: "Ribbon",
    tags: ["Local", "Premium"],
    blurb: "Handloom silk stoles, gift-ready in a screen-printed cotton sleeve.",
    priceBand: "₹1,800–₹2,800",
  },
];

export const whyPoints: WhyPoint[] = [
  {
    title: "Lower MOQs",
    body: "Beautiful gifting shouldn’t start at 500 units. Start at 25 and scale when you’re ready.",
    icon: "Boxes",
  },
  {
    title: "Full Customisation",
    body: "Logo, palette, packaging, note card — every layer designed with you, not templated at you.",
    icon: "Palette",
  },
  {
    title: "Faster Turnarounds",
    body: "Quotes in 48 hours, samples in a week, delivery on the date you circled.",
    icon: "Timer",
  },
  {
    title: "Exclusive Artisan Network",
    body: "60+ studios and craft clusters across India — many of whom don’t sell corporate.",
    icon: "Handshake",
  },
  {
    title: "Dedicated Project Manager",
    body: "One point of contact from brief to doorstep. No ticket queues, no handoffs.",
    icon: "UserCheck",
  },
  {
    title: "AvaCare Warranty",
    body: "Broken, delayed or not as pictured? We replace it — no forms, no follow-ups.",
    icon: "ShieldCheck",
  },
];

export const processSteps: ProcessStep[] = [
  {
    title: "Share your brief",
    body: "Occasion, audience, budget band and quantities — five minutes, one form.",
  },
  {
    title: "We curate & source",
    body: "Your project manager shortlists from 60+ artisan partners and sends samples.",
  },
  {
    title: "Customise & brand",
    body: "Branding, packaging and personal notes — proofed with you before anything prints.",
  },
  {
    title: "Quality check, piece by piece",
    body: "Every single unit is inspected, cleaned and gift-wrapped by hand.",
  },
  {
    title: "Delivered, door to door",
    body: "Multi-city drops, fully tracked, with proof of delivery for your records.",
  },
];

export const stats: Stat[] = [
  { value: "1,200+", label: "Gifts delivered" },
  { value: "48-hr", label: "Quote turnaround" },
  { value: "60+", label: "Artisan partners" },
  { value: "4.9★", label: "Client rating" },
];

export const servicesCapabilities = [
  "Custom branding & packaging",
  "Co-packed hampers",
  "Multi-city delivery",
  "GST invoicing",
  "Dedicated project manager",
] as const;

export const company = {
  name: "AvaGifts",
  tagline: "Curated corporate gifting, without the boring part.",
  blurb:
    "Curated corporate gifting, without the boring part. We connect companies with India’s finest makers and handle everything from discovery to doorstep.",
  story: [
    "We started in a two-room Jaipur studio with a simple frustration: corporate gifts were either mass-produced clutter or beautiful things no team could source at work-friendly quantities. So we built the bridge — a curated network of block printers, brass casters, ceramicists and weavers, paired with the logistics and invoicing a procurement team actually needs.",
    "Today our makers ship to boardrooms and break rooms across India. Every gift is inspected piece by piece, wrapped by hand, and backed by our AvaCare promise. The boring part is ours to carry; the delight is yours to give.",
  ],
  founded: "Founded in Jaipur, 2024",
  cities: "Jaipur · Delhi · Mumbai",
  email: "hello@avagifts.in",
  phoneDisplay: "+91 98XXX XXXXX",
  phoneHref: "tel:+9198XXXXXXX",
} as const;
