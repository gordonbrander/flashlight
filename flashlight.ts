import * as Easing from "./easing.ts";
import { clamp } from "./util.ts";

/**
 * An animation function that takes a frame number and returns a value.
 * Animation functions also have a duration property that indicates the total
 * number of frames of the animation.
 */
export type Animation<T> = ((frame: number) => T) & {
  duration: number;
};

export type Lerp<T> = (progress: number) => T;

/** Convert a frame number to a progress value between 0 and 1 */
export const frameToProgress = (frame: number, duration: number): number =>
  clamp(frame / duration, 0, 1);

/** Convert a progress value between 0 and 1 to a frame number */
export const progressToFrame = (progress: number, duration: number): number =>
  clamp(progress * duration, 0, duration);

/** Convert an elapsed time in milliseconds to a frame number */
export const elapsedToFrame = (elapsedMs: number, fps: number): number =>
  Math.floor(elapsedMs / (1000 / fps));

/** Linearly interpolate between two values using a relative progress value betwen 0 and 1 */
export const lerp = (from: number, to: number, progress: number) =>
  from + Math.max(to - from, 0) * clamp(progress, 0, 1);

/**
 * Create a complex tween using a lerp function that takes a progress
 * value from 0 to 1 and returns a value of type T.
 */
export const tweenWith = <T>(
  lerp: Lerp<T>,
  duration: number,
  easing: Easing.Easing = Easing.linear,
): Animation<T> => {
  const anim = (frame: number) =>
    lerp(easing(frameToProgress(frame, duration)));
  anim.duration = duration;
  return anim;
};

/**
 * Create a tweening function that takes a frame number and returns a number
 * between `from` and `to`.
 */
export const tween = (
  from: number,
  to: number,
  duration: number,
  easing: Easing.Easing = Easing.linear,
): Animation<number> =>
  tweenWith((progress) => lerp(from, to, progress), duration, easing);

/**
 * Delay an animation by a given duration
 * @returns a new animation that delays the original animation
 */
export const delay = <T>(
  anim: Animation<T>,
  duration: number,
): Animation<T> => {
  const delayed = (frame: number) => anim(clamp(frame - duration, 0, duration));
  delayed.duration = duration + anim.duration;
  return delayed;
};

/** Repeat an animation a given number of times (default infinite) */
export const repeat = <T>(
  anim: Animation<T>,
  times: number = Infinity,
): Animation<T> => {
  const xduration = times * anim.duration;
  const repeated = (frame: number) => {
    if (frame >= xduration) return anim(anim.duration);
    return anim(frame % anim.duration);
  };
  repeated.duration = xduration;
  return repeated;
};

/** Sequence two animations */
const sequence = <T>(a: Animation<T>, b: Animation<T>) => {
  const anim = (frame: number) => {
    if (frame <= a.duration) {
      return a(frame);
    }
    return b(frame - a.duration);
  };
  anim.duration = a.duration + b.duration;
  return anim;
};

/**
 * Sequence animations, creating a "track" on a conceptual timeline for a property that changes over time.
 * First animation is played first, then the second animation is played after the first animation is finished, etc.
 * @example
 * const anim = track(
 *   tween(0, 100, 80),
 *   delay(tween(100, 200, 100), 200),
 *   tween(200, 0, 120)
 * );
 */
export const track = <T>(
  first: Animation<T>,
  ...rest: Animation<T>[]
): Animation<T> => rest.reduce(sequence, first);

/**
 * Trigger a script on a keyframe.
 * @example
 * const fx = effect(100, () => console.log('Hello World!'));
 * fx(1); // No-op
 * fx(100); // "Hello World!"
 */
export const effect =
  (keyframe: number, fx: () => void) =>
  (frame: number): void => {
    if (frame === keyframe) {
      fx();
    }
  };
