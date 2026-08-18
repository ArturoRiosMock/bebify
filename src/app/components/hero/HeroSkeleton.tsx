export const HeroSkeleton = () => (
  <section
    className="relative overflow-hidden w-screen left-1/2 right-1/2 -translate-x-1/2"
    style={{ maxWidth: 1700 }}
    aria-hidden
  >
    <div className="relative aspect-square md:aspect-auto md:h-80 lg:h-96 bg-[#0c3c1f]" />
  </section>
);
