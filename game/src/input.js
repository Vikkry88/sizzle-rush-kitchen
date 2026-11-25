// Keyboard and pointer input. Held keys give a movement direction; one-shot
// presses (use, pause, restart, confirm) are queued as bit flags and taken
// once by the loop, so a press between two frames is never lost and never
// counted twice.

export const ACTION_USE = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_CONFIRM = 8;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const USE = new Set(['KeyE', 'Space']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const CONFIRM = new Set(['Enter']);

export function createInput() {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (USE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_USE;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
  });

  return {
    /** The held movement direction as { x, z }, each -1, 0 or 1, normalised. */
    move() {
      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const z = (down ? 1 : 0) - (up ? 1 : 0);
      if (x === 0 && z === 0) return { x: 0, z: 0 };
      const length = Math.hypot(x, z);
      return { x: x / length, z: z / length };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
