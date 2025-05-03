/**
 * Application Entry Point
 * Initializes all components and starts the application
 */

import { createHeader } from "./components/header/Header.js";
import { initializeGrid } from "./core/layout/GridLayout.js";
import { initConnectorSystem } from "./components/connector/ConnectorManager.js";
import { initDialog } from "./components/dialog/Dialog.js";

/**
 * Initializes the application
 */
function initializeApplication(): void {
  // Create header first (needed for positioning cards below it)
  createHeader();
  
  // Initialize connector system (SVG container for arrows)
  initConnectorSystem();
  
  // Initialize the grid with cards
  initializeGrid();
  
  // Initialize the dialog system
  initDialog();
  
  console.log("Scenario Viewer initialized");
}

// Start the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApplication);