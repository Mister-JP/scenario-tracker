/**
 * Connector Manager
 * Handles the creation and management of connections between cards
 */

import { 
  ConnectionEndpoint, 
  ConnectorLine, 
  Connection,
  DotSide
} from "../../types/index.js";
import { 
  getElementCenter, 
  calculateDistance, 
  createSvgElement 
} from "../../utils/index.js";
import { createLogger } from "../../utils/Logger.js";
import { Constants } from "../../core/state/index.js";
import { showArrowDialog } from "../dialog/Dialog.js";

// Create a logger for this component
const logger = createLogger("ConnectorManager");

// Store for all connection endpoints (dots)
const endpoints: ConnectionEndpoint[] = [];

// Store for all connection lines
const lines: ConnectorLine[] = [];

// Counter for generating unique line IDs
let lineCounter = 0;

// Drawing state
let activeDrawing: { from: ConnectionEndpoint; line: SVGLineElement } | null = null;

// SVG container for all connector lines
let svgContainer: SVGElement;

/**
 * Initializes the connector system
 * Creates the SVG container and sets up event listeners
 */
export function initConnectorSystem(): void {
  logger.info("Initializing connector system");
  
  // Create SVG container for connectors
  logger.debug("Creating SVG container");
  svgContainer = createSvgElement<SVGElement>("svg", {
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
  logger.debug("Creating arrow marker definition");
  const defs = createSvgElement<SVGDefsElement>("defs");
  const marker = createSvgElement<SVGMarkerElement>("marker", {
    "id": "arrow-head",
    "markerWidth": "10",
    "markerHeight": "10",
    "refX": "9",
    "refY": "5",
    "orient": "auto-start-reverse"
  });
  
  const path = createSvgElement<SVGPathElement>("path", {
    "d": "M0,0 L10,5 L0,10 Z",
    "fill": "#444"
  });
  
  marker.appendChild(path);
  defs.appendChild(marker);
  svgContainer.appendChild(defs);
  document.body.appendChild(svgContainer);
  
  // Set up event listeners for card movements
  logger.debug("Setting up event listeners");
  window.addEventListener("card-move", recalculateAllLines);
  window.addEventListener("card-resize", recalculateAllLines);
  
  logger.info("Connector system initialized");
}

/**
 * Registers connector endpoints (dots) for a card
 * @param cardElement - The card element
 * @param endpoints - Array of connection endpoints
 */
export function registerEndpoints(
  cardElement: HTMLElement, 
  connectionPoints: ConnectionEndpoint[]
): void {
  const cardId = cardElement.dataset.id;
  logger.debug(`Registering ${connectionPoints.length} endpoints for card ${cardId}`);
  
  connectionPoints.forEach((endpoint, index) => {
    // Add to global endpoints store
    endpoints.push(endpoint);
    
    // Log endpoint details at debug level
    const dotSide = endpoint.dotElement.dataset.side;
    logger.debug(`Registered endpoint ${index} (side: ${dotSide}) for card ${cardId}`);
    
    // Set up event handling for connections
    endpoint.dotElement.addEventListener("pointerdown", (event) => {
      event.stopPropagation(); // Prevent card drag
      logger.debug(`Endpoint activated on card ${cardId}, side ${dotSide}`);
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
function startDrawingConnection(
  fromEndpoint: ConnectionEndpoint,
  initialX: number, 
  initialY: number
): void {
  const fromCardId = fromEndpoint.cardElement.dataset.id;
  const fromDotSide = fromEndpoint.dotElement.dataset.side;
  
  logger.debug(`Starting connection from card ${fromCardId}, side ${fromDotSide}`, {
    position: { x: initialX, y: initialY }
  });
  
  // Create a temporary SVG line element
  const line = createSvgElement<SVGLineElement>("line", {
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
  const handlePointerMove = (event: PointerEvent): void => {
    if (!activeDrawing) return;
    
    activeDrawing.line.setAttribute("x2", String(event.clientX));
    activeDrawing.line.setAttribute("y2", String(event.clientY));
    
    // Periodically log pointer position during move (throttled)
    if (Math.random() < 0.05) { // Log roughly 5% of moves to avoid flooding
      logger.debug(`Drawing line to position`, {
        x: event.clientX,
        y: event.clientY
      });
    }
  };
  
  // Handle pointer up to finalize connection
  const handlePointerUp = (event: PointerEvent): void => {
    if (!activeDrawing) return;
    
    logger.debug(`Finalizing connection at position`, {
      x: event.clientX,
      y: event.clientY
    });
    
    // Find nearest valid endpoint
    const toEndpoint = findNearestEndpoint(
      event.clientX, 
      event.clientY, 
      activeDrawing.from
    );
    
    if (toEndpoint) {
      const toCardId = toEndpoint.cardElement.dataset.id;
      const toDotSide = toEndpoint.dotElement.dataset.side;
      
      logger.info(`Connection created from card ${fromCardId} to card ${toCardId}`, {
        fromSide: fromDotSide,
        toSide: toDotSide
      });
      
      // Complete the connection
      finalizeConnection(activeDrawing.from, toEndpoint, activeDrawing.line);
    } else {
      // No valid endpoint found, remove the line
      logger.debug(`No valid endpoint found, canceling connection`);
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
function findNearestEndpoint(
  x: number, 
  y: number, 
  fromEndpoint: ConnectionEndpoint
): ConnectionEndpoint | null {
  let bestEndpoint: ConnectionEndpoint | null = null;
  let bestDistance = Constants.CONNECTOR_SNAP_DISTANCE;
  
  logger.debug(`Finding nearest endpoint to (${x}, ${y})`);
  
  endpoints.forEach(endpoint => {
    // Skip if trying to connect to the same card
    if (endpoint.cardElement === fromEndpoint.cardElement) {
      return;
    }
    
    // Calculate distance to endpoint
    const center = getElementCenter(endpoint.dotElement);
    const distance = calculateDistance(center.x, center.y, x, y);
    
    logger.debug(`Endpoint on card ${endpoint.cardElement.dataset.id}, side ${endpoint.dotElement.dataset.side}: distance = ${distance.toFixed(2)}`);
    
    // If this is closer than previous best, update
    if (distance < bestDistance) {
      bestDistance = distance;
      bestEndpoint = endpoint;
      logger.debug(`New best endpoint: card ${endpoint.cardElement.dataset.id}, side ${endpoint.dotElement.dataset.side}, distance ${distance.toFixed(2)}`);
    }
  });
  
  if (bestEndpoint) {
    logger.debug(`Selected nearest endpoint: card ${bestEndpoint.cardElement.dataset.id}, side ${bestEndpoint.dotElement.dataset.side}`);
  } else {
    logger.debug(`No endpoint found within snap distance (${Constants.CONNECTOR_SNAP_DISTANCE}px)`);
  }
  
  return bestEndpoint;
}

/**
 * Finalizes a connection between two endpoints
 * @param fromEndpoint - Source endpoint
 * @param toEndpoint - Target endpoint
 * @param lineElement - The SVG line element
 */
function finalizeConnection(
  fromEndpoint: ConnectionEndpoint,
  toEndpoint: ConnectionEndpoint,
  lineElement: SVGLineElement
): void {
  // Generate unique ID for the line
  const id = `line-${++lineCounter}`;
  lineElement.setAttribute("data-id", id);
  
  const fromCardId = fromEndpoint.cardElement.dataset.id;
  const toCardId = toEndpoint.cardElement.dataset.id;
  
  logger.info(`Finalizing connection ${id} from card ${fromCardId} to card ${toCardId}`);
  
  // Make line interactive
  lineElement.style.pointerEvents = "auto";
  
  // Add double-click handler for editing
  lineElement.addEventListener("dblclick", (event) => {
    event.stopPropagation();
    logger.debug(`Line ${id} double-clicked, showing dialog`);
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
  
  logger.debug(`Connection ${id} finalized successfully`);
}

/**
 * Marks a dot as occupied
 * @param dotElement - The dot element
 */
function markDotAsOccupied(dotElement: HTMLDivElement): void {
  dotElement.dataset.occupied = "true";
  dotElement.style.opacity = "0.7"; // Make more visible
  logger.debug(`Marked dot as occupied: side ${dotElement.dataset.side}`);
}

/**
 * Adds intermediate dots between occupied dots
 * @param cardElement - The card element
 * @param dotElement - The newly occupied dot
 */
function addIntermediateDots(
  cardElement: HTMLElement,
  dotElement: HTMLDivElement
): void {
  // Get the side index from the dot
  const side = parseInt(dotElement.dataset.side || "0", 10);
  
  // Only add intermediate dots on main edges (not corners)
  if (side <= DotSide.LEFT) {
    // Get all dots on this side
    const dotsOnSide = Array.from(
      cardElement.querySelectorAll(`.dot[data-side="${side}"]`)
    ) as HTMLDivElement[];
    
    logger.debug(`Adding intermediate dots for card ${cardElement.dataset.id}, side ${side}`, {
      existingDots: dotsOnSide.length
    });
    
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
function createIntermediateDots(
  cardElement: HTMLElement,
  side: DotSide,
  existingDots: HTMLDivElement[]
): void {
  // Implementation details hidden for brevity
  // This would create new dots between occupied dots
  logger.debug(`Creating intermediate dots for card ${cardElement.dataset.id}, side ${side}`);
  // Implementation would go here
}

/**
 * Recalculates positions for all connection lines
 */
export function recalculateAllLines(): void {
  if (lines.length === 0) return;
  
  logger.debug(`Recalculating positions for ${lines.length} connection lines`);
  
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
export function removeConnectionById(id: string): void {
  logger.info(`Removing connection with ID: ${id}`);
  
  const index = lines.findIndex(line => line.id === id);
  if (index === -1) {
    logger.warn(`Connection ${id} not found`);
    return;
  }
  
  // Get the line
  const line = lines[index];
  
  // Log the details of the line being removed
  logger.debug(`Removing connection from card ${line.from.cardElement.dataset.id} to card ${line.to.cardElement.dataset.id}`);
  
  // Remove SVG element
  line.svg.remove();
  
  // Reset occupied state on dots if needed
  if (line.from.dotElement.dataset.occupied === "true") {
    line.from.dotElement.dataset.occupied = "false";
    line.from.dotElement.style.opacity = "";
    logger.debug(`Reset occupied state on source dot`);
  }
  
  if (line.to.dotElement.dataset.occupied === "true") {
    line.to.dotElement.dataset.occupied = "false";
    line.to.dotElement.style.opacity = "";
    logger.debug(`Reset occupied state on target dot`);
  }
  
  // Remove from lines array
  lines.splice(index, 1);
  logger.info(`Connection ${id} successfully removed`);
}

/**
 * Gets all connections for saving
 * @returns Array of Connection objects
 */
export function getAllConnections(): Connection[] {
  logger.debug(`Getting all connections for saving, count: ${lines.length}`);
  
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
function getDotSide(dotElement: HTMLDivElement): DotSide {
  // Use data-side attribute if available
  if (dotElement.dataset.side) {
    return parseInt(dotElement.dataset.side, 10) as DotSide;
  }
  
  // Fallback: determine from position
  const style = window.getComputedStyle(dotElement);
  const left = style.left;
  const top = style.top;
  
  logger.debug(`Determining dot side from position: left=${left}, top=${top}`);
  
  if (top === "0%") return DotSide.TOP;
  if (left === "100%") return DotSide.RIGHT;
  if (top === "100%") return DotSide.BOTTOM;
  if (left === "0%") return DotSide.LEFT;
  
  // Corners
  if (left === "0%" && top === "0%") return DotSide.TOP_LEFT;
  if (left === "100%" && top === "0%") return DotSide.TOP_RIGHT;
  if (left === "100%" && top === "100%") return DotSide.BOTTOM_RIGHT;
  if (left === "0%" && top === "100%") return DotSide.BOTTOM_LEFT;
  
  logger.warn(`Could not determine dot side from position, using default`);
  return DotSide.TOP; // Default
}

/**
 * Creates a connection from saved data
 * @param fromCardId - Source card ID
 * @param fromSide - Source dot side
 * @param toCardId - Target card ID
 * @param toSide - Target dot side
 */
export function createConnectionFromSaved(
  fromCardId: number,
  fromSide: DotSide,
  toCardId: number,
  toSide: DotSide
): void {
  logger.info(`Creating connection from saved data: ${fromCardId} -> ${toCardId}`);
  
  // Find card elements
  const fromCard = document.querySelector(
    `.card[data-id="${fromCardId}"]`
  ) as HTMLElement;
  
  const toCard = document.querySelector(
    `.card[data-id="${toCardId}"]`
  ) as HTMLElement;
  
  if (!fromCard || !toCard) {
    logger.error(`Could not find cards: fromCard=${!!fromCard}, toCard=${!!toCard}`);
    return;
  }
  
  // Find dot elements
  const fromDot = findDotAtSide(fromCard, fromSide);
  const toDot = findDotAtSide(toCard, toSide);
  
  if (!fromDot || !toDot) {
    logger.error(`Could not find dots: fromDot=${!!fromDot}, toDot=${!!toDot}`);
    return;
  }
  
  logger.debug(`Found dots for connection: fromSide=${fromSide}, toSide=${toSide}`);
  
  // Create connector line
  const line = createSvgElement<SVGLineElement>("line", {
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
    logger.debug(`Line ${id} double-clicked, showing dialog`);
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
  
  logger.info(`Connection ${id} created from saved data`);
}

/**
 * Finds a dot at a specific side of a card
 * @param cardElement - The card element
 * @param side - The side to find
 * @returns The dot element or null if not found
 */
function findDotAtSide(
  cardElement: HTMLElement, 
  side: DotSide
): HTMLDivElement | null {
  logger.debug(`Finding dot at side ${side} for card ${cardElement.dataset.id}`);
  
  const dots = cardElement.querySelectorAll(
    `.dot[data-side="${side}"]`
  ) as NodeListOf<HTMLDivElement>;
  
  if (dots.length === 0) {
    logger.warn(`No dots found for side ${side} on card ${cardElement.dataset.id}`);
    return null;
  }
  
  logger.debug(`Found ${dots.length} dots for side ${side}`);
  
  // Try to find an unoccupied dot first
  for (let i = 0; i < dots.length; i++) {
    if (dots[i].dataset.occupied !== "true") {
      logger.debug(`Found unoccupied dot at index ${i}`);
      return dots[i];
    }
  }
  
  // If all dots are occupied, use the first one
  logger.debug(`All dots are occupied, using the first one`);
  return dots[0];
}

/**
 * Clears all connections
 * Used when loading a new layout
 */
export function clearAllConnections(): void {
  logger.info(`Clearing all connections (count: ${lines.length})`);
  
  // Remove all SVG lines
  lines.forEach(line => line.svg.remove());
  
  // Clear lines array
  lines.length = 0;
  
  // Reset all dots to unoccupied
  let resetCount = 0;
  endpoints.forEach(endpoint => {
    if (endpoint.dotElement.dataset.occupied === "true") {
      endpoint.dotElement.dataset.occupied = "false";
      endpoint.dotElement.style.opacity = "";
      resetCount++;
    }
  });
  
  logger.debug(`Reset occupied state on ${resetCount} dots`);
}