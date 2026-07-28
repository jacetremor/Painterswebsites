import { SERVICE_CATALOG } from "@/lib/content/catalog";
import { contentImage, SERVICE_IMAGE_KEYS, type ContentImageKey } from "@/lib/content/images";
import type {
  BlogPost,
  ContentPage,
  Location,
  Project,
  SeoFields,
  Service,
  Tenant,
  Testimonial,
} from "@/lib/types";

const UPDATED_AT = "2026-07-20T12:00:00.000Z";

function coreImageKey(tenantId: string, slug: string): ContentImageKey {
  if (!slug) return tenantId === "summit" ? "summit-home" : "heritage-home";
  if (slug === "about") return "about";
  if (slug === "contact") return "contact";
  if (slug === "gallery") return "gallery";
  if (slug === "commercial-painting") return "commercial";
  return "residential";
}

function seo(
  title: string,
  description: string,
  h1: string,
  path: string,
  index = true,
): SeoFields {
  return {
    title,
    description,
    h1,
    canonicalPath: path || "/",
    index,
    follow: true,
    ogTitle: title,
    ogDescription: description,
  };
}

function page(
  tenantId: string,
  slug: string,
  name: string,
  navLabel: string,
  intent: string,
  intro: string,
  body: string[],
  seoFields: SeoFields,
): ContentPage {
  return {
    id: `${tenantId}-page-${slug || "home"}`,
    tenantId,
    kind: "core",
    name,
    slug,
    navLabel,
    intent,
    intro,
    body,
    cta: "Request a detailed painting estimate",
    breadcrumbLabel: navLabel,
    status: "published",
    updatedAt: UPDATED_AT,
    seo: seoFields,
    heroImage: contentImage(coreImageKey(tenantId, slug), `${tenantId}-${slug || "home"}-hero`),
  };
}

const summitCorePages: ContentPage[] = [
  page(
    "summit",
    "",
    "Home",
    "Home",
    "Residential and commercial painting across Salt Lake County",
    "Thoughtful preparation, controlled finishes, and clear project communication for homes and commercial spaces across the Salt Lake Valley.",
    [
      "Summit brings a planning-first approach to Salt Lake interiors, exteriors, cabinetry, and commercial spaces.",
      "Every scope is organized around surface condition, occupied-space protection, finish selection, and a documented handoff.",
    ],
    seo(
      "Salt Lake City Painting Company | Summit Painting Co.",
      "Explore residential and commercial painting services, project planning, and estimate options across Salt Lake County.",
      "Salt Lake City Painters, Planned to the Last Detail",
      "/",
    ),
  ),
  page(
    "summit",
    "about",
    "About Summit Painting Co.",
    "About",
    "Company process and values",
    "A disciplined painting process starts with honest surface assessment and ends with a clean, documented walkthrough.",
    [
      "This demonstration profile intentionally avoids invented founders, awards, license numbers, or years of experience. Replace it with verified first-party company history before launch.",
      "The operating values modeled here are careful preparation, accountable communication, occupied-space respect, and finish recommendations that suit the substrate.",
      "Each estimate moves from site review to written scope, color and sheen confirmation, protection, preparation, application, quality review, and final walkthrough.",
    ],
    seo(
      "About Our Painting Process | Summit Painting Co.",
      "Learn how Summit Painting Co. plans preparation, communication, application, and project walkthroughs in Salt Lake County.",
      "About Summit Painting Co.",
      "/about",
    ),
  ),
  page(
    "summit",
    "contact",
    "Contact Summit Painting Co.",
    "Contact",
    "Painting estimate requests across Salt Lake County",
    "Tell us what you are painting, where the project is located, and what success looks like for the space.",
    [
      "A useful estimate request includes the surfaces involved, current condition, approximate timing, access considerations, and any products or colors already selected.",
      "The contact details on this demonstration tenant are placeholders and must be replaced and verified before production launch.",
    ],
    seo(
      "Request a Painting Estimate | Summit Painting Co.",
      "Share your Salt Lake County residential or commercial painting scope and request a detailed estimate.",
      "Request a Painting Estimate in Salt Lake City",
      "/contact",
    ),
  ),
  page(
    "summit",
    "gallery",
    "Painting Project Gallery",
    "Gallery",
    "Salt Lake County painting project examples",
    "Browse demonstration project records structured to show location, surfaces, preparation, finish choices, and accessible before-and-after context.",
    [
      "These subject-matched reference photographs illustrate the type of work being discussed without claiming completed client work. Production tenants replace them with original, permission-cleared project photographs.",
      "Every published project should connect to the service performed and the location served so visitors can follow the evidence behind the work.",
    ],
    seo(
      "Painting Project Gallery | Summit Painting Co.",
      "See structured interior and exterior painting project examples for Summit Painting Co. across Salt Lake County.",
      "Salt Lake City Painting Project Gallery",
      "/gallery",
    ),
  ),
  page(
    "summit",
    "residential-painting",
    "Residential Painting",
    "Residential",
    "Whole-home residential painting planning",
    "Residential painting should make the home feel renewed without making daily life feel chaotic.",
    [
      "Our residential model covers interior walls and trim, exterior siding and stucco, cabinetry, decks, fences, brick, and other paintable surfaces after condition review.",
      "A room-by-room protection plan, clear color schedule, and sequence for occupied spaces keep decisions and disruption manageable.",
      "Product recommendations account for cleanability, exposure, substrate movement, sheen, and the people who use the space.",
    ],
    seo(
      "Residential Painting in Salt Lake County | Summit",
      "Plan interior, exterior, cabinet, deck, fence, brick, siding, and stucco painting for your Salt Lake County home.",
      "Residential Painters in Salt Lake City, UT",
      "/residential-painting",
    ),
  ),
  page(
    "summit",
    "commercial-painting",
    "Commercial Painting",
    "Commercial",
    "Commercial painting with controlled scheduling",
    "Commercial finish work succeeds when the coating plan fits operations, access, safety, and turnover milestones.",
    [
      "The commercial workflow supports offices, retail spaces, light warehouses, multifamily common areas, and property-management scopes after a site-specific review.",
      "Phased work, off-hours options, low-odor product selection, documented color schedules, and daily closeout expectations help reduce operational friction.",
      "Preparation and access requirements are confirmed in writing before scheduling so crews and site stakeholders work from the same plan.",
    ],
    seo(
      "Commercial Painting in Salt Lake County | Summit",
      "Explore planned interior and exterior painting for offices, retail, light industrial, and multifamily properties across Salt Lake County.",
      "Commercial Painters in Salt Lake City, UT",
      "/commercial-painting",
    ),
  ),
];

const heritageCorePages: ContentPage[] = [
  page(
    "heritage",
    "",
    "Home",
    "Home",
    "Friendly residential painting across Denver's west and south metro",
    "A practical, neighborly way to refresh the rooms and exterior surfaces that make home feel like yours.",
    [
      "Heritage Paint & Finish is a demonstration brand designed around clear choices, tidy work areas, and easy-to-follow project updates.",
      "We help households think through color, durability, room access, pets, family schedules, and the small repairs that should happen before a finish coat.",
    ],
    seo(
      "Denver Metro House Painters | Heritage Paint & Finish",
      "Explore friendly interior, exterior, cabinet, deck, and fence painting options across Denver's west and south metro.",
      "Denver House Painters, Start to Finish",
      "/",
    ),
  ),
  page(
    "heritage",
    "about",
    "About Heritage Paint & Finish",
    "Our Story",
    "Residential painting values and process",
    "The best home projects feel understandable from the first conversation through the final room reset.",
    [
      "This demonstration profile does not invent an owner biography, awards, credentials, or business history. A real tenant must add and verify those details before launch.",
      "The values represented in this site are straightforward guidance, respect for the home, patient color decisions, careful cleanup, and a finish suited to everyday use.",
      "A typical project moves through a home walk-through, written priorities, color confirmation, room protection, repair and preparation, painting, touch-up review, and a homeowner walkthrough.",
    ],
    seo(
      "Our Painting Values and Process | Heritage Paint & Finish",
      "Meet the process and homeowner-focused values behind Heritage Paint & Finish in the Denver metro area.",
      "About Heritage Paint & Finish",
      "/about",
    ),
  ),
  page(
    "heritage",
    "contact",
    "Contact Heritage Paint & Finish",
    "Get an Estimate",
    "Home painting estimates in the Denver metro",
    "Share a few details about your rooms or exterior and we will help shape the next sensible step.",
    [
      "Photos, surface concerns, color ideas, pets, access details, and ideal timing all help turn an initial conversation into a useful scope.",
      "The phone, email, and address shown for this demonstration tenant are placeholders that require owner verification before production.",
    ],
    seo(
      "Get a Home Painting Estimate | Heritage Paint & Finish",
      "Start a clear, low-pressure painting estimate for your Denver metro home, rental, or small commercial property.",
      "Request a Painting Estimate in Denver",
      "/contact",
    ),
  ),
  page(
    "heritage",
    "gallery",
    "Home Painting Gallery",
    "Projects",
    "Residential painting ideas and project records",
    "See how a useful project gallery can explain the room, surface, color direction, preparation, and finish instead of showing disconnected photos.",
    [
      "These subject-matched reference photographs illustrate each project type and do not represent claimed customer work.",
      "A production gallery should use original photos with homeowner permission, accurate locations, descriptive captions, and links to the work performed.",
    ],
    seo(
      "Interior and Exterior Painting Gallery | Heritage",
      "Browse accessible demonstration project records for home interiors, exteriors, cabinets, decks, and fences.",
      "Denver Interior and Exterior Painting Gallery",
      "/gallery",
    ),
  ),
  page(
    "heritage",
    "residential-painting",
    "Residential Painting",
    "House Painting",
    "Comfortable, durable home painting",
    "From the front door to the family room, residential painting works best when the plan respects how the household actually lives.",
    [
      "Services can include walls, ceilings, trim, cabinetry, siding, stucco, brick, decks, and fences once the existing surface is evaluated.",
      "We plan around furniture, children, pets, work-from-home rooms, weather, and drying time so the sequence makes sense.",
      "Washable finishes and realistic maintenance guidance matter as much as selecting a color that feels right in the light.",
    ],
    seo(
      "Residential Painting for Denver Metro Homes | Heritage",
      "Explore approachable interior, exterior, cabinet, deck, fence, brick, siding, and stucco painting for Denver metro homes.",
      "Residential Painters in Denver, CO",
      "/residential-painting",
    ),
  ),
  page(
    "heritage",
    "commercial-painting",
    "Commercial Painting",
    "Commercial",
    "Painting for neighborhood businesses and managed properties",
    "Small businesses and property teams need a responsive painting partner who can work around customers, residents, and opening hours.",
    [
      "The demonstration commercial offering covers offices, shops, multifamily common spaces, and light warehouse areas after access and coating needs are reviewed.",
      "Flexible sequencing, low-odor options, protected walk paths, and a clear daily stopping point help keep the property usable.",
      "Safety plans and preparation methods are matched to the site rather than described with unverified blanket claims.",
    ],
    seo(
      "Commercial Painting for Denver Metro Properties | Heritage",
      "Plan considerate painting for offices, shops, multifamily common areas, and managed properties in the Denver metro.",
      "Commercial Painters in Denver, CO",
      "/commercial-painting",
    ),
  ),
];

function makeServices(tenantId: "summit" | "heritage"): Service[] {
  const isSummit = tenantId === "summit";
  return SERVICE_CATALOG.map((item, index) => {
    const focus = isSummit
      ? [
          "surface testing, controlled masking, and a finish schedule designed before application begins",
          "careful substrate preparation and a restrained finish selected for the architecture",
          "documented protection, product compatibility, and a clean final inspection",
        ][index % 3]!
      : [
          "clear choices, respectful protection, and a work sequence that fits the household",
          "practical repairs, durable products, and simple updates throughout the job",
          "patient preparation and a finish that is comfortable to maintain day to day",
        ][index % 3]!;
    const market = isSummit ? "Salt Lake County" : "Denver metro";
    const primaryCity = isSummit ? "Salt Lake City, UT" : "Denver, CO";
    const shortBrand = isSummit ? "Summit" : "Heritage";
    const brand = isSummit ? "Summit Painting Co." : "Heritage Paint & Finish";
    const intro = `${item.name} calls for ${focus}. ${brand} uses a site-specific scope for ${market} properties rather than assuming every surface needs the same system.`;
    const description = isSummit
      ? `Understand the preparation, coating options, and planning behind ${item.name.toLowerCase()} for Salt Lake County homes and properties.`
      : `Get straightforward guidance on ${item.name.toLowerCase()}, preparation, products, and scheduling for Denver metro properties.`;

    return {
      id: `${tenantId}-service-${item.slug}`,
      tenantId,
      kind: "service",
      category: item.category,
      name: item.name,
      navLabel: item.name,
      slug: item.slug,
      intent: `${item.name} evaluation and estimate in ${market}`,
      intro,
      body: [
        isSummit
          ? `The scope begins with substrate condition, adhesion risk, adjacent materials, access, and the level of finish the space can support.`
          : `We begin by looking at what is already on the surface, what is failing, how the area is used, and how the work should fit the schedule.`,
        isSummit
          ? `A written preparation and product plan keeps the finished appearance tied to measurable site conditions.`
          : `The estimate explains repairs, protection, product choices, drying expectations, and what the household can do before work starts.`,
      ],
      cta: isSummit ? `Schedule a ${item.name.toLowerCase()} assessment` : `Talk through your ${item.name.toLowerCase()} project`,
      breadcrumbLabel: item.name,
      status: "published",
      updatedAt: UPDATED_AT,
      seo: seo(
        `${item.name} in ${primaryCity} | ${shortBrand}`,
        description,
        `${item.name} in ${primaryCity}`,
        `/${item.slug}`,
      ),
      heroImage: contentImage(SERVICE_IMAGE_KEYS[item.slug]!, `${tenantId}-${item.slug}-hero`),
      useCases: [...item.useCases],
      benefits: isSummit
        ? ["A finish system matched to the substrate", "Defined protection and sequencing", "A documented final review"]
        : ["Straightforward product choices", "A plan that respects occupied spaces", "Clear care and touch-up guidance"],
      preparation: isSummit
        ? ["Inspect and test the existing finish", "Protect fixed materials and controlled work zones", "Repair, sand, clean, and prime as specified"]
        : ["Walk the space and flag repairs", "Cover floors, furniture, plants, and nearby surfaces", "Clean, patch, sand, and spot-prime where needed"],
      process: isSummit
        ? ["Confirm color, sheen, and sample acceptance", "Apply the specified coating at compatible conditions", "Inspect edges, coverage, cleanup, and closeout"]
        : ["Confirm colors and room or exterior sequence", "Apply the agreed coats with drying time between steps", "Reset the space and complete a final walkthrough"],
      materials: [...item.materials],
      concerns: isSummit
        ? ["Compatibility with the existing coating", "Weather or humidity at application", "Access, masking lines, and finish uniformity"]
        : ["Odor and room access", "Pets, plants, and furniture protection", "Durability, cleanup, and future touch-ups"],
      faq: [
        {
          question: `How is a ${item.name.toLowerCase()} estimate prepared?`,
          answer: `The estimate is based on measured scope, surface condition, access, repairs, protection, product system, and timing. Photos help, but a site review may still be needed.`,
        },
        {
          question: "Can colors and products be decided after the estimate?",
          answer: `Yes. The scope can separate preparation from final color and sheen decisions, but product compatibility must be confirmed before scheduling.`,
        },
      ],
      relatedSlugs: SERVICE_CATALOG.filter((candidate) => candidate.category === item.category && candidate.slug !== item.slug)
        .slice(0, 3)
        .map((candidate) => candidate.slug),
    };
  });
}

const summitPlaces = [
  ["Salt Lake City", "Historic avenues, brick bungalows, modern infill, and downtown commercial spaces call for sharply different preparation and access plans."],
  ["Sandy", "Foothill exposure, two-story homes, and strong afternoon sun make access, sealant review, and coating conditions central to exterior planning."],
  ["Draper", "Newer custom homes, open interiors, and wind along the south valley reward detailed protection, cleanable finishes, and careful weather timing."],
  ["Murray", "Mid-century neighborhoods and busy commercial corridors create a practical mix of interior refreshes, masonry, siding, and tenant-improvement work."],
  ["Holladay", "Mature trees, detailed homes, and mountain-edge weather make landscape protection, color sampling, and wood preparation especially important."],
  ["Cottonwood Heights", "Sloped lots, canyon weather, and high-value interiors require deliberate access plans and tightly controlled work zones."],
  ["West Jordan", "Growing family neighborhoods benefit from durable interiors, predictable room sequencing, and close evaluation of sun-facing exteriors."],
  ["South Jordan", "Large newer homes and planned communities often pair open-plan interiors with HOA-aware exterior color and finish decisions."],
  ["Millcreek", "Older brick homes, remodeled interiors, and foothill exposure call for surface-specific repair work and careful color transitions."],
  ["Taylorsville", "Ranches and split-level homes commonly combine interior updates with trim, siding, fence, deck, or garage-floor projects."],
  ["West Valley City", "A broad mix of home ages, multifamily properties, and light commercial spaces benefits from flexible, clearly phased scopes."],
  ["Riverton", "Fast-growing neighborhoods and busy households make room access, durable finishes, and exterior adhesion checks practical priorities."],
  ["Herriman", "High-plains wind, intense sun, and newer stucco homes put cleaning, crack review, and realistic application windows on the checklist."],
  ["Midvale", "Compact neighborhoods and commercial centers often need efficient staging, coordinated access, and well-matched repair work."],
  ["Bluffdale", "Open exposure, new construction, and larger properties make dust control, exterior cleaning, and equipment access important planning details."],
  ["South Salt Lake", "Small homes, creative commercial spaces, and active streets reward compact work zones and clearly managed daily closeout."],
  ["Kearns", "Established neighborhoods and strong western sun make siding condition, trim repairs, and washable interior finishes common priorities."],
  ["Magna", "Older homes and open valley exposure call for thorough washing, practical repair plans, and coating systems suited to heat and wind."],
  ["Bountiful", "Benches, mature homes, and varied elevations make exterior access, wood details, and weather windows central to the scope."],
  ["North Salt Lake", "Hillside homes, lake winds, and newer developments require careful masking, access planning, and application-condition checks."],
] as const;

const heritagePlaces = [
  ["Denver", "Brick bungalows, mid-century homes, modern infill, and compact commercial spaces each call for different preparation and access plans."],
  ["Lakewood", "Ranch homes, mature landscaping, and west-side sun make trim, siding, deck, and interior durability common planning topics."],
  ["Arvada", "Olde Town details and broad suburban neighborhoods mix older woodwork, brick, siding, and updated open interiors."],
  ["Westminster", "Homes spanning several building eras often need a close look at previous coatings, caulk joints, and sun-facing elevations."],
  ["Littleton", "Historic-area trim and newer south-metro homes benefit from patient color sampling and surface-specific preparation."],
  ["Centennial", "Busy households and broad two-story exteriors make room sequencing, access, and durable finishes especially useful."],
  ["Aurora", "A wide mix of home ages, siding types, and multifamily properties requires flexible scopes rather than one standard package."],
  ["Golden", "Foothill wind, strong UV exposure, varied elevations, and mountain-style wood details shape exterior coating choices."],
  ["Wheat Ridge", "Mid-century homes and generous garden lots make landscape protection and careful trim preparation part of the plan."],
  ["Englewood", "Compact bungalows, additions, and neighborhood storefronts often need efficient access plans and well-matched repair work."],
  ["Highlands Ranch", "Large family homes and HOA-guided exteriors reward clear color documentation and predictable room-by-room sequencing."],
  ["Parker", "Newer homes, open interiors, wind, and high-plains sun make cleanable finishes and exterior adhesion checks important."],
  ["Castle Rock", "Elevation changes, stucco and masonry details, and fast weather shifts require close attention to access and application conditions."],
  ["Thornton", "Growing neighborhoods and mixed siding systems benefit from careful washing, joint review, and family-friendly scheduling."],
  ["Broomfield", "Wind exposure, planned communities, and work-from-home spaces make timing and controlled work zones a priority."],
  ["Commerce City", "New developments and established industrial-edge properties create varied residential and light commercial coating needs."],
  ["Northglenn", "Mature ranches and split-level homes often pair interior updates with trim, siding, fence, or deck maintenance."],
  ["Lone Tree", "Detailed newer homes and busy schedules benefit from precise protection, sample approvals, and phased room access."],
  ["Morrison", "Foothill exposure, natural wood elements, and sloped lots make weather and access planning central to exterior work."],
  ["Ken Caryl", "Mountain-adjacent sun, open-space guidelines, and mixed masonry and siding details influence product and color decisions."],
] as const;

function makeLocations(tenantId: "summit" | "heritage"): Location[] {
  const isSummit = tenantId === "summit";
  const places = isSummit ? summitPlaces : heritagePlaces;
  const state = isSummit ? "Utah" : "Colorado";
  const stateAbbr = isSummit ? "UT" : "CO";
  const brand = isSummit ? "Summit Painting Co." : "Heritage Paint & Finish";
  const serviceSlugs = SERVICE_CATALOG.map((service) => service.slug);

  return places.map(([city, localDetail], index) => {
    const citySlug = city.toLowerCase().replaceAll(" ", "-");
    const slug = `painters-${citySlug}-${stateAbbr.toLowerCase()}`;
    const nearby = [
      places[(index + places.length - 1) % places.length]![0],
      places[(index + 1) % places.length]![0],
      places[(index + 2) % places.length]![0],
    ];
    const intro = isSummit
      ? `${city} painting scopes deserve a finish plan grounded in the property's actual materials and exposure. ${localDetail}`
      : `A comfortable painting project in ${city} starts with the home, the household, and the surface in front of us. ${localDetail}`;

    return {
      id: `${tenantId}-location-${citySlug}`,
      tenantId,
      kind: "location",
      name: `Painting Services in ${city}, ${stateAbbr}`,
      navLabel: city,
      slug,
      intent: `Interior, exterior, and commercial painting in ${city}, ${state}`,
      intro,
      body: [
        isSummit
          ? `Residential work in ${city} can include interiors, cabinetry, exterior siding, masonry, stucco, decks, and fences after the substrate and access are reviewed.`
          : `${city} homeowners can plan interior rooms, cabinets, siding, stucco, brick, decks, and fences around family schedules and the condition of each surface.`,
        isSummit
          ? `Commercial scopes are organized around access, occupied areas, finish schedules, and site-specific safety requirements.`
          : `For neighborhood businesses and managed properties, the sequence can account for customers, residents, deliveries, and opening hours.`,
      ],
      cta: `Request a painting estimate in ${city}`,
      breadcrumbLabel: `${city} painters`,
      status: "published",
      updatedAt: UPDATED_AT,
      seo: seo(
        `Painters in ${city}, ${stateAbbr} | ${brand}`,
        `Explore interior, exterior, cabinet, and commercial painting services for homes and businesses in ${city}, ${state}.`,
        `Residential & Commercial Painters in ${city}, ${stateAbbr}`,
        `/${slug}`,
      ),
      heroImage: contentImage(
        index === 0
          ? isSummit ? "summit-location" : "heritage-location"
          : isSummit ? "summit-neighborhood" : "heritage-neighborhood",
        `${tenantId}-${citySlug}-hero`,
      ),
      city,
      state,
      stateAbbr,
      localDetail,
      nearby: nearby.map((name) => `painters-${name.toLowerCase().replaceAll(" ", "-")}-${stateAbbr.toLowerCase()}`),
      availableServiceSlugs: serviceSlugs.filter((_, serviceIndex) => serviceIndex !== (index % serviceSlugs.length)).slice(0, 8),
      faq: [
        {
          question: `How is exterior painting scheduled around ${city} weather?`,
          answer: `The schedule is confirmed against the coating manufacturer's temperature, moisture, wind, and cure requirements. Conditions are checked again before application.`,
        },
        {
          question: `Can an estimate cover both interior and exterior work in ${city}?`,
          answer: `Yes. The scopes can be reviewed together and then sequenced by access, weather, household needs, and product requirements.`,
        },
      ],
    };
  });
}

function makeProjects(tenantId: "summit" | "heritage"): Project[] {
  const isSummit = tenantId === "summit";
  const locationSlugs = (isSummit ? summitPlaces : heritagePlaces).slice(0, 6).map(([city]) => {
    const state = isSummit ? "ut" : "co";
    return `painters-${city.toLowerCase().replaceAll(" ", "-")}-${state}`;
  });
  const definitions: ReadonlyArray<readonly [string, string, ContentImageKey, ContentImageKey]> = isSummit
    ? [
        ["Foothill Stucco Color Study", "stucco-painting", "stucco-before", "stucco"],
        ["Open-Plan Interior Finish Study", "interior-painting", "gallery", "interior-finish"],
        ["Cabinet Enamel Sample Project", "cabinet-painting-refinishing", "cabinets-detail", "cabinets"],
        ["Brick and Trim Exterior Study", "brick-painting-staining", "brick", "brick-finish"],
        ["Commercial Entry Refresh Study", "exterior-painting", "commercial", "exterior"],
        ["Weathered Deck Finish Study", "deck-painting-staining", "deck-detail", "deck"],
      ]
    : [
        ["Sunny Kitchen Cabinet Color Study", "cabinet-painting-refinishing", "cabinets-detail", "cabinets"],
        ["Brick Bungalow Room Refresh", "interior-painting", "gallery", "interior-finish"],
        ["Front Porch and Rail Study", "deck-painting-staining", "deck-detail", "deck"],
        ["Family Room Washable Finish Study", "interior-painting", "interior", "interior-finish"],
        ["Neighborhood Shop Interior Study", "interior-painting", "commercial", "paint-detail"],
        ["Backyard Fence Stain Study", "fence-painting-staining", "fence-before", "fence"],
      ];
  return definitions.map(([title, serviceSlug, beforeKey, afterKey], index) => {
    const slug = title.toLowerCase().replaceAll(" ", "-");
    const service = SERVICE_CATALOG.find((item) => item.slug === serviceSlug)!;
    const locationSlug = locationSlugs[index]!;
    const description = isSummit
      ? `Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for a ${service.name.toLowerCase()} project.`
      : `The ${title.toLowerCase()} is a demonstration record for ${service.name.toLowerCase()}, showing how Heritage would explain homeowner priorities, preparation, product choices, and room or exterior reset.`;
    return {
      id: `${tenantId}-project-${index}`,
      tenantId,
      kind: "project",
      name: title,
      navLabel: title,
      slug,
      intent: `${service.name} project evidence`,
      intro: description,
      body: [description, "This record uses subject-matched reference photography and is not a claim of customer work. Replace it with verified first-party project evidence before production."],
      cta: "Discuss a similar scope",
      breadcrumbLabel: title,
      status: "published",
      updatedAt: UPDATED_AT,
      seo: seo(`${title} | ${isSummit ? "Summit Painting Co." : "Heritage Paint & Finish"}`, description, title, `/projects/${slug}`, false),
      locationSlug,
      serviceSlugs: [service.slug],
      category: service.category,
      completedAt: "2026-06-01",
      products: [...service.materials],
      featured: index < 3,
      heroImage: contentImage(afterKey, `${tenantId}-project-${index}-hero`),
      images: [
        contentImage(beforeKey, `${tenantId}-project-${index}-before`, "before"),
        contentImage(afterKey, `${tenantId}-project-${index}-after`, "after"),
      ],
    };
  });
}

function makeTestimonials(tenantId: "summit" | "heritage"): Testimonial[] {
  const cities = (tenantId === "summit" ? summitPlaces : heritagePlaces).slice(0, 5);
  return cities.map(([city], index) => ({
    id: `${tenantId}-testimonial-${index}`,
    tenantId,
    quote: `Sample testimonial slot ${index + 1}: replace this text with a verified customer statement and source permission before publication.`,
    customerName: "Sample customer",
    city,
    verified: false,
  }));
}

function makePosts(tenantId: "summit" | "heritage"): BlogPost[] {
  const isSummit = tenantId === "summit";
  const definitions: ReadonlyArray<readonly [string, string, string]> = isSummit
    ? [
        ["How to Evaluate an Exterior Paint Scope", "A field-oriented checklist for comparing preparation, access, sealants, primers, and finish expectations.", "exterior-painting"],
        ["Choosing Sheen for an Open-Plan Interior", "How light, cleaning, wall condition, and connected rooms affect a practical sheen schedule.", "interior-painting"],
        ["What a Cabinet Finish Sample Should Prove", "A useful sample tests adhesion, texture, color, sheen, and expectations before the full kitchen begins.", "cabinet-painting-refinishing"],
      ]
    : [
        ["Planning Paint Around a Busy Household", "A room-by-room approach to furniture, pets, work calls, drying time, and comfortable access.", "interior-painting"],
        ["Questions to Ask Before Staining a Deck", "Start with wood condition, previous coatings, sun, moisture, color, and realistic maintenance.", "deck-painting-staining"],
        ["Making Cabinet Color Feel at Home", "Use counters, flooring, daylight, hardware, and nearby wall colors to narrow the decision.", "cabinet-painting-refinishing"],
      ];
  return definitions.map(([title, excerpt, serviceSlug], index) => {
    const slug = title.toLowerCase().replaceAll(" ", "-");
    const featuredImage = contentImage(SERVICE_IMAGE_KEYS[serviceSlug]!, `${tenantId}-post-${index}`, "standalone");
    return {
      id: `${tenantId}-post-${index}`,
      tenantId,
      kind: "blog",
      name: title,
      navLabel: title,
      slug,
      intent: `${serviceSlug} homeowner education`,
      intro: excerpt,
      excerpt,
      body: [
        excerpt,
        isSummit
          ? "Start with observable site conditions and ask each contractor to explain how the proposed system responds to them. Product names alone do not describe preparation or execution."
          : "A good plan makes daily life easier during the work. Write down which rooms must stay usable, who needs access, and which decisions need a sample before the first full coat.",
        "This demonstration article must be reviewed and expanded with the painter's first-hand observations, original photos, and verified product details before production publication.",
      ],
      cta: "Bring these questions to an estimate",
      breadcrumbLabel: title,
      status: "published",
      updatedAt: UPDATED_AT,
      seo: seo(`${title} | ${isSummit ? "Summit" : "Heritage"}`, excerpt, title, `/blog/${slug}`, false),
      author: { name: isSummit ? "Summit editorial team" : "Heritage home guide", role: "Demonstration author" },
      publishedAt: "2026-07-01",
      relatedServiceSlug: serviceSlug,
      relatedLocationSlug: tenantId === "summit" ? "painters-salt-lake-city-ut" : "painters-denver-co",
      relatedProjectSlug: makeProjects(tenantId)[index]!.slug,
      featuredImage,
      heroImage: featuredImage,
    };
  });
}

export const TENANTS: Tenant[] = [
  {
    id: "summit",
    slug: "summit",
    name: "Summit Painting Co.",
    legalName: "Summit Painting Co. (demonstration)",
    primaryDomain: "summitpainting.com",
    developmentDomain: "summit.localhost",
    secondaryDomains: ["www.summitpainting.com"],
    domainVerified: false,
    productionReady: false,
    theme: "summit",
    branding: {
      primary: "#183d32",
      secondary: "#dce8e2",
      accent: "#d86745",
      surface: "#f7f8f5",
      ink: "#14201c",
      headingFont: "var(--font-summit-heading)",
      bodyFont: "var(--font-summit-body)",
      radius: "8px",
      buttonStyle: "solid",
      headerStyle: "editorial",
      footerStyle: "dark",
      heroLayout: "architectural",
      galleryLayout: "masonry",
      logoMark: "SP",
    },
    phone: "(801) 555-0142",
    email: "estimates@summitpainting.example",
    address: "Demonstration address, Salt Lake City, UT",
    businessHours: "Monday-Friday, 8:00 AM-5:00 PM",
    serviceArea: "Salt Lake City and Salt Lake County, Utah",
    insuranceInfo: "Insurance status requires tenant verification",
    socialLinks: [],
    reviewLinks: [],
    primaryCta: "Plan your project",
    heroImage: contentImage("summit-home", "summit-home-hero"),
    pages: summitCorePages,
    services: makeServices("summit"),
    locations: makeLocations("summit"),
    projects: makeProjects("summit"),
    testimonials: makeTestimonials("summit"),
    posts: makePosts("summit"),
  },
  {
    id: "heritage",
    slug: "heritage",
    name: "Heritage Paint & Finish",
    legalName: "Heritage Paint & Finish (demonstration)",
    primaryDomain: "heritagepaint.com",
    developmentDomain: "heritage.localhost",
    secondaryDomains: ["www.heritagepaint.com"],
    domainVerified: false,
    productionReady: false,
    theme: "heritage",
    branding: {
      primary: "#285640",
      secondary: "#f7f3ea",
      accent: "#c89b3c",
      surface: "#ffffff",
      ink: "#252b26",
      headingFont: "var(--font-heritage-heading)",
      bodyFont: "var(--font-heritage-body)",
      radius: "8px",
      buttonStyle: "outlined",
      headerStyle: "utility",
      footerStyle: "light",
      heroLayout: "welcoming",
      galleryLayout: "grid",
      logoMark: "HF",
    },
    phone: "(303) 555-0186",
    email: "hello@heritagepaint.example",
    address: "Demonstration address, Lakewood, CO",
    businessHours: "Monday-Saturday, 8:30 AM-5:30 PM",
    serviceArea: "Denver west and south metro, Colorado",
    insuranceInfo: "Insurance status requires tenant verification",
    socialLinks: [],
    reviewLinks: [],
    primaryCta: "Get a friendly estimate",
    heroImage: contentImage("heritage-home", "heritage-home-hero"),
    pages: heritageCorePages,
    services: makeServices("heritage"),
    locations: makeLocations("heritage"),
    projects: makeProjects("heritage"),
    testimonials: makeTestimonials("heritage"),
    posts: makePosts("heritage"),
  },
];
