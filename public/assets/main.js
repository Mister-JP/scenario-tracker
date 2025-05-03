/**
 * Application Entry Point
 * Initializes all components and starts the application
 */
import { createHeader } from "./components/header/Header";
import { initializeGrid } from "./core/layout/GridLayout";
import { initConnectorSystem } from "./components/connector/ConnectorManager";
import { initDialog } from "./components/dialog/Dialog";
/**
 * Initializes the application
 */
function initializeApplication() {
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
//# sourceMappingURL=main.js.map