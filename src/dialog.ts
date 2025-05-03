/*********************************************************************
 *  Manages the popup dialog that appears when double-clicking an arrow
 *********************************************************************/

import { removeLineById } from "./connectors.js";

// DOM elements for the modal
let modalOverlay: HTMLDivElement | null = null;
let modalContent: HTMLDivElement | null = null;
let currentArrowId: string | null = null;

/**
 * Creates the modal elements and adds them to the DOM
 * Called once during initialization
 */
export function initDialog() {
  // Create modal overlay (translucent black background)
  modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.style.display = "none";
  document.body.appendChild(modalOverlay);

  // Create modal content container
  modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalOverlay.appendChild(modalContent);

  // Close when clicking outside the modal
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeDialog();
    }
  });
}

/**
 * Shows the dialog for an arrow
 * @param arrowId The ID of the arrow that was clicked
 */
export function showArrowDialog(arrowId: string) {
  if (!modalOverlay || !modalContent) {
    initDialog();
  }

  currentArrowId = arrowId;

  // Create header
  const header = document.createElement("div");
  header.className = "modal-header";
  
  // Add close button (Mac/Linux style)
  const closeBtn = document.createElement("div");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "×"; // X symbol
  closeBtn.addEventListener("click", closeDialog);
  header.appendChild(closeBtn);

  // Add title
  const title = document.createElement("h2");
  title.textContent = "Arrow Connection";
  header.appendChild(title);

  // Add remove button
  const removeBtn = document.createElement("button");
  removeBtn.className = "modal-remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    if (currentArrowId) {
      removeLineById(currentArrowId);
      closeDialog();
    }
  });
  header.appendChild(removeBtn);

  // Create body content
  const body = document.createElement("div");
  body.className = "modal-body";
  body.innerHTML = `
    <p>This connection represents scenario flow from one view to another.</p>
    <p>Click "Remove" to delete this connection, or close this dialog to keep it.</p>
  `;

  // Clear and build modal
  modalContent!.innerHTML = "";
  modalContent!.appendChild(header);
  modalContent!.appendChild(body);
  
  // Show modal
  modalOverlay!.style.display = "flex";
}

/**
 * Closes the dialog
 */
export function closeDialog() {
  if (modalOverlay) {
    modalOverlay.style.display = "none";
  }
  currentArrowId = null;
}
