/**
 * Connector Manager
 * Handles the creation and management of connections between cards
 */
import { DotSide } from "../../types";
import { getElementCenter, calculateDistance, createSvgElement } from "../../utils";
import { Constants } from "../../core/state";
import { showArrowDialog } from "../dialog/Dialog";
// Store for all connection endpoints (dots)
const endpoints = [];
// Store for all connection lines
const lines = [];
// Counter for generating unique line IDs
let lineCounter = 0;
// Drawing state
let activeDrawing = null;
// SVG container for all connector lines
let svgContainer;
/**
 * Initializes the connector system
 * Creates the SVG container and sets up event listeners
 */
export function initConnectorSystem() {
    // Create SVG container for connectors
    svgContainer = createSvgElement("svg", {
        "style": `
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
      `
    });
    // Add arrow marker definition
    const defs = createSvgElement("defs");
    const marker = createSvgElement("marker", {
        "id": "arrow-head",
        "markerWidth": "10",
        "markerHeight": "10",
        "refX": "9",
        "refY": "5",
        "orient": "auto-start-reverse"
    });
    const path = createSvgElement("path", {
        "d": "M0,0 L10,5 L0,10 Z",
        "fill": "#444"
    });
    marker.appendChild(path);
    defs.appendChild(marker);
    svgContainer.appendChild(defs);
    document.body.appendChild(svgContainer);
    // Set up event listeners for card movements
    window.addEventListener("card-move", recalculateAllLines);
    window.addEventListener("card-resize", recalculateAllLines);
}
/**
 * Registers connector endpoints (dots) for a card
 * @param cardElement - The card element
 * @param endpoints - Array of connection endpoints
 */
export function registerEndpoints(cardElement, connectionPoints) {
    connectionPoints.forEach(endpoint => {
        // Add to global endpoints store
        endpoints.push(endpoint);
        // Set up event handling for connections
        endpoint.dotElement.addEventListener("pointerdown", (event) => {
            event.stopPropagation(); // Prevent card drag
            startDrawingConnection(endpoint, event.clientX, event.clientY);
        });
    });
}
/**
 * Starts drawing a connection from an endpoint
 * @param fromEndpoint - Starting endpoint
 * @param initialX - Initial X position
 * @param initialY - Initial Y position
 */
function startDrawingConnection(fromEndpoint, initialX, initialY) {
    // Create a temporary SVG line element
    const line = createSvgElement("line", {
        "x1": String(initialX),
        "y1": String(initialY),
        "x2": String(initialX),
        "y2": String(initialY),
        "stroke": "#444",
        "stroke-width": "2",
        "marker-end": "url(#arrow-head)"
    });
    svgContainer.appendChild(line);
    activeDrawing = { from: fromEndpoint, line };
    // Handle pointer move to update line end position
    const handlePointerMove = (event) => {
        if (!activeDrawing)
            return;
        activeDrawing.line.setAttribute("x2", String(event.clientX));
        activeDrawing.line.setAttribute("y2", String(event.clientY));
    };
    // Handle pointer up to finalize connection
    const handlePointerUp = (event) => {
        if (!activeDrawing)
            return;
        // Find nearest valid endpoint
        const toEndpoint = findNearestEndpoint(event.clientX, event.clientY, activeDrawing.from);
        if (toEndpoint) {
            // Complete the connection
            finalizeConnection(activeDrawing.from, toEndpoint, activeDrawing.line);
        }
        else {
            // No valid endpoint found, remove the line
            activeDrawing.line.remove();
        }
        // Clean up
        activeDrawing = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
    };
    // Add event listeners to window to track pointer outside SVG
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
}
/**
 * Finds the nearest valid endpoint within snap distance
 * @param x - Pointer X position
 * @param y - Pointer Y position
 * @param fromEndpoint - The source endpoint (to exclude self-connections)
 * @returns The nearest endpoint or null if none found
 */
function findNearestEndpoint(x, y, fromEndpoint) {
    let bestEndpoint = null;
    let bestDistance = Constants.CONNECTOR_SNAP_DISTANCE;
    endpoints.forEach(endpoint => {
        // Skip if trying to connect to the same card
        if (endpoint.cardElement === fromEndpoint.cardElement)
            return;
        // Calculate distance to endpoint
        const center = getElementCenter(endpoint.dotElement);
        const distance = calculateDistance(center.x, center.y, x, y);
        // If this is closer than previous best, update
        if (distance < bestDistance) {
            bestDistance = distance;
            bestEndpoint = endpoint;
        }
    });
    return bestEndpoint;
}
/**
 * Finalizes a connection between two endpoints
 * @param fromEndpoint - Source endpoint
 * @param toEndpoint - Target endpoint
 * @param lineElement - The SVG line element
 */
function finalizeConnection(fromEndpoint, toEndpoint, lineElement) {
    // Generate unique ID for the line
    const id = `line-${++lineCounter}`;
    lineElement.setAttribute("data-id", id);
    // Make line interactive
    lineElement.style.pointerEvents = "auto";
    // Add double-click handler for editing
    lineElement.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        showArrowDialog(id);
    });
    // Store the connection
    lines.push({
        id,
        from: fromEndpoint,
        to: toEndpoint,
        svg: lineElement
    });
    // Mark dots as occupied
    markDotAsOccupied(fromEndpoint.dotElement);
    markDotAsOccupied(toEndpoint.dotElement);
    // Add additional connector dots if needed
    addIntermediateDots(fromEndpoint.cardElement, fromEndpoint.dotElement);
    addIntermediateDots(toEndpoint.cardElement, toEndpoint.dotElement);
    // Update line positions
    recalculateAllLines();
}
/**
 * Marks a dot as occupied
 * @param dotElement - The dot element
 */
function markDotAsOccupied(dotElement) {
    dotElement.dataset.occupied = "true";
    dotElement.style.opacity = "0.7"; // Make more visible
}
/**
 * Adds intermediate dots between occupied dots
 * @param cardElement - The card element
 * @param dotElement - The newly occupied dot
 */
function addIntermediateDots(cardElement, dotElement) {
    // Get the side index from the dot
    const side = parseInt(dotElement.dataset.side || "0", 10);
    // Only add intermediate dots on main edges (not corners)
    if (side <= DotSide.LEFT) {
        // Get all dots on this side
        const dotsOnSide = Array.from(cardElement.querySelectorAll(`.dot[data-side="${side}"]`));
        // Create intermediate dots where needed
        createIntermediateDots(cardElement, side, dotsOnSide);
    }
}
/**
 * Creates intermediate dots between existing dots on an edge
 * @param cardElement - The card element
 * @param side - The side index
 * @param existingDots - Array of existing dots on this side
 */
function createIntermediateDots(cardElement, side, existingDots) {
    // Implementation details hidden for brevity
    // This would create new dots between occupied dots
}
/**
 * Recalculates positions for all connection lines
 */
export function recalculateAllLines() {
    lines.forEach(line => {
        const fromCenter = getElementCenter(line.from.dotElement);
        const toCenter = getElementCenter(line.to.dotElement);
        line.svg.setAttribute("x1", String(fromCenter.x));
        line.svg.setAttribute("y1", String(fromCenter.y));
        line.svg.setAttribute("x2", String(toCenter.x));
        line.svg.setAttribute("y2", String(toCenter.y));
    });
}
/**
 * Removes a connection line by ID
 * @param id - Line ID to remove
 */
export function removeConnectionById(id) {
    const index = lines.findIndex(line => line.id === id);
    if (index === -1)
        return;
    // Get the line
    const line = lines[index];
    // Remove SVG element
    line.svg.remove();
    // Reset occupied state on dots if needed
    if (line.from.dotElement.dataset.occupied === "true") {
        line.from.dotElement.dataset.occupied = "false";
        line.from.dotElement.style.opacity = "";
    }
    if (line.to.dotElement.dataset.occupied === "true") {
        line.to.dotElement.dataset.occupied = "false";
        line.to.dotElement.style.opacity = "";
    }
    // Remove from lines array
    lines.splice(index, 1);
}
/**
 * Gets all connections for saving
 * @returns Array of Connection objects
 */
export function getAllConnections() {
    return lines.map(line => ({
        id: line.id,
        fromCardId: Number(line.from.cardElement.dataset.id || 0),
        fromSide: getDotSide(line.from.dotElement),
        toCardId: Number(line.to.cardElement.dataset.id || 0),
        toSide: getDotSide(line.to.dotElement)
    }));
}
/**
 * Gets the side index from a dot element
 * @param dotElement - The dot element
 * @returns The side index
 */
function getDotSide(dotElement) {
    // Use data-side attribute if available
    if (dotElement.dataset.side) {
        return parseInt(dotElement.dataset.side, 10);
    }
    // Fallback: determine from position
    const style = window.getComputedStyle(dotElement);
    const left = style.left;
    const top = style.top;
    if (top === "0%")
        return DotSide.TOP;
    if (left === "100%")
        return DotSide.RIGHT;
    if (top === "100%")
        return DotSide.BOTTOM;
    if (left === "0%")
        return DotSide.LEFT;
    // Corners
    if (left === "0%" && top === "0%")
        return DotSide.TOP_LEFT;
    if (left === "100%" && top === "0%")
        return DotSide.TOP_RIGHT;
    if (left === "100%" && top === "100%")
        return DotSide.BOTTOM_RIGHT;
    if (left === "0%" && top === "100%")
        return DotSide.BOTTOM_LEFT;
    return DotSide.TOP; // Default
}
/**
 * Creates a connection from saved data
 * @param fromCardId - Source card ID
 * @param fromSide - Source dot side
 * @param toCardId - Target card ID
 * @param toSide - Target dot side
 */
export function createConnectionFromSaved(fromCardId, fromSide, toCardId, toSide) {
    // Find card elements
    const fromCard = document.querySelector(`.card[data-id="${fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-id="${toCardId}"]`);
    if (!fromCard || !toCard)
        return;
    // Find dot elements
    const fromDot = findDotAtSide(fromCard, fromSide);
    const toDot = findDotAtSide(toCard, toSide);
    if (!fromDot || !toDot)
        return;
    // Create connector line
    const line = createSvgElement("line", {
        "stroke": "#444",
        "stroke-width": "2",
        "marker-end": "url(#arrow-head)",
        "pointer-events": "auto"
    });
    svgContainer.appendChild(line);
    // Generate unique ID
    const id = `line-${++lineCounter}`;
    line.setAttribute("data-id", id);
    // Add double-click handler
    line.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        showArrowDialog(id);
    });
    // Store the connection
    lines.push({
        id,
        from: { cardElement: fromCard, dotElement: fromDot },
        to: { cardElement: toCard, dotElement: toDot },
        svg: line
    });
    // Mark dots as occupied
    markDotAsOccupied(fromDot);
    markDotAsOccupied(toDot);
    // Update positions
    recalculateAllLines();
}
/**
 * Finds a dot at a specific side of a card
 * @param cardElement - The card element
 * @param side - The side to find
 * @returns The dot element or null if not found
 */
function findDotAtSide(cardElement, side) {
    const dots = cardElement.querySelectorAll(`.dot[data-side="${side}"]`);
    if (dots.length === 0)
        return null;
    // Try to find an unoccupied dot first
    for (let i = 0; i < dots.length; i++) {
        if (dots[i].dataset.occupied !== "true") {
            return dots[i];
        }
    }
    // If all dots are occupied, use the first one
    return dots[0];
}
/**
 * Clears all connections
 * Used when loading a new layout
 */
export function clearAllConnections() {
    // Remove all SVG lines
    lines.forEach(line => line.svg.remove());
    // Clear lines array
    lines.length = 0;
    // Reset all dots to unoccupied
    endpoints.forEach(endpoint => {
        if (endpoint.dotElement.dataset.occupied === "true") {
            endpoint.dotElement.dataset.occupied = "false";
            endpoint.dotElement.style.opacity = "";
        }
    });
}
//# sourceMappingURL=ConnectorManager.js.map