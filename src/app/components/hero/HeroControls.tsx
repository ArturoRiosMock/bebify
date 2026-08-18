import { ChevronLeft, ChevronRight } from 'lucide-react';

const ARROW_CLASS =
  'absolute top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#212121] p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10';

interface HeroControlsProps {
  count: number;
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

function dotClass(active: boolean) {
  const base = active ? 'w-8 h-3 bg-white' : 'w-3 h-3 bg-white/50 hover:bg-white/75';
  return `transition-all rounded-full ${base}`;
}

function dotLabel(index: number, count: number) {
  return `Ir a la diapositiva ${index + 1} de ${count}`;
}

export function HeroControls({ count, current, onPrev, onNext, onGoTo }: HeroControlsProps) {
  return (
    <>
      <button onClick={onPrev} className={`left-4 ${ARROW_CLASS}`} aria-label="Diapositiva anterior">
        <ChevronLeft className="w-6 h-6" aria-hidden />
      </button>

      <button
        onClick={onNext}
        className={`right-4 ${ARROW_CLASS}`}
        aria-label="Diapositiva siguiente"
      >
        <ChevronRight className="w-6 h-6" aria-hidden />
      </button>

      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30"
        role="tablist"
        aria-label="Selector de diapositiva"
      >
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            onClick={() => onGoTo(index)}
            className={dotClass(index === current)}
            role="tab"
            aria-selected={index === current}
            aria-label={dotLabel(index, count)}
          />
        ))}
      </div>
    </>
  );
}
