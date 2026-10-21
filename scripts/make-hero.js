// Erzeugt das Titelbild (src/assets/img/hero.svg) als geometrisches Netz,
// ähnlich dem Vorbild: Dreiecksflächen in Blau und Türkis, rechts warme Akzente,
// dazu Knoten und Linien. Ein fester Startwert sorgt dafür, dass das Bild
// bei jedem Lauf gleich aussieht. Aufruf: npm run hero
import { writeFileSync } from "node:fs";

let seed = 20261021;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const W = 1600, H = 440, cols = 16, rows = 5;
const cw = W / cols, rh = H / rows;

// Farbverlauf von links (Türkis/Blau) nach rechts (Blau, dann Gelb/Orange)
const kalt = ["#0B6F86", "#0E8DA3", "#1183B0", "#1F4E9C", "#2563C9", "#3B8FE8", "#5FB3E6", "#2A7FB8"];
const warm = ["#F5B81C", "#F2A516", "#F07A1B", "#E8652A", "#F9CE4A"];
const mix = (t) => {
  if (t > 0.74 && rnd() < (t - 0.74) * 2.4) return warm[Math.floor(rnd() * warm.length)];
  return kalt[Math.floor(rnd() * kalt.length)];
};

const pts = [];
for (let r = 0; r <= rows; r++) {
  pts.push([]);
  for (let c = 0; c <= cols; c++) {
    const jx = (c === 0 || c === cols) ? 0 : (rnd() - 0.5) * cw * 0.9;
    const jy = (r === 0 || r === rows) ? 0 : (rnd() - 0.5) * rh * 0.9;
    pts[r].push([c * cw + jx, r * rh + jy]);
  }
}
const tri = (a, b, c, t) => `<polygon points="${a.map(v=>v.toFixed(1))} ${b.map(v=>v.toFixed(1))} ${c.map(v=>v.toFixed(1))}" fill="${mix(t)}" opacity="${(0.82 + rnd()*0.18).toFixed(2)}"/>`;
let polys = "";
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
  const p00 = pts[r][c], p10 = pts[r][c+1], p01 = pts[r+1][c], p11 = pts[r+1][c+1];
  const t = (c + 0.5) / cols;
  if (rnd() < 0.5) { polys += tri(p00, p10, p11, t) + tri(p00, p11, p01, t); }
  else { polys += tri(p00, p10, p01, t) + tri(p10, p11, p01, t); }
}

// Netz aus Knoten und Linien
let netz = "";
const knoten = [];
for (let i = 0; i < 70; i++) knoten.push([rnd() * W, rnd() * H]);
for (let i = 0; i < knoten.length; i++) {
  const [x, y] = knoten[i];
  let n = 0;
  for (let j = i + 1; j < knoten.length && n < 3; j++) {
    const [x2, y2] = knoten[j];
    const d = Math.hypot(x - x2, y - y2);
    if (d < 190) { netz += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; n++; }
  }
  netz += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2 + rnd()*3).toFixed(1)}"/>`;
}

// Schwebende Quadrate wie im Vorbild
let quad = "";
const qfarben = ["#F5B81C", "#F07A1B", "#1F4E9C", "#3B8FE8", "#0E8DA3", "#FFFFFF"];
for (let i = 0; i < 26; i++) {
  const s = 14 + rnd() * 56, x = rnd() * (W - s), y = rnd() * (H - s);
  const f = qfarben[Math.floor(rnd() * qfarben.length)];
  quad += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${f}" opacity="${(0.55 + rnd()*0.4).toFixed(2)}" transform="rotate(${(rnd()*30-15).toFixed(1)} ${(x+s/2).toFixed(1)} ${(y+s/2).toFixed(1)})"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<rect width="${W}" height="${H}" fill="#1F4E9C"/>
<g>${polys}</g>
<g fill="#fff" stroke="#fff" stroke-width="1.2" opacity="0.55">${netz}</g>
<g>${quad}</g>
<rect width="${W}" height="${H}" fill="url(#dunkel)"/>
<defs><radialGradient id="dunkel" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#0b2a55" stop-opacity="0.38"/><stop offset="1" stop-color="#0b2a55" stop-opacity="0.08"/></radialGradient></defs>
</svg>`;
writeFileSync(new URL("../src/assets/img/hero.svg", import.meta.url), svg);
console.log("hero.svg geschrieben");
