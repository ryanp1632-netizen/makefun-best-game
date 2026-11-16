// The pause card: resume, restart, back to the title, and a reminder of the controls.
import { PALETTE, VIEW } from '../config.js';
import { button, keyCap, panel, text } from './widgets.js';

export function drawPause(ctx, ui, muted) {
  ctx.fillStyle = 'rgba(40, 25, 10, 0.5)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const cx = VIEW.w / 2;
  panel(ctx, cx - 280, 170, 560, 460, { radius: 18 });
  text(ctx, 'PAUSED', cx, 236, { size: 56, color: PALETTE.vermilion, align: 'center', baseline: 'middle' });
  button(ctx, ui, 'resume', cx - 200, 284, 400, 64, 'RESUME', { primary: true, size: 30 });
  button(ctx, ui, 'restart', cx - 200, 362, 195, 56, 'RESTART', { size: 24 });
  button(ctx, ui, 'menu', cx + 5, 362, 195, 56, 'TITLE PAGE', { size: 24 });
  button(ctx, ui, 'mute', cx - 200, 432, 400, 48, muted ? 'SOUND: OFF (M)' : 'SOUND: ON (M)', { size: 21 });
  const rows = [
    ['ESC', 'resume'],
    ['R', 'restart the run'],
    ['WASD', 'move    MOUSE  draw    SPACE  seal    SHIFT  hop'],
  ];
  rows.forEach(([k, what], i) => {
    const w = keyCap(ctx, k, cx - 230, 530 + i * 32, 15);
    text(ctx, what, cx - 230 + w + 10, 530 + i * 32, { size: 17, weight: 'normal' });
  });
}
