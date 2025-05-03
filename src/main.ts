/**
 * Application Entry Point
 * Initializes all components and starts the application
 * 
 * This enhanced version includes improved logging initialization,
 * debug mode detection, and integration with the Logger Demo.
 */

import { createHeader } from "./components/header/Header.js";
import { initializeGrid } from "./core/layout/GridLayout.js";
import { initConnectorSystem } from "./components/connector/ConnectorManager.js";
import { initDialog } from "./components/dialog/Dialog.js";
import { initLoggerConfigurator } from "./components/debug/LoggerConfigurator.js";
import { createLogger, LogLevel, Logger } from "./utils/Logger.js";
import { initLoggerDemo } from "./components/debug/LoggerDemo.js";

// Create main application logger
const logger = createLogger("App");

/**
 * Initializes the application
 */
function initializeApplication(): void {
  logger.info("Initializing Scenario Viewer application");
  
  // Start timing for performance measurement
  logger.startPerformanceMeasurement("appInitialization");
  
  // Set application context for all subsequent logs
  logger.setContext("appVersion", "1.0.0");
  logger.setContext("buildTime", new Date().toISOString());
  
  // Log current window dimensions
  logger.debug("Window dimensions", {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  });
  
  // Log browser information
  logger.debug("Environment", {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled
  });
  
  // Create initialization group for better log organization
  logger.group("Component Initialization");
  
  try {
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
    
    // Initialize logger demo if in debug mode
    if (isDebugMode()) {
      logger.debug("Initializing logger demo");
      initLoggerDemo();
    }
    
  } catch (error) {
    // Log any initialization errors
    logger.error("Error during initialization", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Show error to user
    alert("An error occurred during application initialization. Check the console for details.");
    
  } finally {
    // Always close the group and end measurement
    logger.groupEnd();
    
    // Calculate and log initialization time
    const initTime = logger.endPerformanceMeasurement("appInitialization", LogLevel.INFO);
    
    logger.info(`Scenario Viewer initialized in ${initTime.toFixed(2)}ms`);
    
    // Clear initialization context
    logger.clearAllContext();
  }
  
  // Set up window event handlers
  setupGlobalEventHandlers();
  
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

/**
 * Checks if debug mode is enabled based on URL parameters
 * @returns True if debug mode is enabled
 */
function isDebugMode(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const debug = urlParams.get("debug");
  
  return debug === "true" || debug === "1";
}

/**
 * Sets up event handlers for window-level events
 */
function setupGlobalEventHandlers(): void {
  logger.debug("Setting up global event handlers");
  
  // Handle window resize
  window.addEventListener("resize", () => {
    logger.debug("Window resized", {
      width: window.innerWidth,
      height: window.innerHeight
    });
  });
  
  // Handle visibility change
  document.addEventListener("visibilitychange", () => {
    const isVisible = document.visibilityState === "visible";
    logger.debug(`Application ${isVisible ? "visible" : "hidden"}`);
    
    // If becoming visible, flush any log buckets
    if (isVisible) {
      Logger.flushBuckets();
    }
  });
  
  // Handle before unload
  window.addEventListener("beforeunload", () => {
    logger.info("Application shutting down");
    Logger.flushBuckets();
  });
  
  // Handle errors
  window.addEventListener("error", (event) => {
    logger.error("Unhandled error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: String(event.reason)
    });
  });
}

/**
 * Initializes the application based on debug mode
 */
function initialize(): void {
  // Check if debug mode is enabled from URL parameters
  const debugEnabled = isDebugMode();
  
  if (debugEnabled) {
    logger.info("Debug mode enabled via URL parameter");
    // Set global log level to DEBUG
    Logger.setGlobalLevel(LogLevel.DEBUG);
  }
  
  // Start the application when DOM is fully loaded
  document.addEventListener("DOMContentLoaded", initializeApplication);
}

// Start initialization
initialize();