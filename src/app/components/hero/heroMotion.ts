export const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 1000 : -1000, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -1000 : 1000, opacity: 0 }),
};

export const SLIDE_TRANSITION = {
  x: { type: 'tween', duration: 0.8, ease: 'easeInOut' },
  opacity: { duration: 0.6 },
} as const;
