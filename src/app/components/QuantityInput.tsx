import React, { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  clampQuantity,
  DEFAULT_MAX_QUANTITY,
  DEFAULT_MIN_QUANTITY,
  parseQuantityDraft,
  sanitizeQuantityDraft,
} from '@/app/utils/quantityInput';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  variant?: 'split' | 'grouped';
  stopPropagation?: boolean;
  disabled?: boolean;
  className?: string;
}

export const QuantityInput = ({
  value,
  onChange,
  min = DEFAULT_MIN_QUANTITY,
  max = DEFAULT_MAX_QUANTITY,
  size = 'md',
  variant = 'split',
  stopPropagation = false,
  disabled = false,
  className = '',
}: QuantityInputProps) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const stopEvent = (event: React.SyntheticEvent) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
  };

  const commitDraft = (nextDraft: string) => {
    const nextValue = parseQuantityDraft(nextDraft, min, min, max);
    onChange(nextValue);
    setDraft(String(nextValue));
  };

  const handleDecrement = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(event);
    if (disabled || value <= min) {
      return;
    }

    onChange(value - 1);
  };

  const handleIncrement = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(event);
    if (disabled || value >= max) {
      return;
    }

    onChange(value + 1);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    stopEvent(event);

    const nextDraft = sanitizeQuantityDraft(event.target.value);
    setDraft(nextDraft);

    if (nextDraft !== '') {
      const parsed = parseInt(nextDraft, 10);
      if (!Number.isNaN(parsed)) {
        onChange(clampQuantity(parsed, min, max));
      }
    }
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    stopEvent(event);
    commitDraft(draft);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    stopEvent(event);

    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  const isSm = size === 'sm';
  const buttonClassName = variant === 'grouped'
    ? isSm
      ? 'p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-50'
      : 'p-2 hover:bg-gray-50 transition-colors disabled:opacity-50'
    : isSm
      ? 'w-7 h-7 shrink-0 flex items-center justify-center border border-[#0055a2] text-[#0055a2] rounded disabled:opacity-50'
      : 'w-8 h-8 flex items-center justify-center border border-[#0055a2] text-[#0055a2] rounded hover:bg-[#0055a2] hover:text-white transition-colors disabled:opacity-50';

  const inputClassName = variant === 'grouped'
    ? isSm
      ? 'w-10 text-center border-x border-gray-200 text-sm font-medium focus:outline-none'
      : 'w-14 text-center border-x border-gray-300 font-medium focus:outline-none'
    : isSm
      ? 'w-9 h-7 text-center border border-gray-300 rounded text-[#212121] font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#0055a2]'
      : 'w-12 h-8 text-center border border-gray-300 rounded text-[#212121] font-medium focus:outline-none focus:ring-1 focus:ring-[#0055a2]';

  const containerClassName = variant === 'grouped'
    ? `flex items-center border border-gray-300 rounded-lg overflow-hidden ${className}`
    : `flex items-center gap-1.5 ${isSm ? '' : 'gap-2'} ${className}`;

  const iconClassName = isSm ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Disminuir cantidad"
        className={buttonClassName}
      >
        <Minus className={iconClassName} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        onClick={stopEvent}
        disabled={disabled}
        aria-label="Cantidad"
        className={inputClassName}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Aumentar cantidad"
        className={buttonClassName}
      >
        <Plus className={iconClassName} />
      </button>
    </div>
  );
};
