// Static seed records consumed by prisma/seed.ts.
// Kept separate so seed.ts stays under 300 lines.

export type SeedShop = {
  slug: string;
  name: string;
  ownerEmail: string;
  bio: string;
  story: string;
  city: string;
  region: string;
  category: string; // handicrafts | textiles | jewelry
  languages: string[];
  logoColor: string;
  products: SeedProduct[];
};

export type SeedProduct = {
  slug: string;
  title: string;
  description: string;
  priceUsdCents: number;
  categorySlug: string;
  tags: string[];
  attributes: Record<string, string>;
  images: string[];
  inventory: number;
};

export const CATEGORIES = [
  { slug: "handicrafts", name: "Handicrafts" },
  { slug: "textiles", name: "Textiles" },
  { slug: "jewelry", name: "Jewelry" },
];

export const SHOPS: SeedShop[] = [
  {
    slug: "jaipur-blue-pottery",
    name: "Jaipur Blue Pottery",
    ownerEmail: "owner+jaipur-blue@example.com",
    bio: "Hand-painted blue pottery from the workshops of Jaipur.",
    story:
      "Four generations of our family have worked with quartz-stone glazes in Jaipur's old city. Each piece is hand-thrown, hand-painted with cobalt and copper oxides, then twice fired in our wood kiln.",
    city: "Jaipur",
    region: "Rajasthan",
    category: "handicrafts",
    languages: ["en", "hi"],
    logoColor: "1e3a8a",
    products: [
      {
        slug: "blue-pottery-tea-set",
        title: "Cobalt Blue Hand-Painted Tea Set",
        description:
          "A six-piece tea set hand-painted with traditional Persian floral motifs in cobalt blue and turquoise. Each piece is shaped on the wheel, glazed with crushed quartz, and fired in a wood kiln.",
        priceUsdCents: 8900,
        categorySlug: "handicrafts",
        tags: ["pottery", "tea", "blue"],
        attributes: { material: "quartz stoneware", color: "cobalt", origin: "Jaipur" },
        images: ["Tea+Set+1", "Tea+Set+2", "Tea+Set+3"],
        inventory: 12,
      },
      {
        slug: "blue-pottery-serving-platter",
        title: "Persian Floral Serving Platter",
        description:
          "A 14-inch serving platter painted with running peacocks and pomegranate vines. Food-safe glaze; hand-wash recommended.",
        priceUsdCents: 5400,
        categorySlug: "handicrafts",
        tags: ["pottery", "platter"],
        attributes: { material: "quartz stoneware", diameter: "14in" },
        images: ["Platter+1", "Platter+2"],
        inventory: 8,
      },
      {
        slug: "blue-pottery-vase",
        title: "Hand-Painted Cobalt Vase",
        description:
          "A bulbous 10-inch vase in cobalt and white. The pattern is freehand — no two are identical.",
        priceUsdCents: 4200,
        categorySlug: "handicrafts",
        tags: ["pottery", "vase"],
        attributes: { material: "quartz stoneware", height: "10in" },
        images: ["Vase+1", "Vase+2"],
        inventory: 15,
      },
      {
        slug: "blue-pottery-mug-set",
        title: "Set of Four Hand-Painted Mugs",
        description:
          "A set of four mugs, each with a different floral motif. Microwave safe; comes in a recycled cotton drawstring bag.",
        priceUsdCents: 3600,
        categorySlug: "handicrafts",
        tags: ["pottery", "mug"],
        attributes: { material: "quartz stoneware", count: "4" },
        images: ["Mug+1", "Mug+2"],
        inventory: 25,
      },
    ],
  },
  {
    slug: "channapatna-toys",
    name: "Channapatna Wooden Toys",
    ownerEmail: "owner+channapatna@example.com",
    bio: "GI-tagged lacquered wooden toys from Karnataka.",
    story:
      "Channapatna toys have been made in our village since the 18th century. We turn ivory-wood on hand lathes and dye it with vegetable lacquer — safe for infants, brilliant in color.",
    city: "Channapatna",
    region: "Karnataka",
    category: "handicrafts",
    languages: ["en", "kn"],
    logoColor: "b45309",
    products: [
      {
        slug: "wooden-stacking-rings",
        title: "Lacquered Wooden Stacking Rings",
        description:
          "Six rainbow rings on a turned base. Hand-lacquered with non-toxic vegetable dye; safe for ages 1+.",
        priceUsdCents: 2800,
        categorySlug: "handicrafts",
        tags: ["toys", "wood"],
        attributes: { material: "ivory wood", ageRange: "1-4" },
        images: ["Stacker+1", "Stacker+2"],
        inventory: 30,
      },
      {
        slug: "wooden-spinning-top",
        title: "Hand-Turned Spinning Top",
        description: "A classic two-color spinning top with a string-launcher.",
        priceUsdCents: 1200,
        categorySlug: "handicrafts",
        tags: ["toys", "wood"],
        attributes: { material: "ivory wood" },
        images: ["Top+1"],
        inventory: 50,
      },
      {
        slug: "wooden-rattle-set",
        title: "Infant Rattle Trio",
        description: "Three lightweight wooden rattles in red, yellow, and green.",
        priceUsdCents: 2400,
        categorySlug: "handicrafts",
        tags: ["toys", "wood", "baby"],
        attributes: { material: "ivory wood", count: "3" },
        images: ["Rattle+1"],
        inventory: 40,
      },
      {
        slug: "wooden-train-pull-toy",
        title: "Pull-Along Wooden Train",
        description: "A four-car train on a cotton string. Cars wobble when pulled.",
        priceUsdCents: 3900,
        categorySlug: "handicrafts",
        tags: ["toys", "wood"],
        attributes: { material: "ivory wood" },
        images: ["Train+1", "Train+2"],
        inventory: 18,
      },
      {
        slug: "wooden-abacus",
        title: "Classic Wooden Abacus",
        description: "Ten-rod counting abacus with bright lacquered beads.",
        priceUsdCents: 3100,
        categorySlug: "handicrafts",
        tags: ["toys", "wood", "learning"],
        attributes: { material: "ivory wood" },
        images: ["Abacus+1"],
        inventory: 22,
      },
    ],
  },
  {
    slug: "kanchipuram-silks",
    name: "Kanchipuram Heritage Silks",
    ownerEmail: "owner+kanchipuram@example.com",
    bio: "Pure mulberry silk sarees from Tamil Nadu.",
    story:
      "Our looms in Kanchipuram have been weaving zari sarees for temple festivals for over 80 years. Every saree carries our signature: a contrast border woven separately, then interlocked thread-by-thread.",
    city: "Kanchipuram",
    region: "Tamil Nadu",
    category: "textiles",
    languages: ["en", "ta"],
    logoColor: "991b1b",
    products: [
      {
        slug: "kanchipuram-temple-border-saree",
        title: "Temple-Border Kanchipuram Silk Saree",
        description:
          "Six yards of pure mulberry silk with a 4-inch temple-design zari border. Pallu features a peacock motif. Comes with an unstitched blouse piece.",
        priceUsdCents: 32000,
        categorySlug: "textiles",
        tags: ["saree", "silk", "wedding"],
        attributes: { material: "mulberry silk", length: "6 yards", color: "maroon-gold" },
        images: ["Saree+1", "Saree+2", "Saree+3"],
        inventory: 6,
      },
      {
        slug: "kanchipuram-checks-saree",
        title: "Pure Silk Checks Saree",
        description: "A lighter daily-wear silk in mustard and emerald checks.",
        priceUsdCents: 18000,
        categorySlug: "textiles",
        tags: ["saree", "silk"],
        attributes: { material: "mulberry silk", weight: "500g" },
        images: ["Saree+Checks+1", "Saree+Checks+2"],
        inventory: 10,
      },
      {
        slug: "kanchipuram-dupatta",
        title: "Silk Zari Dupatta",
        description: "A 2.5m dupatta with a hand-woven zari border, perfect over a kurta.",
        priceUsdCents: 7400,
        categorySlug: "textiles",
        tags: ["dupatta", "silk"],
        attributes: { material: "mulberry silk", length: "2.5m" },
        images: ["Dupatta+1"],
        inventory: 14,
      },
      {
        slug: "kanchipuram-stole",
        title: "Hand-Woven Silk Stole",
        description: "A lightweight silk stole with peacock motifs at each end.",
        priceUsdCents: 4900,
        categorySlug: "textiles",
        tags: ["stole", "silk"],
        attributes: { material: "mulberry silk" },
        images: ["Stole+1"],
        inventory: 20,
      },
    ],
  },
  {
    slug: "bagh-print-mp",
    name: "Bagh Print Studio",
    ownerEmail: "owner+bagh@example.com",
    bio: "Natural-dye block-printed cotton from Madhya Pradesh.",
    story:
      "Bagh prints are made with carved teak blocks and dyes from pomegranate skin, alum, and iron. The cloth is washed in the river Bagh — a process that brings the colors to life.",
    city: "Bagh",
    region: "Madhya Pradesh",
    category: "textiles",
    languages: ["en", "hi"],
    logoColor: "78350f",
    products: [
      {
        slug: "bagh-print-bedsheet",
        title: "Hand-Block Printed Cotton Bedsheet",
        description:
          "A queen-size bedsheet in indigo and madder, hand-printed with traditional Bagh floral blocks. 100% cotton, naturally dyed.",
        priceUsdCents: 11900,
        categorySlug: "textiles",
        tags: ["bedsheet", "cotton", "block-print"],
        attributes: { material: "cotton", size: "queen" },
        images: ["Bedsheet+1", "Bedsheet+2"],
        inventory: 9,
      },
      {
        slug: "bagh-print-stole",
        title: "Bagh Print Cotton Stole",
        description: "A breathable cotton stole in red and black geometric blocks.",
        priceUsdCents: 2900,
        categorySlug: "textiles",
        tags: ["stole", "cotton", "block-print"],
        attributes: { material: "cotton" },
        images: ["Stole+1", "Stole+2"],
        inventory: 24,
      },
      {
        slug: "bagh-print-kurta-fabric",
        title: "Block-Printed Kurta Fabric (2.5m)",
        description: "2.5m of unstitched cotton fabric, enough for one kurta.",
        priceUsdCents: 3800,
        categorySlug: "textiles",
        tags: ["fabric", "cotton", "block-print"],
        attributes: { material: "cotton", length: "2.5m" },
        images: ["Fabric+1"],
        inventory: 18,
      },
      {
        slug: "bagh-print-cushion-cover",
        title: "Cushion Cover Pair",
        description: "A pair of 16-inch cushion covers in indigo florals.",
        priceUsdCents: 2400,
        categorySlug: "textiles",
        tags: ["cushion", "cotton", "block-print"],
        attributes: { material: "cotton", size: "16in" },
        images: ["Cushion+1", "Cushion+2"],
        inventory: 30,
      },
      {
        slug: "bagh-print-napkin-set",
        title: "Set of Six Cotton Napkins",
        description: "Six block-printed dinner napkins in mixed motifs.",
        priceUsdCents: 1900,
        categorySlug: "textiles",
        tags: ["napkin", "cotton", "block-print"],
        attributes: { material: "cotton", count: "6" },
        images: ["Napkin+1"],
        inventory: 40,
      },
    ],
  },
  {
    slug: "jaipur-meenakari",
    name: "Jaipur Meenakari",
    ownerEmail: "owner+meenakari@example.com",
    bio: "Enamel-on-silver Meenakari jewelry from Rajasthan.",
    story:
      "Meenakari — fusing colored enamel onto sterling silver — was brought to Jaipur in the 16th century. We still polish each piece by hand and seal it with a layer of natural lac.",
    city: "Jaipur",
    region: "Rajasthan",
    category: "jewelry",
    languages: ["en", "hi"],
    logoColor: "6d28d9",
    products: [
      {
        slug: "meenakari-peacock-earrings",
        title: "Peacock Meenakari Drop Earrings",
        description: "Sterling silver with green and blue enamel, finished with freshwater pearls.",
        priceUsdCents: 6900,
        categorySlug: "jewelry",
        tags: ["earrings", "silver", "enamel"],
        attributes: { material: "sterling silver", weight: "12g" },
        images: ["Earrings+1", "Earrings+2"],
        inventory: 14,
      },
      {
        slug: "meenakari-bangle-pair",
        title: "Meenakari Bangle Pair",
        description: "A pair of silver bangles enameled in ruby red with white floral inlay.",
        priceUsdCents: 12900,
        categorySlug: "jewelry",
        tags: ["bangle", "silver", "enamel"],
        attributes: { material: "sterling silver", size: "2.6" },
        images: ["Bangle+1"],
        inventory: 8,
      },
      {
        slug: "meenakari-pendant",
        title: "Lotus Meenakari Pendant",
        description: "A small lotus pendant in pink and green enamel on a silver chain.",
        priceUsdCents: 5400,
        categorySlug: "jewelry",
        tags: ["pendant", "silver", "enamel"],
        attributes: { material: "sterling silver", chainLength: "18in" },
        images: ["Pendant+1"],
        inventory: 18,
      },
      {
        slug: "meenakari-ring",
        title: "Adjustable Meenakari Ring",
        description: "An adjustable silver ring with a single enameled peacock-feather motif.",
        priceUsdCents: 3900,
        categorySlug: "jewelry",
        tags: ["ring", "silver", "enamel"],
        attributes: { material: "sterling silver" },
        images: ["Ring+1"],
        inventory: 22,
      },
    ],
  },
  {
    slug: "tn-temple-jewelry",
    name: "Madurai Temple Jewelry",
    ownerEmail: "owner+temple@example.com",
    bio: "Gold-finish temple jewelry from Tamil Nadu, used in Bharatanatyam.",
    story:
      "Temple jewelry was traditionally adorned on deities in South Indian temples. Today, we make heirloom-quality replicas worn by Bharatanatyam dancers and brides.",
    city: "Madurai",
    region: "Tamil Nadu",
    category: "jewelry",
    languages: ["en", "ta"],
    logoColor: "92400e",
    products: [
      {
        slug: "temple-jewelry-haaram",
        title: "Bridal Lakshmi Haaram",
        description:
          "A long temple-jewelry necklace with Lakshmi pendant motifs, set with red and green AD stones. Gold-finished brass.",
        priceUsdCents: 18900,
        categorySlug: "jewelry",
        tags: ["necklace", "temple", "bridal"],
        attributes: { material: "gold-plated brass", length: "32in" },
        images: ["Haaram+1", "Haaram+2"],
        inventory: 5,
      },
      {
        slug: "temple-jewelry-jhumka",
        title: "Temple Jhumka Earrings",
        description: "Classic gold-finish jhumkas with peacock stems and ruby drops.",
        priceUsdCents: 5900,
        categorySlug: "jewelry",
        tags: ["earrings", "temple", "jhumka"],
        attributes: { material: "gold-plated brass" },
        images: ["Jhumka+1"],
        inventory: 16,
      },
      {
        slug: "temple-jewelry-vanki",
        title: "Bharatanatyam Vanki (Armlet)",
        description: "An ornate upper-arm band worn during Bharatanatyam performances.",
        priceUsdCents: 7400,
        categorySlug: "jewelry",
        tags: ["armlet", "temple", "dance"],
        attributes: { material: "gold-plated brass" },
        images: ["Vanki+1"],
        inventory: 8,
      },
      {
        slug: "temple-jewelry-nathu",
        title: "Bridal Nose Ring (Nathu)",
        description: "A large hoop nose ring with chain link to the ear, ruby and pearl drops.",
        priceUsdCents: 4900,
        categorySlug: "jewelry",
        tags: ["nose-ring", "temple", "bridal"],
        attributes: { material: "gold-plated brass" },
        images: ["Nathu+1"],
        inventory: 10,
      },
      {
        slug: "temple-jewelry-anklet",
        title: "Heavy Ghungroo Anklets",
        description: "A pair of silver anklets with 100 ghungroo bells each — for dance practice.",
        priceUsdCents: 6400,
        categorySlug: "jewelry",
        tags: ["anklet", "temple", "dance"],
        attributes: { material: "silver-plated brass" },
        images: ["Anklet+1"],
        inventory: 12,
      },
    ],
  },
];
