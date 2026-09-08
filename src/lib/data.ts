import type { IconName } from "@/lib/icons";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProductTag =
  | "Local"
  | "Personalised"
  | "Premium"
  | "Sustainable"
  | "Useful";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeroVisualCard {
  src: string;
  alt: string;
  caption: string;
}

export interface TrustedCustomer {
  name: string;
  since: string;
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
  priceBand: string;
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
/* Placeholder photography — draft stock, replace with brand assets.   */
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
  eyebrow: "Corporate gifting, curated",
  headline: "Corporate gifting, without the boring part.",
  subtext:
    "Find gifts people actually keep — unique, useful pieces discovered with India's finest local makers, curated for your team, your clients and every moment worth marking.",
  primaryCta: "Get a Custom Quote",
  visualCards: [
    {
      src: UNSPLASH("photo-1549465220-1a8b9238cd48"),
      alt: "A gift wrapped in craft paper with a golden ribbon",
      caption: "Curated & gift-ready",
    },
    {
      src: UNSPLASH("photo-1513201099705-a9746e1e201f"),
      alt: "Hand-wrapped presents stacked with linen ribbon",
      caption: "Hand-finished, piece by piece",
    },
    {
      src: UNSPLASH("photo-1512909006721-3d6018887383"),
      alt: "A white gift box tied with twine and a dried flower",
      caption: "From 60+ artisan studios",
    },
  ] as HeroVisualCard[],
  floatingTag: "Handcrafted in Jaipur",
};

/* ------------------------------------------------------------------ */
/* Trusted customers                                                   */
/* ------------------------------------------------------------------ */

/* Draft facts — confirm customer names and years before final publish. */
export const trusted = {
  eyebrow: "Trusted by teams like yours",
  title: "The clients who gift with us keep coming back.",
  lede: "Repeat customers across tech, consumer and consulting — year after year, brief after brief.",
  customers: [
    { name: "Google", since: "2022" },
    { name: "Apple", since: "2023" },
    { name: "Stark Tech", since: "2021" },
    { name: "AvadheshCo", since: "2024" },
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
    priceBand: "₹1,800–₹2,600",
    photo: UNSPLASH("photo-1586075010923-2dd4570fb338"),
    photoAlt: "Hand-glazed blue pottery pieces on a studio table",
  },
  {
    id: "soy-wax-candle-trio",
    name: "Soy Wax Candle Trio",
    category: "Festive & Diwali",
    tags: ["Local", "Sustainable"],
    blurb: "Three hand-poured candles — sandalwood, oud and neroli — in reusable tins.",
    priceBand: "₹1,200–₹1,800",
    photo: UNSPLASH("photo-1603006905003-be475563bc59"),
    photoAlt: "Hand-poured candles in amber tins",
  },
  {
    id: "artisanal-leather-journal",
    name: "Artisanal Leather Journal",
    category: "Custom & Bespoke",
    tags: ["Personalised", "Premium"],
    blurb: "Full-grain leather, hand-stitched in Rajasthan and foil-monogrammed with your mark.",
    priceBand: "₹1,500–₹2,200",
    photo: UNSPLASH("photo-1544816155-12df9643f363"),
    photoAlt: "A hand-stitched leather journal with a monogram",
  },
  {
    id: "brass-planter-duo",
    name: "Brass Planter Duo",
    category: "Employee Appreciation",
    tags: ["Useful", "Local"],
    blurb: "Hand-cast brass planters with a live jade and snake-plant pairing.",
    priceBand: "₹1,200–₹1,800",
    photo: UNSPLASH("photo-1485955900006-10f4d324d411"),
    photoAlt: "Small potted plants in metal planters on a desk",
  },
  {
    id: "cashmere-travel-wrap",
    name: "Cashmere Travel Wrap",
    category: "Client & CXO",
    tags: ["Premium"],
    blurb: "Featherweight cashmere blend, rolled into a ribbon-tied gift tube.",
    priceBand: "₹4,500–₹6,000",
    photo: UNSPLASH("photo-1520903920243-00d872a2d1c9"),
    photoAlt: "A soft folded travel wrap tied with a ribbon",
  },
  {
    id: "tea-connoisseur-chest",
    name: "Tea Connoisseur Chest",
    category: "Festive & Diwali",
    tags: ["Premium", "Useful"],
    blurb: "Eight single-estate teas with a double-walled glass brewer.",
    priceBand: "₹2,000–₹3,000",
    photo: UNSPLASH("photo-1544787219-7f47ccb76574"),
    photoAlt: "Loose-leaf tea being steeped in a glass cup",
  },
  {
    id: "recycled-cork-desk-mat",
    name: "Recycled Cork Desk Mat",
    category: "New Joiner Kits",
    tags: ["Sustainable", "Useful"],
    blurb: "Cork-and-rubber desk mat, laser-etched with your logo or their initials.",
    priceBand: "₹800–₹1,200",
    photo: UNSPLASH("photo-1497215728101-856f4ea42174"),
    photoAlt: "A tidy desk set-up with a natural cork mat",
  },
  {
    id: "mysore-silk-stole",
    name: "Mysore Silk Stole",
    category: "Corporate Events",
    tags: ["Local", "Premium"],
    blurb: "Handloom silk stoles, gift-ready in a screen-printed cotton sleeve.",
    priceBand: "₹1,800–₹2,800",
    photo: UNSPLASH("photo-1610030469983-98e550d6193c"),
    photoAlt: "Folded handloom silk stoles in rich colours",
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
  photo: UNSPLASH("photo-1459908676235-d5f02a50184b"),
  photoAlt: "An artisan's hands printing fabric with carved wooden blocks",
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
  },
  {
    title: "Beyond the dry-fruit box: festive gifting, rethought",
    excerpt:
      "Diwali hampers your clients haven't already received — from hand-poured candles to single-estate teas.",
    category: "Inspiration",
    readTime: "4 min read",
    href: "#",
  },
  {
    title: "How we choose our makers",
    excerpt:
      "Inside our vetting process — craft, working conditions and the quiet details that decide who joins the network.",
    category: "Behind the Scenes",
    readTime: "5 min read",
    href: "#",
  },
];

/* ------------------------------------------------------------------ */
/* Need Help Choosing                                                  */
/* ------------------------------------------------------------------ */

export const helpChoosing = {
  title: "Need help choosing?",
  body: "Tell Piku what you're looking for — occasion, audience, budget — and we'll curate the options for you. Prefer to write it out? Send a brief straight to the team.",
  primaryCta: "Help Me Choose",
  primaryAction: "chat",
  secondaryCta: "Send a Gifting Brief",
  secondaryAction: "brief",
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
