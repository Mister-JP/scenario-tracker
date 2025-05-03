/**
 * Header Component
 * Creates the application header with controls for host, layout management, etc.
 */

import { createElement } from "../../utils";
import { store } from "../../core/state";
import { resetGridLayout, saveLayoutToFile, loadLayoutFromFile } from "../../core/layout/GridLayout.js";

/**
 * Creates the application header
 * @returns The header element
 */
export function createHeader(): HTMLElement {
  // Create header element
  const header = createElement<HTMLElement>("header");
  
  // Create title with host info
  const title = createElement<HTMLHeadingElement>("h1");
  title.innerHTML = `Tracking:&nbsp;<span id="host-value">${store.host}</span>`;
  
  // Create edit icon
  const editIcon = createElement<HTMLImageElement>("img", "", {
    "id": "edit-host",
    "alt": "edit",
    "src": "icons/edit.svg"
  });
  title.appendChild(editIcon);
  header.appendChild(title);
  
  // Create action buttons
  const loadButton = createElement<HTMLButtonElement>("button");
  loadButton.textContent = "Load layout";
  
  const saveButton = createElement<HTMLButtonElement>("button");
  saveButton.textContent = "Save layout";
  
  const resetButton = createElement<HTMLButtonElement>("button");
  resetButton.textContent = "Reset";
  
  // Add buttons to header
  header.appendChild(loadButton);
  header.appendChild(saveButton);
  header.appendChild(resetButton);
  
  // Create hidden file input for loading layouts
  const fileInput = createElement<HTMLInputElement>("input", "", {
    "type": "file",
    "accept": ".json"
  });
  fileInput.style.display = "none";
  header.appendChild(fileInput);
  
  // Add to document body
  document.body.appendChild(header);
  
  // Setup event handlers
  setupEventHandlers(editIcon, loadButton, saveButton, resetButton, fileInput);
  
  return header;
}

/**
 * Sets up event handlers for header elements
 * @param editIcon - Host edit icon
 * @param loadButton - Load layout button
 * @param saveButton - Save layout button
 * @param resetButton - Reset layout button
 * @param fileInput - Hidden file input for loading
 */
function setupEventHandlers(
  editIcon: HTMLImageElement,
  loadButton: HTMLButtonElement,
  saveButton: HTMLButtonElement,
  resetButton: HTMLButtonElement,
  fileInput: HTMLInputElement
): void {
  // Edit host button
  editIcon.addEventListener("click", () => {
    const currentHost = store.host;
    const newHost = prompt("New host to track", currentHost);
    
    if (newHost && newHost !== currentHost) {
      store.setHost(newHost);
      const hostValueElement = document.getElementById("host-value");
      if (hostValueElement) {
        hostValueElement.textContent = store.host;
      }
    }
  });
  
  // Reset button
  resetButton.addEventListener("click", resetGridLayout);
  
  // Save button
  saveButton.addEventListener("click", () => {
    const defaultName = Date.now().toString();
    const fileName = prompt("Save as…", defaultName) || "layout";
    saveLayoutToFile(fileName);
  });
  
  // Load button (trigger file input)
  loadButton.addEventListener("click", () => {
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Read file and apply layout
      file.text().then(loadLayoutFromFile);
      
      // Reset input value to allow selecting the same file again
      fileInput.value = "";
    }
  });
}