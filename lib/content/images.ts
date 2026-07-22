import type { ProjectImage } from "@/lib/types";

type ImageAsset = {
  src: string;
  alt: string;
  caption: string;
};

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1800`;

export const CONTENT_IMAGES = {
  "summit-home": {
    src: pexels(5493655),
    alt: "Professional painter applying a clean coat to an interior wall",
    caption: "Interior wall painting with controlled roller application.",
  },
  "heritage-home": {
    src: pexels(7218006),
    alt: "Painter refreshing a bright residential room with a roller",
    caption: "A residential room refresh in progress.",
  },
  "summit-location": {
    src: pexels(30255750),
    alt: "Salt Lake City skyline beneath the snow-capped Wasatch Mountains",
    caption: "Salt Lake City and the Wasatch Front.",
  },
  "summit-neighborhood": {
    src: pexels(8504300),
    alt: "Painted Utah suburban home with siding, trim, and landscaped frontage",
    caption: "A Utah home exterior representative of Wasatch Front neighborhoods.",
  },
  "heritage-location": {
    src: pexels(33258090),
    alt: "Downtown Denver skyline framed by trees and open sky",
    caption: "Denver, Colorado and its surrounding metro area.",
  },
  "heritage-neighborhood": {
    src: pexels(16033009),
    alt: "Colorful traditional home exterior with painted trim and porch details",
    caption: "Residential exterior details representative of established Denver neighborhoods.",
  },
  about: {
    src: pexels(7149336),
    alt: "Painter carefully rolling a fresh coat across an interior wall",
    caption: "Careful application is one part of a complete painting process.",
  },
  contact: {
    src: pexels(5583061),
    alt: "Professional paint rollers and finishing tools arranged for a project",
    caption: "Painting tools ready for a clearly scoped project.",
  },
  gallery: {
    src: pexels(3615725),
    alt: "Protected room prepared with painting and renovation materials",
    caption: "A room prepared for repair, protection, and finish work.",
  },
  residential: {
    src: pexels(5691611),
    alt: "Paint roller applying a smooth fresh coat inside a home",
    caption: "Residential wall painting in progress.",
  },
  commercial: {
    src: pexels(10346959),
    alt: "Bright commercial office interior undergoing a planned renovation",
    caption: "A commercial interior organized for phased renovation work.",
  },
  cabinets: {
    src: pexels(7601078),
    alt: "Bright renovated kitchen with evenly finished white cabinets",
    caption: "A clean cabinet finish in a modern residential kitchen.",
  },
  "cabinets-detail": {
    src: pexels(6636303),
    alt: "Detailed view of smooth white kitchen cabinetry and marble surfaces",
    caption: "Smooth cabinet faces and consistent finish details.",
  },
  epoxy: {
    src: pexels(36230779),
    alt: "Glossy seamless epoxy floor in a clean commercial facility",
    caption: "A reflective epoxy floor coating in a high-use interior.",
  },
  interior: {
    src: pexels(13857726),
    alt: "Paint-covered hand guiding a roller across an interior wall",
    caption: "Close-up detail of an interior wall coating in progress.",
  },
  "interior-finish": {
    src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1800&q=84",
    alt: "Finished living room with coordinated wall color, trim, and natural light",
    caption: "A finished living space with a cohesive interior color palette.",
  },
  wallpaper: {
    src: pexels(3615725),
    alt: "Interior room prepared for wallcovering removal and surface repair",
    caption: "Wall preparation and repair before a new finish is applied.",
  },
  brick: {
    src: pexels(1708852),
    alt: "Painted brick wall showing masonry texture and coating wear",
    caption: "Painted brick texture that requires masonry-specific preparation.",
  },
  "brick-finish": {
    src: pexels(16076910),
    alt: "Traditional brick home exterior with painted architectural details",
    caption: "Brick and painted trim working together on a residential exterior.",
  },
  concrete: {
    src: pexels(9781827),
    alt: "Close view of a concrete surface showing texture, cracks, and variation",
    caption: "Concrete condition must be evaluated before stain or sealer application.",
  },
  deck: {
    src: pexels(3186683),
    alt: "Craftsperson brushing a protective finish onto a wood surface",
    caption: "Wood finish being applied carefully with the grain.",
  },
  "deck-detail": {
    src: pexels(5318075),
    alt: "Paintbrush resting on outdoor wood ready for maintenance",
    caption: "Outdoor wood prepared for stain or protective finish.",
  },
  exterior: {
    src: pexels(3771265),
    alt: "Sunlit stucco home exterior with painted trim and garden landscaping",
    caption: "A painted home exterior in strong daylight.",
  },
  fence: {
    src: pexels(31583249),
    alt: "Hand applying a protective coating to an outdoor wooden fence",
    caption: "Fence coating applied directly to prepared wood.",
  },
  "fence-before": {
    src: pexels(15869198),
    alt: "Weathered wooden fence with peeling paint and exposed grain",
    caption: "A weathered fence surface before repair and recoating.",
  },
  siding: {
    src: pexels(19747776),
    alt: "White painted siding and trim on a residential home exterior",
    caption: "Painted siding and trim exposed to outdoor conditions.",
  },
  stucco: {
    src: pexels(3771265),
    alt: "Residential stucco facade with painted trim in direct sunlight",
    caption: "A stucco exterior where texture, cracks, and exposure shape the coating plan.",
  },
  "stucco-before": {
    src: pexels(36349007),
    alt: "Weathered plaster home exterior with visible cracks and surface variation",
    caption: "A weathered plaster surface requiring repair before coating.",
  },
  "paint-detail": {
    src: pexels(30754633),
    alt: "Close-up of a paintbrush cutting a clean line on an interior wall",
    caption: "Detail brushwork during a wall finish application.",
  },
} as const satisfies Record<string, ImageAsset>;

export type ContentImageKey = keyof typeof CONTENT_IMAGES;

export const SERVICE_IMAGE_KEYS: Record<string, ContentImageKey> = {
  "cabinet-painting-refinishing": "cabinets",
  "epoxy-flooring": "epoxy",
  "interior-painting": "interior",
  "wallpaper-removal": "wallpaper",
  "brick-painting-staining": "brick",
  "concrete-staining": "concrete",
  "deck-painting-staining": "deck",
  "exterior-painting": "exterior",
  "fence-painting-staining": "fence",
  "home-siding-painting": "siding",
  "stucco-painting": "stucco",
};

export function contentImage(key: ContentImageKey, id: string, stage: ProjectImage["stage"] = "standalone"): ProjectImage {
  const asset = CONTENT_IMAGES[key];
  return { id, ...asset, width: 1800, height: 1200, stage };
}
