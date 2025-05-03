/**
 * Dialog Component
 * Manages the modal dialog that appears when double-clicking a connection line
 */
import { createElement } from "../../utils";
import { removeConnectionById } from "../connector/ConnectorManager";
// Dialog DOM elements
let modalOverlay = null;
let modalContent = null;
// Currently active arrow ID
let activeArrowId = null;
/**
 * Initializes the dialog component
 * Creates the necessary DOM elements for the modal dialog
 */
export function initDialog() {
    // Create modal overlay (translucent background)
    modalOverlay = createElement("div", "modal-overlay");
    modalOverlay.style.display = "none";
    document.body.appendChild(modalOverlay);
    // Create modal content container
    modalContent = createElement("div", "modal-content");
    modalOverlay.appendChild(modalContent);
    // Close when clicking outside the modal
    modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
            closeDialog();
        }
    });
    // Close on escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalOverlay?.style.display !== "none") {
            closeDialog();
        }
    });
}
/**
 * Shows the dialog for editing an arrow connection
 * @param arrowId - ID of the arrow to edit
 */
export function showArrowDialog(arrowId) {
    // Initialize if not already done
    if (!modalOverlay || !modalContent) {
        initDialog();
    }
    // Store the active arrow ID
    activeArrowId = arrowId;
    // Create dialog header
    const header = createElement("div", "modal-header");
    // Close button
    const closeButton = createElement("div", "modal-close");
    closeButton.innerHTML = "×"; // X symbol
    closeButton.addEventListener("click", closeDialog);
    header.appendChild(closeButton);
    // Title
    const title = createElement("h2");
    title.textContent = "Arrow Connection";
    header.appendChild(title);
    // Remove button
    const removeButton = createElement("button", "modal-remove-btn");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
        if (activeArrowId) {
            removeConnectionById(activeArrowId);
            closeDialog();
        }
    });
    header.appendChild(removeButton);
    // Create dialog body
    const body = createElement("div", "modal-body");
    body.innerHTML = `
    <p>This connection represents scenario flow from one view to another.</p>
    <p>Click "Remove" to delete this connection, or close this dialog to keep it.</p>
  `;
    // Clear previous content and add new elements
    if (modalContent) {
        modalContent.innerHTML = "";
        modalContent.appendChild(header);
        modalContent.appendChild(body);
    }
    // Show the modal
    if (modalOverlay) {
        modalOverlay.style.display = "flex";
    }
}
/**
 * Closes the dialog
 */
export function closeDialog() {
    if (modalOverlay) {
        modalOverlay.style.display = "none";
    }
    activeArrowId = null;
}
//# sourceMappingURL=Dialog.js.map