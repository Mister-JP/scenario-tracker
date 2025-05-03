import { removeConnection } from "./connectors.js";
let currentLine = null;
export function setupPopup() {
    // Create popup overlay (dark glass effect)
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.style.display = "none";
    // Create popup container
    const popup = document.createElement("div");
    popup.className = "popup";
    // Create header
    const header = document.createElement("div");
    header.className = "popup-header";
    // Title
    const title = document.createElement("h2");
    title.textContent = "Connection Details";
    header.appendChild(title);
    // Close button (top left)
    const closeBtn = document.createElement("button");
    closeBtn.className = "popup-close";
    closeBtn.innerHTML = "×";
    closeBtn.title = "Close";
    header.appendChild(closeBtn);
    // Remove button (top right)
    const removeBtn = document.createElement("button");
    removeBtn.className = "popup-remove";
    removeBtn.textContent = "Remove";
    removeBtn.title = "Remove this connection";
    header.appendChild(removeBtn);
    // Popup content
    const content = document.createElement("div");
    content.className = "popup-content";
    content.innerHTML = "<p>This area will show details about the connection.</p>";
    // Assemble popup
    popup.appendChild(header);
    popup.appendChild(content);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    // Event handlers
    closeBtn.addEventListener("click", hidePopup);
    removeBtn.addEventListener("click", () => {
        if (currentLine) {
            removeConnection(currentLine);
            hidePopup();
        }
    });
    // Close when clicking on the overlay but not the popup
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            hidePopup();
        }
    });
    // Escape key closes popup
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.style.display !== "none") {
            hidePopup();
        }
    });
}
export function showPopup(lineId) {
    const overlay = document.querySelector(".popup-overlay");
    if (!overlay)
        return;
    currentLine = lineId;
    overlay.style.display = "flex";
    // Any additional logic to update popup content based on the line
    const content = overlay.querySelector(".popup-content");
    if (content) {
        content.innerHTML = `<p>Connection ID: ${lineId}</p>`;
        // Here you can add more details about the connection
    }
}
export function hidePopup() {
    const overlay = document.querySelector(".popup-overlay");
    if (!overlay)
        return;
    overlay.style.display = "none";
    currentLine = null;
}
