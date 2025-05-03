/**
 * Card component
 * Handles the creation and management of draggable scenario cards
 */
import { DotSide } from "../../types";
import { createElement } from "../../utils";
import { store, Constants } from "../../core/state";
import { registerEndpoints } from "../connector/ConnectorManager";
// Z-index counter to bring active cards to front
let zIndexCounter = 1;
/**
 * Creates a new scenario card
 * @param scenarioId - Scenario number
 * @param position - Initial position {x, y}
 */
export function createCard(scenarioId, position) {
    // Create the card container
    const card = createElement("div", "card", {
        "data-id": String(scenarioId)
    });
    // Set initial position and z-index
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;
    card.style.zIndex = String(zIndexCounter++);
    // Create drag handle
    const handle = createElement("div", "handle");
    card.appendChild(handle);
    // Create title
    const title = createElement("h2");
    title.textContent = `Scenario ${scenarioId}`;
    card.appendChild(title);
    // Create iframe for scenario content
    const iframe = createElement("iframe");
    iframe.src = `${store.host}?scenario=${scenarioId}`;
    card.appendChild(iframe);
    // Create connector dots
    const dots = createConnectorDots(card);
    // Setup iframe scaling
    setupIframeScaling(card, iframe);
    // Setup drag behavior
    setupDragBehavior(card, handle);
    // Add to DOM and register with store
    document.body.appendChild(card);
    store.cards.set(scenarioId, card);
    // Register connector dots
    registerEndpoints(card, dots);
}
/**
 * Creates connector dots around the card edges
 * @param card - The card element
 * @returns Array of ConnectionEndpoint objects
 */
function createConnectorDots(card) {
    // Define dot positions [left%, top%, sideIndex]
    const dotDefinitions = [
        // Edge midpoints
        ["50%", "0%", DotSide.TOP],
        ["100%", "50%", DotSide.RIGHT],
        ["50%", "100%", DotSide.BOTTOM],
        ["0%", "50%", DotSide.LEFT],
        // Corner dots
        ["0%", "0%", DotSide.TOP_LEFT],
        ["100%", "0%", DotSide.TOP_RIGHT],
        ["100%", "100%", DotSide.BOTTOM_RIGHT],
        ["0%", "100%", DotSide.BOTTOM_LEFT]
    ];
    const endpoints = [];
    // Create dots at each position
    dotDefinitions.forEach(([left, top, side]) => {
        const dot = createElement("div", "dot", {
            "data-side": String(side)
        });
        dot.style.left = left;
        dot.style.top = top;
        card.appendChild(dot);
        endpoints.push({ cardElement: card, dotElement: dot });
    });
    return endpoints;
}
/**
 * Sets up iframe scaling to fit card dimensions
 * @param card - The card element
 * @param iframe - The iframe element
 */
function setupIframeScaling(card, iframe) {
    const rescale = () => {
        const scale = card.clientWidth / Constants.IFRAME_BASE_WIDTH;
        iframe.style.transform = `scale(${scale})`;
        iframe.style.width = `${Constants.IFRAME_BASE_WIDTH}px`;
        iframe.style.height = `${Constants.IFRAME_BASE_HEIGHT}px`;
        // Trigger connector line recalculation (will be defined elsewhere)
        window.dispatchEvent(new CustomEvent("card-resize"));
    };
    // Initial scaling
    rescale();
    // Auto-resize with ResizeObserver
    new ResizeObserver(rescale).observe(card);
}
/**
 * Sets up drag behavior for a card
 * @param card - The card element
 * @param handle - The drag handle element
 */
function setupDragBehavior(card, handle) {
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    handle.addEventListener("pointerdown", (event) => {
        isDragging = true;
        // Calculate offset from card's top-left corner
        offset = {
            x: event.clientX - card.offsetLeft,
            y: event.clientY - card.offsetTop
        };
        // Capture pointer to track movement outside the handle
        handle.setPointerCapture(event.pointerId);
        // Bring card to front
        card.style.zIndex = String(zIndexCounter++);
    });
    handle.addEventListener("pointermove", (event) => {
        if (!isDragging)
            return;
        // Calculate new position
        const x = event.clientX - offset.x;
        const y = Math.max(event.clientY - offset.y, 0); // Prevent negative y
        // Update card position
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        // Trigger connector line recalculation
        window.dispatchEvent(new CustomEvent("card-move"));
    });
    handle.addEventListener("pointerup", () => {
        isDragging = false;
    });
}
//# sourceMappingURL=Card.js.map