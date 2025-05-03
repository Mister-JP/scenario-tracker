/**
 * Application Entry Point
 * Initializes all components and starts the application
 */

import { createHeader } from "./components/header/Header.js";
import { initializeGrid } from "./core/layout/GridLayout.js";
import { initConnectorSystem } from "./components/connector/ConnectorManager.js";
import { initDialog } from "./components/dialog/Dialog.js";
import { initLoggerConfigurator } from "./components/debug/LoggerConfigurator.js";
import { createLogger, LogLevel } from "./utils/Logger.js";

// Create main application logger
const logger = createLogger("App");

/**
 * Initializes the application
 */
function initializeApplication(): void {
  logger.info("Initializing Scenario Viewer application");
  
  // Start timing for performance measurement
  const startTime = performance.now();
  
  // Log current window dimensions
  logger.debug("Window dimensions", {
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  logger.group("Component Initialization");
  
  // Create header first (needed for positioning cards below it)
  logger.debug("Creating header");
  createHeader();
  
  // Initialize connector system (SVG container for arrows)
  logger.debug("Initializing connector system");
  initConnectorSystem();
  
  // Initialize the grid with cards
  logger.debug("Initializing grid layout");
  initializeGrid();
  
  // Initialize the dialog system
  logger.debug("Initializing dialog system");
  initDialog();
  
  // Initialize the logger configurator (must be after header)
  logger.debug("Initializing logger configurator");
  initLoggerConfigurator();
  
  logger.groupEnd();
  
  // Calculate and log initialization time
  const endTime = performance.now();
  const initTime = (endTime - startTime).toFixed(2);
  logger.info(`Scenario Viewer initialized in ${initTime}ms`);
  
  // Log a welcome message to the console to help users find the debug panel
  console.log(
    "%cScenario Viewer Debug",
    "color: #4CAF50; font-size: 16px; font-weight: bold"
  );
  console.log(
    "%cClick the '🐞 Debug' button in the header to configure logging",
    "color: #555; font-size: 12px"
  );
}

// Check if we're debugging based on URL parameters
function checkDebugMode(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const debug = urlParams.get("debug");
  
  if (debug === "true" || debug === "1") {
    logger.info("Debug mode enabled via URL parameter");
    // Set global log level to DEBUG
    LogLevel.DEBUG;
  }
}

// Process URL parameters first
checkDebugMode();

// Start the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApplication);