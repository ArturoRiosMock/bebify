export const DEFAULT_MAX_QUANTITY = 99;
export const DEFAULT_MIN_QUANTITY = 1;

export const clampQuantity = (
  value: number,
  min = DEFAULT_MIN_QUANTITY,
  max = DEFAULT_MAX_QUANTITY,
): number => Math.min(max, Math.max(min, value));

export const sanitizeQuantityDraft = (value: string): string => value.replace(/\D/g, '');

export const parseQuantityDraft = (
  draft: string,
  fallback = DEFAULT_MIN_QUANTITY,
  min = DEFAULT_MIN_QUANTITY,
  max = DEFAULT_MAX_QUANTITY,
): number => {
  const parsed = parseInt(draft, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return clampQuantity(parsed, min, max);
};
