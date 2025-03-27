/**
 * Constrains a value to be within a specified range.
 *
 * @param value - The value to clamp
 * @param min - The lower boundary of the range
 * @param max - The upper boundary of the range
 * @returns The clamped value within the range [min, max]
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (min > max) {
    throw new Error("Min value cannot be greater than max value");
  }
  return Math.min(Math.max(value, min), max);
};
