import { elapsedToFrame, type Animation } from "./flashlight.ts";

/** Create a draw loop */
export const draw = (callback: (frame: number) => void, fps: number = 60) => {
  const start = performance.now();
  let isPlaying = false;

  /** Transact the draw loop */
  const draw = () => {
    if (!isPlaying) return;
    const now = performance.now();
    // Calculate current frame using elapsed time.
    // Note this is not the same as the frame number, but is rather an adjusted
    // "virtual frame" that accounts for the time elapsed since the last frame.
    // This accepts the tradeoff of choppy animations with accurate wall times
    // instead of "slowing down" animations when frames are slow.
    const frame = elapsedToFrame(start, now, fps);
    callback(frame);
    requestAnimationFrame(draw);
  };

  /** Start the draw loop */
  const play = () => {
    isPlaying = true;
    requestAnimationFrame(draw);
  };

  /** Pause the draw loop */
  const pause = () => {
    isPlaying = false;
  };

  return { play, pause };
};

/** Play an animation, calling a callback with the value for the current frame */
export const play = <T>(
  animation: Animation<T>,
  callback: (value: T) => void,
  fps: number = 60,
) => {
  const start = performance.now();

  /** Transact the draw loop */
  const draw = () => {
    const now = performance.now();
    const elapsed = now - start;
    if (elapsed > animation.duration) return;
    // Calculate current frame using elapsed time.
    // Note this is not the same as the frame number, but is rather an adjusted
    // "virtual frame" that accounts for the time elapsed since the last frame.
    // This accepts the tradeoff of choppy animations with accurate wall times
    // instead of "slowing down" animations when frames are slow.
    const frame = elapsedToFrame(elapsed, fps);
    callback(animation(frame));
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
};
