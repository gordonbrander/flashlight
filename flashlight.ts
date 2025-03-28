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

/**
 * A tween is a function that takes a progress value from 0 to 1 and returns a value for that progress.
 * Tweens are relative. They don't think about frames or timing, so they can be rescaled.
 * To use a tween for an animatino of a specific duration, use `anim()`.
 */
export type Tween<T> = (progress: number) => T;

/** Convert a frame number to a progress value between 0 and 1 */
export const frameToProgress = (frame: number, duration: number): number =>
  clamp(frame / duration, 0, 1);

/** Convert a progress value between 0 and 1 to a frame number */
export const progressToFrame = (progress: number, duration: number): number =>
  clamp(progress * duration, 0, duration);

/** Convert an elapsed time in milliseconds to a frame number */
export const elapsedToFrame = (elapsedMs: number, fps: number = 60): number =>
  Math.floor(elapsedMs / (1000 / fps));

/** Linearly interpolate between two values using a relative progress value betwen 0 and 1 */
export const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * clamp(progress, 0, 1);

/**
 * Apply an easing to a tween, returing a new tween.
 */
export const ease =
  <T>(tween: Tween<T>, easing: Easing.Easing = Easing.linear): Tween<T> =>
  (progress: number) =>
    tween(easing(progress));

/**
 * Create an animation for a number value between `from` and `to`,
 * applying an optional easing function.
 */
export const tween =
  (
    from: number,
    to: number,
    easing: Easing.Easing = Easing.linear,
  ): Tween<number> =>
  (progress: number) =>
    lerp(from, to, easing(progress));

/**
 * Create an animation that returns a value for a given frame.
 *
 * @example
 * const anim = anim(tween(0, 100), 1000);
 * anim(0); // 0
 * anim(500); // 50
 * anim(1000); // 100
 *
 * @argument tween: Tween<T> - The tween to animate.
 * @argument duration: number - The duration of the animation in milliseconds.
 * @returns an animation function that takes a frame number and returns a value.
 */
export const anim = <T>(tween: Tween<T>, duration: number): Animation<T> => {
  const anim = (frame: number) => tween(frameToProgress(frame, duration));
  anim.duration = duration;
  return anim;
};

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
