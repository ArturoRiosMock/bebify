export interface HeroSlide {
  imageMobile: string;
  imageDesktop: string;
  title: string;
  subtitle: string;
  badge: string;
  buttonText: string;
  /** Destino del CTA. Vacío = scroll a productos (comportamiento legacy). */
  buttonHref?: string;
  /** Si es true, solo muestra la imagen sin overlay de texto */
  imageOnly?: boolean;
}

export interface HeroContent {
  slides: HeroSlide[];
}

export interface RegisterBannerContent {
  imageMobile: string;
  imageDesktop: string;
  title: string;
  description: string;
  buttonText: string;
}

export interface AboutFeature {
  title: string;
  description: string;
}

export interface AboutContent {
  image: string;
  imageAlt: string;
  badge: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  statValue: string;
  statLabel: string;
  features: AboutFeature[];
  quote: string;
}

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface CarouselsContent {
  featuredTitle: string;
  newArrivalsTitle: string;
}

export interface HomeContent {
  hero: HeroContent;
  registerBanner: RegisterBannerContent;
  about: AboutContent;
  benefits: BenefitItem[];
  carousels: CarouselsContent;
}
