// Plane geometry the ink needs: segment crossings, point-in-loop, loop area and distances.

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Shortest distance from point P to segment AB. */
export function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/** Closest point on segment AB to P, as {x, y}. */
export function closestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1) : 0;
  return { x: ax + dx * t, y: ay + dy * t };
}

/** Where segment AB crosses segment CD, or null. Touching endpoints count as a crossing. */
export function segmentCrossing(ax, ay, bx, by, cx, cy, dx, dy) {
  const rX = bx - ax;
  const rY = by - ay;
  const sX = dx - cx;
  const sY = dy - cy;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((cx - ax) * sY - (cy - ay) * sX) / denom;
  const u = ((cx - ax) * rY - (cy - ay) * rX) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: ax + rX * t, y: ay + rY * t };
}

/** Even-odd rule: is (x, y) inside the closed polygon `poly` ([{x, y}, ...])? */
export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Unsigned area of a polygon (shoelace formula). */
export function polygonArea(poly) {
  let sum = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) sum += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return Math.abs(sum) / 2;
}

/** Average of a polygon's vertices: good enough as a centre for effects. */
export function polygonCenter(poly) {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
}

/** Length of a polyline. */
export function pathLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) len += distance(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  return len;
}
