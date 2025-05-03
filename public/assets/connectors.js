/*********************************************************************
 *  All logic for drawing, storing, and updating the connector arrows
 *  between cards.
 *********************************************************************/
import { showArrowDialog } from "./dialog.js";
/* ---------- In-memory stores ------------------------------------- */
const endpoints = []; // every dot on every card
const lines = []; // every arrow currently on screen
let lineCounter = 0; // counter for generating unique line IDs
/* ---------- SVG overlay (lives once, spans whole viewport) ------- */
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.style.cssText = `
  position:fixed;         /* never scrolls, always on top */
  left:0; top:0;
  width:100vw; height:100vh;
  pointer-events:none;    /* clicks pass through to cards */
  z-index:9999;           /* above everything else       */`;
document.body.appendChild(svg);
/* Arrow-head marker so every <line> ends with a small triangle */
svg.innerHTML = `
<defs>
  <marker id="arrow-head" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 Z" fill="#444"/>
  </marker>
</defs>`;
/* Utility: create a styled SVG line */
function makeLine() {
    const l = document.createElementNS(svg.namespaceURI, "line");
    l.setAttribute("stroke", "#444");
    l.setAttribute("stroke-width", "2");
    l.setAttribute("marker-end", "url(#arrow-head)");
    return l;
}
/* Utility: pixel-centre of a dot */
function center(ep) {
    const r = ep.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
/* ------------- Public helper: recompute every arrow -------------- */
export function recalcAllLines() {
    lines.forEach(({ from, to, svg }) => {
        const a = center(from);
        const b = center(to);
        svg.setAttribute("x1", String(a.x));
        svg.setAttribute("y1", String(a.y));
        svg.setAttribute("x2", String(b.x));
        svg.setAttribute("y2", String(b.y));
    });
}
/* ------------------------------------------------------------------ */
/*          Register dots + handle drag-to-connect behaviour          */
/* ------------------------------------------------------------------ */
/**
 * Called from card.ts once per card.
 * Supplies the edge dots that belong to that card.
 */
export function registerEndPoints(card, dots) {
    dots.forEach(d => {
        const ep = { card, el: d.el };
        endpoints.push(ep);
        /* Click-and-drag starts here */
        d.el.addEventListener("pointerdown", e => {
            e.stopPropagation(); // don't start card-drag
            startDraw(ep, e.clientX, e.clientY);
        });
    });
}
/* ------------------- Drawing state -------------------------------- */
let drawing = null;
const SNAP = 24; // px radius inside which we auto-attach
function startDraw(from, x, y) {
    /* 1. create a temporary SVG <line> that follows the cursor */
    const line = makeLine();
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(y));
    svg.appendChild(line);
    drawing = { from, line };
    /* --- Pointer move updates the far end of that line --- */
    const move = (e) => {
        if (!drawing)
            return;
        drawing.line.setAttribute("x2", String(e.clientX));
        drawing.line.setAttribute("y2", String(e.clientY));
    };
    /* --- Pointer up: try to snap to nearest other dot --- */
    const up = (e) => {
        if (!drawing)
            return;
        const target = nearestEndpoint(e.clientX, e.clientY, drawing.from);
        if (target) {
            finishDraw(drawing.from, target, drawing.line);
        }
        else {
            drawing.line.remove(); // drag cancelled → delete temp line
        }
        drawing = null;
        window.removeEventListener("pointermove", move);
    };
    /* Listen on entire window so drag keeps working outside SVG */
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
}
/* Locate nearest eligible dot within SNAP radius */
function nearestEndpoint(x, y, skip) {
    let best = null;
    let bestD = SNAP;
    endpoints.forEach(ep => {
        if (ep.card === skip.card)
            return; // can't connect to self
        const c = center(ep);
        const d = Math.hypot(c.x - x, c.y - y);
        if (d < bestD) {
            bestD = d;
            best = ep;
        }
    });
    return best;
}
/* Promote temp line → permanent connection with double-click handling */
function finishDraw(from, to, line) {
    // Generate a unique ID for this line
    const id = `line-${++lineCounter}`;
    line.setAttribute("data-id", id);
    // Make line clickable
    line.style.pointerEvents = "auto";
    // Add double-click handler
    line.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        showArrowDialog(id);
    });
    // Store the line
    lines.push({ id, from, to, svg: line });
    // Mark dots as occupied and add additional connection points
    markDotAsOccupied(from.el);
    markDotAsOccupied(to.el);
    // Add additional connection points
    addAdjacentDots(from.card, from.el);
    addAdjacentDots(to.card, to.el);
    recalcAllLines(); // snap ends to exact centres
}
/* Mark a dot as occupied */
function markDotAsOccupied(dot) {
    dot.dataset.occupied = "true";
    // Visually distinguish occupied dots (optional)
    dot.style.opacity = "0.7"; // Make occupied dots slightly more visible
}
/* Check if a dot is occupied */
function isDotOccupied(dot) {
    return dot.dataset.occupied === "true";
}
/* Create dots adjacent to occupied dots */
function addAdjacentDots(card, occupiedDot) {
    const side = parseInt(occupiedDot.dataset.side || "0", 10);
    // Get the position of the occupied dot
    const left = occupiedDot.style.left;
    const top = occupiedDot.style.top;
    // We'll add dots between existing dots
    createIntermediateDots(card, side);
}
/* Create dots in between existing dots */
function createIntermediateDots(card, side) {
    // Get all dots on this side
    const dotsOnSide = Array.from(card.querySelectorAll(`.dot[data-side="${side}"]`));
    // For edge sides (0, 1, 2, 3), create intermediate dots along that edge
    if (side <= 3) {
        createEdgeIntermediateDots(card, side, dotsOnSide);
    }
    // For corner dots, we don't create intermediates directly
}
/* Create intermediate dots along a specific edge */
function createEdgeIntermediateDots(card, side, existingDots) {
    // Sort dots by position
    let sortedDots = sortDotsByPosition(side, existingDots);
    // Find gaps where we could add dots
    let newDotPositions = [];
    for (let i = 0; i < sortedDots.length - 1; i++) {
        const dot1 = sortedDots[i];
        const dot2 = sortedDots[i + 1];
        // Skip if both dots are occupied and adjacent
        if (isDotOccupied(dot1) && isDotOccupied(dot2)) {
            // Check if they're not already too close
            const pos1 = getDotPosition(dot1);
            const pos2 = getDotPosition(dot2);
            // If dots are not already adjacent, add an intermediate dot
            if (Math.abs(pos1 - pos2) > 0.15) { // This threshold can be adjusted
                const newPos = (pos1 + pos2) / 2;
                // Create position for new dot
                let newDotPos = { left: "", top: "" };
                switch (side) {
                    case 0: // top
                        newDotPos.left = `${newPos * 100}%`;
                        newDotPos.top = "0%";
                        break;
                    case 1: // right
                        newDotPos.left = "100%";
                        newDotPos.top = `${newPos * 100}%`;
                        break;
                    case 2: // bottom
                        newDotPos.left = `${newPos * 100}%`;
                        newDotPos.top = "100%";
                        break;
                    case 3: // left
                        newDotPos.left = "0%";
                        newDotPos.top = `${newPos * 100}%`;
                        break;
                }
                newDotPositions.push(newDotPos);
            }
        }
    }
    // Create new dots at calculated positions
    newDotPositions.forEach(pos => {
        createNewDot(card, side, pos.left, pos.top);
    });
}
/* Sort dots by their position */
function sortDotsByPosition(side, dots) {
    return dots.sort((a, b) => {
        const posA = getDotPosition(a);
        const posB = getDotPosition(b);
        return posA - posB;
    });
}
/* Get normalized position (0-1) of a dot */
function getDotPosition(dot) {
    const side = parseInt(dot.dataset.side || "0", 10);
    // Extract percentage value and convert to number (0-1)
    const getPercent = (value) => {
        const match = value.match(/^([\d.]+)%$/);
        return match ? parseFloat(match[1]) / 100 : 0;
    };
    switch (side) {
        case 0: // top
        case 2: // bottom
            return getPercent(dot.style.left);
        case 1: // right
        case 3: // left
            return getPercent(dot.style.top);
        default:
            // For corners, use a combined position
            return getPercent(dot.style.left) + getPercent(dot.style.top);
    }
}
/* Create a new dot at specified position */
function createNewDot(card, side, left, top) {
    // Check if a dot already exists very close to this position
    const existingDots = Array.from(card.querySelectorAll('.dot'));
    const tooClose = existingDots.some(dot => {
        const dotLeft = getPercent(dot.style.left);
        const dotTop = getPercent(dot.style.top);
        const newLeft = getPercent(left);
        const newTop = getPercent(top);
        const distance = Math.sqrt(Math.pow(dotLeft - newLeft, 2) +
            Math.pow(dotTop - newTop, 2));
        return distance < 0.1; // If dots are closer than 10% of width/height
    });
    if (tooClose)
        return;
    // Create new dot
    const newDot = document.createElement("div");
    newDot.className = "dot";
    newDot.dataset.side = String(side);
    newDot.style.left = left;
    newDot.style.top = top;
    card.appendChild(newDot);
    // Register as an endpoint
    const ep = { card, el: newDot };
    endpoints.push(ep);
    // Add event listener
    newDot.addEventListener("pointerdown", e => {
        e.stopPropagation();
        startDraw(ep, e.clientX, e.clientY);
    });
}
/* Helper function to extract percentage from CSS value */
function getPercent(value) {
    const match = value.match(/^([\d.]+)%$/);
    return match ? parseFloat(match[1]) / 100 : 0;
}
/* Export function to remove a line by ID (used by dialog) */
export function removeLineById(id) {
    const index = lines.findIndex(line => line.id === id);
    if (index !== -1) {
        // Remove the SVG element
        lines[index].svg.remove();
        // Mark dots as unoccupied
        if (lines[index].from.el.dataset.occupied === "true") {
            lines[index].from.el.dataset.occupied = "false";
            lines[index].from.el.style.opacity = ""; // Reset opacity
        }
        if (lines[index].to.el.dataset.occupied === "true") {
            lines[index].to.el.dataset.occupied = "false";
            lines[index].to.el.style.opacity = ""; // Reset opacity
        }
        // Remove from our array
        lines.splice(index, 1);
    }
}
/* Export function to get all lines for saving */
export function getLines() {
    return lines.map(line => ({
        id: line.id,
        fromCard: Number(line.from.card.dataset.id || 0),
        fromSide: getSideFromDot(line.from.el),
        toCard: Number(line.to.card.dataset.id || 0),
        toSide: getSideFromDot(line.to.el)
    }));
}
/* Helper to determine which side a dot is on */
function getSideFromDot(dot) {
    // If we have a data-side attribute, use that
    if (dot.dataset.side) {
        return parseInt(dot.dataset.side, 10);
    }
    // Otherwise determine from CSS position
    const style = window.getComputedStyle(dot);
    const left = style.left;
    const top = style.top;
    if (top === "0%")
        return 0; // top
    if (left === "100%")
        return 1; // right
    if (top === "100%")
        return 2; // bottom
    if (left === "0%")
        return 3; // left
    // Corners
    if (left === "0%" && top === "0%")
        return 4; // top-left
    if (left === "100%" && top === "0%")
        return 5; // top-right
    if (left === "100%" && top === "100%")
        return 6; // bottom-right
    if (left === "0%" && top === "100%")
        return 7; // bottom-left
    return 0; // Default
}
/* Create a line from saved data */
export function createLineFromSaved(fromCardId, fromSide, toCardId, toSide) {
    // Find the cards
    const fromCard = document.querySelector(`.card[data-id="${fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-id="${toCardId}"]`);
    if (!fromCard || !toCard)
        return;
    // Find the dots at the specified sides
    const fromDot = findDotAtSide(fromCard, fromSide);
    const toDot = findDotAtSide(toCard, toSide);
    if (!fromDot || !toDot)
        return;
    // Create a new line
    const line = makeLine();
    line.style.pointerEvents = "auto";
    svg.appendChild(line);
    // Generate a unique ID
    const id = `line-${++lineCounter}`;
    line.setAttribute("data-id", id);
    // Add double-click handler
    line.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        showArrowDialog(id);
    });
    // Store the line
    lines.push({
        id,
        from: { card: fromCard, el: fromDot },
        to: { card: toCard, el: toDot },
        svg: line
    });
    // Mark dots as occupied
    markDotAsOccupied(fromDot);
    markDotAsOccupied(toDot);
    // Add additional dots
    addAdjacentDots(fromCard, fromDot);
    addAdjacentDots(toCard, toDot);
    // Recalculate positions
    recalcAllLines();
}
/* Find a dot at a specific side of a card */
function findDotAtSide(card, side) {
    const dots = card.querySelectorAll(`.dot[data-side="${side}"]`);
    if (dots.length === 0)
        return null;
    // Prefer unoccupied dots if available
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        if (!isDotOccupied(dot)) {
            return dot;
        }
    }
    // If all dots are occupied, use the first one
    return dots[0];
}
/* Clear all lines (used when loading a new layout) */
export function clearAllLines() {
    lines.forEach(line => line.svg.remove());
    lines.length = 0;
    // Reset all dots to unoccupied
    endpoints.forEach(ep => {
        if (ep.el.dataset.occupied === "true") {
            ep.el.dataset.occupied = "false";
            ep.el.style.opacity = ""; // Reset opacity
        }
    });
}
