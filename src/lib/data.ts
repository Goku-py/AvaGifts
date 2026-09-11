import type { ClientLogoName } from "@/components/ui/client-logos";
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
  since: string;
  sector: string;
  /** Key into the placeholder mark registry in ui/client-logos.tsx. */
  logo: ClientLogoName;
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
  icon: IconName;
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface LifecycleStage {
  title: string;
  body: string;
  icon: IconName;
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
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  href: string;
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

export const navLinks: NavLink[] = [
  { label: "Gifts", href: "#gifts" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Gifting Journal", href: "#journal" },
  { label: "For Makers", href: "#for-makers" },
];

export const headerCta = "Get a Custom Quote";

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
 * DRAFT — placeholder client names.
 *
 * These are deliberately generic stand-ins. Do NOT substitute real company
 * names or logos until the client relationship is confirmed and permission to
 * use the mark is on file. The `logo` key points at our own placeholder
 * artwork in ui/client-logos.tsx — swap that for the supplied brand asset at
 * the same time you swap the name.
 */
export const trusted = {
  eyebrow: "Trusted by teams like yours",
  title: "The clients who gift with us keep coming back.",
  lede: "Repeat customers across tech, consumer and consulting — year after year, brief after brief.",
  customers: [
    {
      name: "Northwind Technologies",
      since: "2021",
      sector: "Enterprise software",
      logo: "northwind",
    },
    {
      name: "Meridian Consulting",
      since: "2022",
      sector: "Management consulting",
      logo: "meridian",
    },
    { name: "Lumen Health", since: "2023", sector: "Healthcare", logo: "lumen" },
    {
      name: "Kestrel Retail Group",
      since: "2024",
      sector: "Consumer retail",
      logo: "kestrel",
    },
  ] as TrustedCustomer[],
};

/* ------------------------------------------------------------------ */
/* Gift Discoveries                                                    */
/* ------------------------------------------------------------------ */

export const discoveries = {
  eyebrow: "Gift Discoveries",
  title: "Gifts they'll actually keep.",
  lede: "A shortlist of pieces our clients reorder — maker-made, brandable and delivered gift-ready. Filter by what matters to you.",
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
  eyebrow: "Why AvaGifts",
  title: "Built for busy teams.",
  lede: "We removed everything painful about corporate gifting — minimums, follow-ups and forgettable gifts.",
};

export const whyPoints: WhyPoint[] = [
  {
    title: "Lower MOQs",
    body: "Beautiful gifting shouldn't start at 500 units. Start at 25 and scale when you're ready.",
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
    body: "60+ studios and craft clusters across India — many of whom don't sell corporate.",
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

/* ------------------------------------------------------------------ */
/* How We Execute                                                      */
/* ------------------------------------------------------------------ */

export const howWeExecute = {
  eyebrow: "How We Execute",
  title: "One brief in. A finished programme out.",
  vendorMessage: "You don't have to manage multiple vendors.",
  vendorBody:
    "Sourcing, branding, quality checks, wrapping and multi-city delivery — one team carries all of it, so your inbox carries none of it.",
};

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

/* ------------------------------------------------------------------ */
/* Ava Assurance                                                       */
/* ------------------------------------------------------------------ */

export const assurance = {
  eyebrow: "Ava Assurance",
  title: "Gifting, backed by AvaGifts.",
  lede: "An official guarantee that travels with every gift — from the maker's bench to your recipient's desk.",
  badgeTitle: "AvaCare Warranty",
  badgeBody: "Official guarantee on every order",
  stages: [
    {
      title: "Responsibly sourced",
      body: "Direct from 60+ vetted artisan studios and craft clusters.",
      icon: "Handshake" as IconName,
    },
    {
      title: "Inspected piece by piece",
      body: "Every unit checked, cleaned and gift-wrapped by hand.",
      icon: "ShieldCheck" as IconName,
    },
    {
      title: "Branded & proofed",
      body: "Your branding proofed with you before anything prints.",
      icon: "Palette" as IconName,
    },
    {
      title: "Delivered & tracked",
      body: "Multi-city drops with tracking and proof of delivery.",
      icon: "Package" as IconName,
    },
  ],
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

export const journal = {
  eyebrow: "Gifting Journal",
  title: "Notes from the world of thoughtful gifting.",
  lede: "Guides, maker stories and ideas for gifting that lands.",
};

export const journalArticles: JournalArticle[] = [
  {
    title: "The corporate gifting guide for busy teams",
    excerpt:
      "Budgets, timelines and the etiquette nobody tells you — everything to plan a gifting programme that people remember.",
    category: "Guides",
    readTime: "6 min read",
    href: "#",
    photo: UNSPLASH("photo-1672256019300-9589d730bedd"),
    photoAlt: "A leather journal fastened with a metal clasp",
  },
  {
    title: "Beyond the dry-fruit box: festive gifting, rethought",
    excerpt:
      "Diwali hampers your clients haven't already received — from hand-poured candles to single-estate teas.",
    category: "Inspiration",
    readTime: "4 min read",
    href: "#",
    photo: UNSPLASH("photo-1551975173-0493fae765d2"),
    photoAlt: "Stacked glazed clay pots in blue and terracotta",
  },
  {
    title: "How we choose our makers",
    excerpt:
      "Inside our vetting process — craft, working conditions and the quiet details that decide who joins the network.",
    category: "Behind the Scenes",
    readTime: "5 min read",
    href: "#",
    photo: UNSPLASH("photo-1544031089-3ebe8bf549b0"),
    photoAlt: "An artisan stamping a repeating pattern onto white cloth",
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
  eyebrow: "Get started",
  title: "Tell us what you're gifting. We'll take it from here.",
  lede: "Share the occasion and we'll come back with a shortlist, samples and a quote — within 48 hours.",
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
