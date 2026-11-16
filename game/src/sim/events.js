// The run's outbox: the simulation posts what happened (hits, loops, kills, banners) and the
// effects, the sound and the HUD read the list after each step.

export function emit(run, type, data = {}) {
  run.events.push({ type, ...data });
}

/** Show a floating text (score, "SHELL CRACKED!") at a point of the page. */
export function popup(run, x, y, text, color, size = 20) {
  run.events.push({ type: 'popup', x, y, text, color, size });
}

/** Big centred announcement ("VERSE II", "A GROTESQUE APPROACHES"). */
export function banner(run, title, subtitle = '', seconds = 2.4) {
  run.banner = { title, subtitle, time: seconds, total: seconds };
  run.events.push({ type: 'banner', title });
}
