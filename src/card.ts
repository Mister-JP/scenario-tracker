/*********************************************************************
 *  Builds one draggable / resizable card and registers its
 *  connector dots.
 *********************************************************************/

import { store, Pos } from "./state.js";
import {
  recalcAllLines,   // recalculates arrow positions on every move/resize
  registerEndPoints // lets connectors.ts know about this card's dots
} from "./connectors.js";

/* "Full screen" size of the real scenario page.  
 * We scale the iframe so it fits whatever width the user drags to. */
const BASE_W = 1280;
const BASE_H = 720;

/* z-index counter (every time you grab a card we ++ and bring it front) */
let z = 1;

/* Helper: distance from top where cards are allowed to appear */
function headerOffset() {
  const h = document.querySelector("header") as HTMLElement | null;
  return (h ? h.offsetHeight : 48) + 8;
}

/* ------------------------------------------------------------------ */
/*           createCard() – called for every scenario number          */
/* ------------------------------------------------------------------ */
export function createCard(n: number, pos: Pos) {
  /* ---------- outer shell ---------- */
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = String(n);               // useful for debugging
  card.style.left = pos.x + "px";
  card.style.top  = pos.y + "px";
  card.style.zIndex = String(z++);

  /* ---------- drag handle ---------- */
  const handle = document.createElement("div");
  handle.className = "handle";
  card.appendChild(handle);

  /* ---------- title bar ---------- */
  const h2 = document.createElement("h2");
  h2.textContent = `Scenario ${n}`;
  card.appendChild(h2);

  /* ---------- scenario preview (iframe) ---------- */
  const frame = document.createElement("iframe");
  card.appendChild(frame);

  /* ---------- connector dots (mid-edge and corners) ---------- */
  // Updated to include corner dots
  type DotDef = [string, string, number];  // [left%, top%, sideIndex]

  const defs: DotDef[] = [
    // Edge midpoints (original dots)
    ["50%", "0%", 0],   // top
    ["100%", "50%", 1], // right
    ["50%", "100%", 2], // bottom
    ["0%", "50%", 3],   // left
    
    // Corner dots (new)
    ["0%", "0%", 4],    // top-left
    ["100%", "0%", 5],  // top-right
    ["100%", "100%", 6],// bottom-right
    ["0%", "100%", 7]   // bottom-left
  ];

  const dots: { el: HTMLDivElement }[] = [];

  defs.forEach(([lx, ly, sideIndex]) => {
    const d = document.createElement("div");
    d.className = "dot";
    d.style.left = lx;
    d.style.top  = ly;
    // Add data-side attribute for later identifying which side dots are on
    d.dataset.side = String(sideIndex);
    card.appendChild(d);
    dots.push({ el: d });
  });

  /* ---------- keep iframe scaled to card width ---------- */
  function rescale() {
    const scale = card.clientWidth / BASE_W;
    frame.style.transform = `scale(${scale})`;
    frame.style.width  = BASE_W + "px";
    frame.style.height = BASE_H + "px";
    recalcAllLines();        // because iframe size affects dot position
  }

  frame.src = `${store.host}?scenario=${n}`;
  rescale();
  new ResizeObserver(rescale).observe(card);

  /* ---------- drag behaviour ---------- */
  let drag = false;
  let off: Pos = { x: 0, y: 0 };   // pointer offset from card's top-left

  handle.addEventListener("pointerdown", e => {
    drag = true;
    off = { x: e.clientX - card.offsetLeft,
            y: e.clientY - card.offsetTop };
    handle.setPointerCapture(e.pointerId);
    card.style.zIndex = String(z++);  // bring to front
  });

  handle.addEventListener("pointermove", e => {
    if (!drag) return;

    let x = e.clientX - off.x;
    let y = e.clientY - off.y;
    if (y < headerOffset()) y = headerOffset();  // clamp under header

    card.style.left = x + "px";
    card.style.top  = y + "px";
    recalcAllLines();                            // move arrows
  });

  handle.addEventListener("pointerup", () => (drag = false));

  /* ---------- mount in DOM & register with global store ---------- */
  document.body.appendChild(card);
  store.cards.set(n, card);

  /* tell connectors.ts about our dots so arrows can attach */
  registerEndPoints(card, dots);
}