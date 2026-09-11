import type { IconName } from "@/lib/icons";
import type { ConciergeStep } from "@/lib/piku-concierge";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProductTag =
  | "Local"
  | "Personalised"
  | "Premium"
  | "Sustainable";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeroVisualCard {
  src: string;
  alt: string;
  /** Category pill shown over the slide, e.g. "Tech & Connectivity". */
  category: string;
}

export interface TrustedCustomer {
  name: string;
  /** Logo artwork in public/design/. */
  logo: string;
  /** Intrinsic size of the logo file, so next/image can reserve space. */
  width: number;
  height: number;
}

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
  tags: ProductTag[];
  blurb: string;
  photo: string;
  photoAlt: string;
}

export interface WhyPoint {
  title: string;
  body: string;
  /** Path to the exported 60px icon. */
  icon: string;
  /** Intrinsic size — "Lower MOQ" is 60x59, the rest are square. */
  iconWidth: number;
  iconHeight: number;
}

export interface ProcessStep {
  title: string;
  body: string;
  /** Piku illustration for the step — 100x167 in the design. */
  image: string;
  imageAlt: string;
}

export interface AssurancePoint {
  title: string;
  body: string;
  /** Path to the exported 40px icon. */
  icon: string;
}

export interface MakerStory {
  eyebrow: string;
  title: string;
  location: string;
  craft: string;
  paragraphs: string[];
  quote: string;
  photo: string;
  photoAlt: string;
}

export interface JournalArticle {
  /** Small label above the title. */
  eyebrow: string;
  title: string;
  subtitle: string;
  photo: string;
  photoAlt: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface Stat {
  value: string;
  label: string;
}

/* ------------------------------------------------------------------ */
/* Photography — draft stock, replace with brand assets.               */
/*                                                                     */
/* Every image below has been visually checked against the product it  */
/* sits with, and each `photoAlt` describes what the photograph        */
/* actually shows. If you swap an image, re-check the alt text with it */
/* — alt that describes an aspiration rather than the picture is worse */
/* than no alt at all for anyone using a screen reader.                */
/*                                                                     */
/* Art direction: warm neutrals, craft materials, daylight. Avoid      */
/* saturated party colours — they fight the navy/blue palette.         */
/* ------------------------------------------------------------------ */

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

/*
 * Mobile-sheet only — the design has no desktop nav. "For Makers" is gone
 * with the maker sections, so every href here must still resolve to a live
 * section id on the page.
 */
export const navLinks: NavLink[] = [
  { label: "Gifts", href: "#gifts" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Gifting Journal", href: "#journal" },
];

export const headerCta = "Talk to Gift Expert";
export const catalogCta = "Download Catalogue";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const hero = {
  eyebrow: "India's Premier B2B Platform",
  headline: "Corporate gifting, without the boring part.",
  subtext:
    "Find gifts people actually keep — unique, useful pieces discovered with India's finest local makers, curated for your team, your clients and every moment worth marking.",
  primaryCta: "Find a Gift",
  /*
   * The hero carousel. Each image in public/design/ is a COMPLETE slide
   * render at 616x721 — background tint, rings, category badge and the dot
   * row are all baked into the artwork (see hero.tsx for why none of that
   * is redrawn in the DOM).
   *
   * `category` therefore must match the badge printed in each PNG exactly:
   * it is the accessible name for that slide's control and the text a
   * screen reader hears when the carousel advances. If a slide is
   * re-exported with a different badge, update the string here to match.
   */
  visualCards: [
    {
      src: "/design/hero-slide-1.png",
      alt: "Tech gifting set — wireless charger, power bank, keyboard and desk accessories",
      category: "Tech & Connectivity",
    },
    {
      src: "/design/hero-slide-2.png",
      alt: "Mobile and personal tech — headphones, earbuds, smartwatch, phone stands and a selfie stick",
      category: "Mobile & Personal Tech",
    },
    {
      src: "/design/hero-slide-3.png",
      alt: "Wellness gifting — massage gun, humidifier, eye massager, hair dryer and an electric toothbrush",
      category: "Wellness & Personal Care",
    },
    {
      src: "/design/hero-slide-4.png",
      alt: "Home and lifestyle gifting — portable blender, travel flask, air purifier, lamp and a handheld vacuum",
      category: "Home & Lifestyle",
    },
  ] as HeroVisualCard[],
};

/* ------------------------------------------------------------------ */
/* Trusted customers                                                   */
/* ------------------------------------------------------------------ */

/*
 * TEMPORARY client logos.
 *
 * These are real, identifiable brands taken from the Figma design and are
 * placeholders for this build only — the final client list is confirmed at
 * production. Displaying a company's mark on a public site is a claim about
 * a client relationship, so before launch each one must either be replaced
 * or have written permission on file.
 *
 * `name` is the accessible name for the logo image; keep it matching the
 * artwork.
 */
export const trusted = {
  title: "Some companies don't gift with us just once.",
  lede: "They come back when the next gifting moment arrives.",
  customers: [
    { name: "Arvind Store", logo: "/design/client-1-arvind.png", width: 280, height: 280 },
    { name: "Ashirvad by Aliaxis", logo: "/design/client-2-ashirvad.png", width: 280, height: 150 },
    { name: "Cakeezyy", logo: "/design/client-3-cakeezyy.png", width: 280, height: 280 },
    { name: "bigbasket", logo: "/design/client-4-bigbasket.png", width: 280, height: 101 },
    { name: "henlo", logo: "/design/client-5-henlo.png", width: 280, height: 170 },
    { name: "Instamart", logo: "/design/client-6-instamart.png", width: 280, height: 280 },
    { name: "FirstClub", logo: "/design/client-7-firstclub.png", width: 280, height: 136 },
    { name: "Shadowfax", logo: "/design/client-8-shadowfax.png", width: 280, height: 106 },
  ] as TrustedCustomer[],
};

/* ------------------------------------------------------------------ */
/* Gift Discoveries                                                    */
/* ------------------------------------------------------------------ */

export interface DiscoveryCard {
  /** Small label above the title. */
  eyebrow: string;
  title: string;
  image: string;
  alt: string;
}

/*
 * TEMPORARY IMAGERY — the Figma frame only has four product photographs and
 * reuses two of them across the six cards, so "Best Personalised Gift" and
 * "Best Experience Gift" currently repeat the shots above them. Swap in the
 * real category photography before launch.
 */
export const discoveries = {
  title: "Gift Discoveries",
  /* Figma sets lorem here; this is the approved lede, minus its old closing
     line about filtering — the redesign has no filter chips. */
  lede: "A shortlist of pieces our clients reorder — maker-made, brandable and delivered gift-ready.",
  cards: [
    {
      eyebrow: "Selected Pick",
      title: "Gift of the Month",
      image: "/design/discovery-tech-accessories.png",
      alt: "Headphones, a smartwatch, earbuds and phone accessories arranged together",
    },
    {
      eyebrow: "Budget Curation",
      title: "Best Gifts Under ₹1,000",
      image: "/design/discovery-desk-tech.png",
      alt: "A compact keyboard, mouse, power bank, desk clock and charging hub",
    },
    {
      eyebrow: "Executive Range",
      title: "Best CXO Gifts",
      image: "/design/discovery-home-appliances.png",
      alt: "A portable blender, air purifier, handheld vacuum and ambient lamp",
    },
    {
      eyebrow: "Regional Heritage",
      title: "Best Local Discovery",
      image: "/design/discovery-personal-care.png",
      alt: "A hair dryer, humidifier, handheld vacuum and scented lamp",
    },
    {
      eyebrow: "Custom Craft",
      title: "Best Personalised Gift",
      image: "/design/discovery-home-appliances.png",
      alt: "A portable blender, air purifier, handheld vacuum and ambient lamp",
    },
    {
      eyebrow: "Memories & Events",
      title: "Best Experience Gift",
      image: "/design/discovery-desk-tech.png",
      alt: "A compact keyboard, mouse, power bank, desk clock and charging hub",
    },
  ] satisfies DiscoveryCard[],
};

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
    tags: ["Premium", "Local"],
    blurb: "Hand-glazed Jaipur blue pottery — pen stand, coaster pair and card holder.",
    photo: UNSPLASH("photo-1760124056943-eb64936d3d2a"),
    photoAlt: "Bowls hand-painted in cobalt blue and white, stacked in a row",
  },
  {
    id: "soy-wax-candle-trio",
    name: "Soy Wax Candle Trio",
    category: "Festive & Diwali",
    tags: ["Local", "Sustainable"],
    blurb: "Three hand-poured candles — sandalwood, oud and neroli — in reusable tins.",
    photo: UNSPLASH("photo-1603006905003-be475563bc59"),
    photoAlt: "A lit candle burning in a frosted glass tumbler",
  },
  {
    id: "artisanal-leather-journal",
    name: "Artisanal Leather Journal",
    category: "Custom & Bespoke",
    tags: ["Personalised", "Premium"],
    blurb: "Full-grain leather, hand-stitched in Rajasthan and foil-monogrammed with your mark.",
    photo: UNSPLASH("photo-1639371040157-55b642d03f4f"),
    photoAlt: "A leather-bound journal closed with a wrap-around tie",
  },
  {
    id: "brass-planter-duo",
    name: "Brass Planter Duo",
    category: "Employee Appreciation",
    tags: ["Local"],
    blurb: "Hand-cast brass planters with a live jade and snake-plant pairing.",
    photo: UNSPLASH("photo-1502920873987-ac48e660a95d"),
    photoAlt: "A leafy plant in a brass planter on a white desk",
  },
  {
    id: "cashmere-travel-wrap",
    name: "Cashmere Travel Wrap",
    category: "Client & CXO",
    tags: ["Premium"],
    blurb: "Featherweight cashmere blend, rolled into a ribbon-tied gift tube.",
    photo: UNSPLASH("photo-1734553529922-bc020a21643b"),
    photoAlt: "Woven throws folded and stacked in mustard and cream",
  },
  {
    id: "tea-connoisseur-chest",
    name: "Tea Connoisseur Chest",
    category: "Festive & Diwali",
    tags: ["Premium"],
    blurb: "Eight single-estate teas with a double-walled glass brewer.",
    photo: UNSPLASH("photo-1610112278819-069287c86d03"),
    photoAlt: "A tea caddy with a painted floral lid",
  },
  {
    id: "recycled-cork-desk-mat",
    name: "Recycled Cork Desk Mat",
    category: "New Joiner Kits",
    tags: ["Sustainable"],
    blurb: "Cork-and-rubber desk mat, laser-etched with your logo or their initials.",
    photo: UNSPLASH("photo-1641247565151-fe622e1067d0"),
    photoAlt: "A tidy desk with a natural-finish desk mat, phone and glasses",
  },
  {
    id: "mysore-silk-stole",
    name: "Mysore Silk Stole",
    category: "Corporate Events",
    tags: ["Local", "Premium"],
    blurb: "Handloom silk stoles, gift-ready in a screen-printed cotton sleeve.",
    photo: UNSPLASH("photo-1676696706907-0e04665b80bd"),
    photoAlt: "Teal silk falling in soft, lustrous folds",
  },
];

/* ------------------------------------------------------------------ */
/* Why AvaGifts                                                        */
/* ------------------------------------------------------------------ */

export const why = {
  title: "Why AvadheshCo",
  lede: "We are not just a catalogue. We are a curation and execution partner that helps you find the right gift, customise it, and deliver it with a human touch.",
  image: "/design/why-office-collaboration.png",
  imageAlt:
    "Two navy gift boxes tied with copper ribbon, lit against a dark backdrop",
};

/*
 * Titles and the first two bodies come from the Figma frame. The design leaves
 * the remaining four bodies as "Less waiting. More gifting." placeholder, so
 * those are condensed from the approved long-form copy to the one-line length
 * the row allows.
 */
export const whyPoints: WhyPoint[] = [
  {
    title: "Lower MOQ",
    body: "Great gifting doesn't have to start at 500 units.",
    icon: "/design/why-lower-moq.png",
    iconWidth: 60,
    iconHeight: 59,
  },
  {
    title: "Customisation",
    body: "Make the gift yours.",
    icon: "/design/why-customisation.png",
    iconWidth: 60,
    iconHeight: 60,
  },
  {
    title: "Faster Delivery",
    body: "Quotes in 48 hours, delivery on the date you circled.",
    icon: "/design/why-faster-delivery.png",
    iconWidth: 60,
    iconHeight: 60,
  },
  {
    title: "Exclusive & local",
    body: "60+ studios and craft clusters across India.",
    icon: "/design/why-exclusive-local.png",
    iconWidth: 60,
    iconHeight: 60,
  },
  {
    title: "Prompt project manager support",
    body: "One point of contact, from brief to doorstep.",
    icon: "/design/why-project-manager.png",
    iconWidth: 60,
    iconHeight: 60,
  },
  {
    title: "Ava Warranty",
    body: "Broken, delayed or not as pictured? We replace it.",
    icon: "/design/why-ava-warranty.png",
    iconWidth: 60,
    iconHeight: 60,
  },
];

/* ------------------------------------------------------------------ */
/* How We Execute                                                      */
/* ------------------------------------------------------------------ */

export const howWeExecute = {
  title: "How AvadheshCo Works",
  /* Figma leaves this as lorem; this is the approved vendor message. */
  lede: "You don't have to manage multiple vendors. Sourcing, branding, quality checks, wrapping and multi-city delivery — one team carries all of it, so your inbox carries none of it.",
};

/*
 * Four steps, matching the design. The approved copy had five: "We curate &
 * source" and "Customise & brand" are merged into "Customize Your Gifts",
 * which is the one step the design names for both halves of that work.
 */
export const processSteps: ProcessStep[] = [
  {
    title: "Tell Us What You Need",
    body: "Occasion, audience, budget band and quantities — five minutes, one form.",
    image: "/design/step-tell-us.png",
    imageAlt: "Piku listening and taking down a brief",
  },
  {
    title: "Customize Your Gifts",
    body: "Your project manager shortlists from 60+ artisan partners, then brands and packages it — proofed with you before anything prints.",
    image: "/design/step-customize.png",
    imageAlt: "Piku holding a wrapped and ribboned gift box",
  },
  {
    title: "Quality Check",
    body: "Every single unit is inspected, cleaned and gift-wrapped by hand.",
    image: "/design/step-quality-check.png",
    imageAlt: "Piku checking items off an inspection clipboard",
  },
  {
    title: "Track & Deliver",
    body: "Multi-city drops, fully tracked, with proof of delivery for your records.",
    image: "/design/step-track-deliver.png",
    imageAlt: "Piku tracking a parcel on a phone while carrying it",
  },
];

/* ------------------------------------------------------------------ */
/* Ava Assurance                                                       */
/* ------------------------------------------------------------------ */

/*
 * The hero artwork still carries "AvaGifts" branding baked into the image —
 * it needs re-exporting with the AvadheshCo lockup before launch.
 */
export const assurance = {
  title: "Gifting, backed by AvadheshCo.",
  lede: "From sourcing to delivery, your gifting project has a team behind it.",
  image: "/design/assurance-hero.png",
  imageAlt:
    "Piku holding an Ava Assurance card listing quality checks, personalisation and support",
  points: [
    {
      title: "CURATED",
      body: "Products selected for the requirement.",
      icon: "/design/assurance-curated.png",
    },
    {
      title: "QUALITY CHECKED",
      body: "Gifts goes through the required quality process.",
      icon: "/design/assurance-quality-checked.png",
    },
    {
      title: "SUPPORTED",
      body: "AvadheshCo remains available after the order.",
      icon: "/design/assurance-supported.png",
    },
  ] satisfies AssurancePoint[],
};

/* ------------------------------------------------------------------ */
/* Made Somewhere — maker story                                        */
/* ------------------------------------------------------------------ */

/* Draft narrative — swap for the commissioned maker story when final. */
export const makerStory: MakerStory = {
  eyebrow: "Made Somewhere",
  title: "Meet Radhika, block printer.",
  location: "Jaipur, Rajasthan",
  craft: "Hand block printing",
  paragraphs: [
    "Radhika learned block printing at her family's workshop in Sanganer, where the wooden blocks are carved by hand and the indigo vats are older than she is. Today she runs her own studio with nine artisans, printing table linens and gift textiles for studios across three continents.",
    "Every AvaGifts textile in her collection is printed to order — which is why no two gift runs are ever quite identical. \"A gift should feel chosen, not ordered,\" she says. We agree.",
  ],
  quote: "A gift should feel chosen, not ordered.",
  photo: UNSPLASH("photo-1748327219221-8c56726d6f75"),
  photoAlt: "An artisan pressing a carved block onto patterned cloth",
};

/* ------------------------------------------------------------------ */
/* Maker CTA                                                           */
/* ------------------------------------------------------------------ */

export const makerCta = {
  title: "Are you a maker?",
  body: "We're always looking for studios and craft clusters who want corporate clients — without losing what makes their work theirs.",
  cta: "Become a Gifting Partner",
};

/* ------------------------------------------------------------------ */
/* Gifting Journal — draft placeholder articles                        */
/* ------------------------------------------------------------------ */

/* The full-bleed banner that introduces the journal. */
export const giftingBanner = {
  titleLine1: "The Gifting Journal",
  titleLine2: "Just for You",
  /* Figma leaves this as lorem; this is the approved journal lede. */
  lede: "Guides, maker stories and ideas for gifting that lands.",
  cta: "Get a Custom Quote",
  image: "/design/banner-gifting-journal.jpg",
  imageAlt:
    "Brown paper parcels tied with red and white twine beside an open notebook and fairy lights",
};

/*
 * The design's own copy. These are not links — there are no article URLs
 * yet, and a card-wide `href="#"` would be a focusable control that scrolls
 * to the top, which is worse than no affordance at all.
 */
export const journalArticles: JournalArticle[] = [
  {
    eyebrow: "Featured Case",
    title: "One City. One Gift.",
    subtitle: "Focusing on local craft initiatives across Jaipur.",
    photo: "/design/journal-one-city.jpg",
    photoAlt:
      "Two people exchanging a small wrapped gift against a city skyline at night",
  },
  {
    eyebrow: "Featured Partner",
    title: "Supplier of the Year",
    subtitle: "Honoring our traditional woodworkers.",
    photo: "/design/journal-supplier-of-the-year.jpg",
    photoAlt: "Hands holding a gold star award on a ribbon",
  },
  {
    eyebrow: "Trend Report",
    title: "Gifting Trends 2026",
    subtitle: "Eco-packaging & authentic utility.",
    photo: "/design/journal-gifting-trends.jpg",
    photoAlt:
      "An open gift box with small wrapped presents bursting out against bokeh lights",
  },
];

/* ------------------------------------------------------------------ */
/* Need Help Choosing                                                  */
/* ------------------------------------------------------------------ */

export const helpChoosing = {
  title: "Need help choosing?",
  body: "Tell Piku what you're looking for — occasion, audience, budget — and we'll curate the options for you. Prefer to write it out? Send a brief straight to the team.",
  primaryCta: "Help Me Choose",
  /** undefined = open the concierge at the start of the conversation. */
  primaryStep: undefined,
  secondaryCta: "Send a Gifting Brief",
  /** Deep-links past the guided questions to the written-brief step. */
  secondaryStep: "brief",
  briefCardTitle: "Send a Gifting Brief",
  briefCardBody:
    "Know exactly what you need? Skip the chat and send your requirements straight to our gifting team.",
  briefCardCta: "Submit Brief",
  briefCardStep: "contact",
} satisfies {
  title: string;
  body: string;
  primaryCta: string;
  primaryStep: ConciergeStep | undefined;
  secondaryCta: string;
  secondaryStep: ConciergeStep;
  briefCardTitle: string;
  briefCardBody: string;
  briefCardCta: string;
  briefCardStep: ConciergeStep;
};

/* ------------------------------------------------------------------ */
/* Piku mini-game — quiet, optional entry points                       */
/* ------------------------------------------------------------------ */

export const pikuGame = {
  /** Small subordinate link under the concierge section's primary CTAs. */
  entryPrompt: "Prefer to play instead?",
  entryCta: "Take a quick break with Piku",
  /** Footer link, alongside the legal links. */
  footerCta: "Play with Piku",
};

/* ------------------------------------------------------------------ */
/* Final conversion                                                    */
/* ------------------------------------------------------------------ */

export const finalConversion = {
  /* The design breaks the heading across two lines explicitly. */
  titleLine1: "Tell us what you're gifting.",
  titleLine2: "We'll take it from here.",
  lede: "AvadheshCo handles everything from discovery and curation to sourcing, quality compliance, custom packaging, and end-to-end delivery.",
  quoteCta: "Get a Custom Quote",
  expertCta: "Talk to a Gifting Expert",
};

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export const footerColumns: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "Gifts", href: "#gifts" },
      { label: "Why AvaGifts", href: "#why" },
      { label: "Ava Assurance", href: "#assurance" },
      { label: "Gifting Journal", href: "#journal" },
    ],
  },
  {
    title: "For Businesses",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Get a Custom Quote", href: "#contact" },
      { label: "Need Help Choosing", href: "#help" },
    ],
  },
  {
    title: "For Makers",
    links: [
      { label: "Made Somewhere", href: "#makers" },
      { label: "Become a Gifting Partner", href: "#for-makers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "#contact" },
      { label: "hello@avagifts.in", href: "mailto:hello@avagifts.in" },
    ],
  },
];

export const legalLinks: NavLink[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

/* ------------------------------------------------------------------ */
/* Stats + company (existing content)                                  */
/* ------------------------------------------------------------------ */

export const stats: Stat[] = [
  { value: "1,200+", label: "Gifts delivered" },
  { value: "48-hr", label: "Quote turnaround" },
  { value: "60+", label: "Artisan partners" },
  { value: "4.9★", label: "Client rating" },
];

export const company = {
  name: "AvaGifts",
  tagline: "Curated corporate gifting, without the boring part.",
  blurb:
    "Curated corporate gifting, without the boring part. We connect companies with India's finest makers and handle everything from discovery to doorstep.",
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
