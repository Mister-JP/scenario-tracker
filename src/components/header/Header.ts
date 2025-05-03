/**
 * Header Component
 * Creates the application header with controls for host, layout management, etc.
 */

import { createElement } from "../../utils/index.js";
import { store } from "../../core/state/index.js";
import { resetGridLayout, saveLayoutToFile, loadLayoutFromFile } from "../../core/layout/GridLayout.js";

// Use unique event names with namespaces to prevent duplicate handlers
const EDIT_EVENT = "click.edithost";
const SAVE_EVENT = "click.savelayout";
const LOAD_EVENT = "click.loadlayout";
const RESET_EVENT = "click.resetlayout";

/**
 * Creates the application header
 * @returns The header element
 */
export function createHeader(): HTMLElement {
  // Check if header already exists to prevent duplication
  const existingHeader = document.querySelector("header");
  if (existingHeader) {
    // If header exists, make sure event handlers are properly set up
    setupEventHandlersOnce();
    return existingHeader as HTMLElement;
  }
  
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
  const loadButton = createElement<HTMLButtonElement>("button", "", {
    "id": "load-layout-btn"
  });
  loadButton.textContent = "Load layout";
  
  const saveButton = createElement<HTMLButtonElement>("button", "", {
    "id": "save-layout-btn"
  });
  saveButton.textContent = "Save layout";
  
  const resetButton = createElement<HTMLButtonElement>("button", "", {
    "id": "reset-layout-btn"
  });
  resetButton.textContent = "Reset";
  
  // Add buttons to header
  header.appendChild(loadButton);
  header.appendChild(saveButton);
  header.appendChild(resetButton);
  
  // Create hidden file input for loading layouts
  const fileInput = createElement<HTMLInputElement>("input", "", {
    "id": "file-input",
    "type": "file",
    "accept": ".json"
  });
  fileInput.style.display = "none";
  header.appendChild(fileInput);
  
  // Add to document body
  document.body.appendChild(header);
  
  // Set up events after elements are in the DOM
  setupEventHandlersOnce();
  
  return header;
}

// Flag to ensure we only attach event handlers once
let editingHost = false;
let savingLayout = false;

/**
 * Sets up event handlers for header elements once
 * Guarantees no duplicate handlers
 */
function setupEventHandlersOnce(): void {
  // EDIT HOST BUTTON
  // First, remove any existing click handlers by cloning and replacing
  const editIcon = document.getElementById("edit-host");
  if (editIcon) {
    // Clone the element to remove all event listeners
    const newEditIcon = editIcon.cloneNode(true);
    editIcon.parentNode?.replaceChild(newEditIcon, editIcon);
    
    // Add the event listener to the new element
    newEditIcon.addEventListener("click", function(e) {
      e.stopPropagation();
      
      if (editingHost) return;
      editingHost = true;
      
      const currentHost = store.host;
      const newHost = prompt("New host to track", currentHost);
      
      if (newHost && newHost !== currentHost) {
        store.setHost(newHost);
        const hostValueElement = document.getElementById("host-value");
        if (hostValueElement) {
          hostValueElement.textContent = store.host;
        }
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        editingHost = false;
      }, 200);
    });
  }
  
  // SAVE LAYOUT BUTTON
  const saveButton = document.getElementById("save-layout-btn");
  if (saveButton) {
    // Clone the element to remove all event listeners
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode?.replaceChild(newSaveButton, saveButton);
    
    // Add the event listener to the new element
    newSaveButton.addEventListener("click", function() {
      if (savingLayout) return;
      savingLayout = true;
      
      const defaultName = Date.now().toString();
      const fileName = prompt("Save as…", defaultName) || "layout";
      saveLayoutToFile(fileName);
      
      // Reset flag after a short delay
      setTimeout(() => {
        savingLayout = false;
      }, 200);
    });
  }
  
  // RESET LAYOUT BUTTON
  const resetButton = document.getElementById("reset-layout-btn");
  if (resetButton) {
    // Clone the element to remove all event listeners
    const newResetButton = resetButton.cloneNode(true);
    resetButton.parentNode?.replaceChild(newResetButton, resetButton);
    
    // Add the event listener to the new element
    newResetButton.addEventListener("click", resetGridLayout);
  }
  
  // LOAD LAYOUT BUTTON & FILE INPUT
  const loadButton = document.getElementById("load-layout-btn");
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  
  if (loadButton && fileInput) {
    // Clone the element to remove all event listeners
    const newLoadButton = loadButton.cloneNode(true);
    loadButton.parentNode?.replaceChild(newLoadButton, loadButton);
    
    // Clone the file input to remove all event listeners
    const newFileInput = fileInput.cloneNode(true) as HTMLInputElement;
    fileInput.parentNode?.replaceChild(newFileInput, fileInput);
    
    // Add the event listeners to the new elements
    newLoadButton.addEventListener("click", function() {
      newFileInput.click();
    });
    
    newFileInput.addEventListener("change", function(event) {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        file.text().then(loadLayoutFromFile);
        newFileInput.value = "";
      }
    });
  }
}