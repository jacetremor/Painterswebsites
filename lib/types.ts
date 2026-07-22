export type PublishStatus = "draft" | "review" | "scheduled" | "published";
export type PageKind = "core" | "service" | "location" | "project" | "blog";

export type SeoFields = {
  title: string;
  description: string;
  h1: string;
  canonicalPath: string;
  index: boolean;
  follow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
};

export type ContentPage = {
  id: string;
  tenantId: string;
  kind: PageKind;
  name: string;
  slug: string;
  navLabel: string;
  intent: string;
  intro: string;
  body: string[];
  cta: string;
  breadcrumbLabel: string;
  status: PublishStatus;
  updatedAt: string;
  seo: SeoFields;
  heroImage?: ProjectImage;
};

export type Service = ContentPage & {
  kind: "service";
  category: "interior" | "exterior";
  useCases: string[];
  benefits: string[];
  preparation: string[];
  process: string[];
  materials: string[];
  concerns: string[];
  faq: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
};

export type Location = ContentPage & {
  kind: "location";
  city: string;
  state: string;
  stateAbbr: string;
  localDetail: string;
  nearby: string[];
  availableServiceSlugs: string[];
  faq: Array<{ question: string; answer: string }>;
};

export type ProjectImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  stage: "before" | "after" | "standalone";
};

export type Project = ContentPage & {
  kind: "project";
  locationSlug: string;
  serviceSlugs: string[];
  category: "interior" | "exterior";
  completedAt: string;
  products: string[];
  featured: boolean;
  images: ProjectImage[];
};

export type BlogPost = ContentPage & {
  kind: "blog";
  excerpt: string;
  author: { name: string; role: string };
  publishedAt: string;
  relatedServiceSlug?: string;
  relatedLocationSlug?: string;
  relatedProjectSlug?: string;
  featuredImage: ProjectImage;
};

export type Testimonial = {
  id: string;
  tenantId: string;
  quote: string;
  customerName: string;
  city: string;
  sourceUrl?: string;
  verified: boolean;
};

export type Branding = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  ink: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
  buttonStyle: "solid" | "outlined";
  headerStyle: "editorial" | "utility";
  footerStyle: "dark" | "light";
  heroLayout: "architectural" | "welcoming";
  galleryLayout: "masonry" | "grid";
  logoMark: string;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  primaryDomain: string;
  developmentDomain: string;
  secondaryDomains: string[];
  domainVerified: boolean;
  productionReady: boolean;
  theme: "summit" | "heritage";
  branding: Branding;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  foundedYear?: number;
  serviceArea: string;
  licenseInfo?: string;
  insuranceInfo?: string;
  socialLinks: Array<{ label: string; href: string }>;
  reviewLinks: Array<{ label: string; href: string }>;
  primaryCta: string;
  heroImage: ProjectImage;
  pages: ContentPage[];
  services: Service[];
  locations: Location[];
  projects: Project[];
  testimonials: Testimonial[];
  posts: BlogPost[];
};

export type SeoIssue = {
  severity: "critical" | "warning";
  code: string;
  message: string;
  pageId?: string;
};
