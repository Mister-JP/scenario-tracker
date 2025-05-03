/*********************************************************************
 *  Handles default grid layout, "Reset" button, plus saving and
 *  applying custom layouts via JSON.
 *********************************************************************/

import { store, SCENARIOS }   from "./state.js";
import { createCard }        from "./card.js";
import { recalcAllLines, 
         getLines, 
         clearAllLines, 
         createLineFromSaved } from "./connectors.js";

/* Card size for the tidy grid.  Edit to taste. */
const CARD_W = 350;
const CARD_H = 250;
const GAP    = 24;   // horizontal and vertical gap
const COLS   = 3;    // number of columns in the grid

/* Helper again: top offset so cards never overlap the header */
function headerOffset() {
  const h = document.querySelector("header") as HTMLElement | null;
  return (h ? h.offsetHeight : 48) + 8;
}

/* ------------------------------------------------------------------ */
/*                Public functions used by header.ts                  */
/* ------------------------------------------------------------------ */

/** First-run placement called by main.ts */
export function gridInit() {
  const top = headerOffset();

  SCENARIOS.forEach((n, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    createCard(n, {
      x: col * (CARD_W + GAP),
      y: top + row * (CARD_H + GAP)
    });
  });
}

/** "Reset" button → snap everything back into tidy grid */
export function resetGrid() {
  const top = headerOffset();

  [...store.cards.entries()].forEach(([_, el], i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    el.style.left   = col * (CARD_W + GAP) + "px";
    el.style.top    = top + row * (CARD_H + GAP) + "px";
    el.style.width  = CARD_W + "px";
    el.style.height = CARD_H + "px";
  });
  
  // Clear all connections when resetting grid
  clearAllLines();
  recalcAllLines(); 
}

/* ------------- Save / load helpers ------------- */

/** Produce pretty-printed JSON so the user can download it */
export function snapshot() {
  // Get card specifications
  const cardSpecs = [...store.cards.entries()].map(([n, el]) => {
    const r = el.getBoundingClientRect();
    return {
      n,
      x: r.left,
      y: r.top,
      w: r.width,
      h: r.height
    };
  });
  
  // Get arrow connection specifications
  const arrowSpecs = getLines();
  
  // Return combined JSON with both cards and arrows
  return JSON.stringify({
    cards: cardSpecs,
    arrows: arrowSpecs
  }, null, 2);
}

/** Apply JSON back onto existing cards */
export function applyLayout(json: string) {
  // Parse the JSON layout
  const layout = JSON.parse(json);
  const top = headerOffset();

  // Apply card positions and sizes
  if (layout.cards) {
    layout.cards.forEach(
      (cfg: { n: number; x: number; y: number; w: number; h: number }) => {
        const el = store.cards.get(cfg.n);
        if (!el) return;                     // unknown scenario number
        el.style.left   = cfg.x + "px";
        el.style.top    = Math.max(cfg.y, top) + "px";
        el.style.width  = cfg.w + "px";
        el.style.height = cfg.h + "px";
      }
    );
  }
  
  // Clear existing connections before adding new ones
  clearAllLines();
  
  // Apply arrow connections
  if (layout.arrows) {
    layout.arrows.forEach(
      (arrow: { fromCard: number; fromSide: number; toCard: number; toSide: number }) => {
        createLineFromSaved(
          arrow.fromCard,
          arrow.fromSide,
          arrow.toCard,
          arrow.toSide
        );
      }
    );
  }

  recalcAllLines();
}