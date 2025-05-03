"use strict";
/* viewer/src/index.ts */
const SCENARIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const host = "http://localhost:8080";
const CARD_W = 350; // default card width
const CARD_H = 250;
const GAP = 24; // gap between cards
/**
 *  Helper: create one draggable, resizable card
 */
function createCard(n, startPos) {
    // ---------- shell ----------
    const card = document.createElement("div");
    card.className = "card";
    card.style.left = `${startPos.x}px`;
    card.style.top = `${startPos.y}px`;
    // ---------- drag handle ----------
    const handle = document.createElement("div");
    handle.className = "handle";
    card.appendChild(handle);
    // ---------- title ----------
    const title = document.createElement("h2");
    title.textContent = `Scenario ${n}`;
    card.appendChild(title);
    // ---------- iframe ----------
    const frame = document.createElement("iframe");
    card.appendChild(frame);
    // initial load & every resize → scale iframe
    const BASE_W = 1280; // treat this as “100 % desktop width”
    const BASE_H = 720; //   and this as “100 % height”
    function rescale() {
        const w = card.clientWidth;
        const scale = w / BASE_W;
        frame.style.transform = `scale(${scale})`;
        frame.style.width = BASE_W + "px";
        frame.style.height = BASE_H + "px";
    }
    // first load
    frame.src = `${host}?scenario=${n}`;
    rescale();
    // auto-resize observer
    new ResizeObserver(rescale).observe(card);
    // ---------- drag logic ----------
    let drag = false, offset = { x: 0, y: 0 };
    handle.addEventListener("pointerdown", e => {
        drag = true;
        card.style.transition = "none";
        offset = { x: e.clientX - card.offsetLeft,
            y: e.clientY - card.offsetTop };
        handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", e => {
        if (!drag)
            return;
        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;
        card.style.left = x + "px";
        card.style.top = y + "px";
    });
    handle.addEventListener("pointerup", () => {
        drag = false;
    });
    document.body.appendChild(card);
}
/* ----------------- Create all cards in a loose grid ----------------- */
SCENARIOS.forEach((n, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    createCard(n, { x: col * (CARD_W + GAP),
        y: row * (CARD_H + GAP) });
});
