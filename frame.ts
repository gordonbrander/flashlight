import { elapsedToFrame } from "./flashlight.ts";
export type Job = () => void;

const jobs: Job[] = [];
let isFrameScheduled = false;

const transactFrame = () => {
  while (jobs.length > 0) {
    const job = jobs.shift()!;
    job();
  }
  isFrameScheduled = false;
};

/**
 * Schedules callback to be executed with the next frame.
 * Unlike requestAnimationFrame, this function does not schedule a subsequent frame
 * if called in the current frame. Instead, it executes the callback with the currently
 * executing frame.
 */
export const withFrame = (job: Job) => {
  jobs.push(job);
  if (!isFrameScheduled) {
    isFrameScheduled = true;
    requestAnimationFrame(transactFrame);
  }
};

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
    const frame = elapsedToFrame(now - start, fps);
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
