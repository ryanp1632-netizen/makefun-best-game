// Keyboard and mouse, read as a snapshot each frame. Mouse positions are converted to the
// game's logical 1280x800 page coordinates, whatever size the canvas is drawn at.
import { VIEW } from './config.js';

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: VIEW.w / 2, y: VIEW.h / 2, down: false, right: false, clicked: false, rightClicked: false, trail: [] },
    gesture: false,
  };

  const toPage = (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * VIEW.w;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * VIEW.h;
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!input.keys.has(key)) input.pressed.add(key);
    input.keys.add(key);
    input.gesture = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    input.keys.delete(key);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouse.down = false;
    input.mouse.right = false;
  });
  // Every position the pointer passes while held is kept, so a fast stroke keeps its shape at any frame rate.
  canvas.addEventListener('pointermove', (event) => {
    const samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    for (const sample of samples.length ? samples : [event]) {
      toPage(sample);
      if (input.mouse.down && input.mouse.trail.length < 400) input.mouse.trail.push({ x: input.mouse.x, y: input.mouse.y });
    }
  });
  canvas.addEventListener('pointerdown', (event) => {
    toPage(event);
    input.gesture = true;
    if (event.button === 2) {
      input.mouse.right = true;
      input.mouse.rightClicked = true;
    } else {
      input.mouse.trail.length = 0;
      input.mouse.down = true;
      input.mouse.clicked = true;
    }
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointerup', (event) => {
    toPage(event);
    if (event.button === 2) input.mouse.right = false;
    else input.mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  return input;
}

/** Was this key pressed since the last frame? (any of several names) */
export function wasPressed(input, ...keys) {
  return keys.some((key) => input.pressed.has(key));
}

export function isHeld(input, ...keys) {
  return keys.some((key) => input.keys.has(key));
}

/** Forget this frame's one-shot presses and clicks. */
export function endFrame(input) {
  input.pressed.clear();
  input.mouse.clicked = false;
  input.mouse.rightClicked = false;
}

/** Take (and forget) the pointer positions gathered since the last call. */
export function takeTrail(input) {
  return input.mouse.trail.splice(0);
}

/** The WASD / arrow-key direction as a unit vector (or zero). */
export function moveAxis(input) {
  let x = 0;
  let y = 0;
  if (isHeld(input, 'a', 'ArrowLeft')) x -= 1;
  if (isHeld(input, 'd', 'ArrowRight')) x += 1;
  if (isHeld(input, 'w', 'ArrowUp')) y -= 1;
  if (isHeld(input, 's', 'ArrowDown')) y += 1;
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}
