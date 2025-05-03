/**
 * Logger Demo Component
 * 
 * This file demonstrates how to use the enhanced Logger functionality
 * to create rich, technically detailed logs for better debugging.
 * 
 * It serves as both an example and a test harness for the logging system.
 */

import { createLogger, LogLevel } from "../../utils/Logger.js";
import { createElement } from "../../utils/index.js";

// Create a logger for this component
const logger = createLogger("LoggerDemo");

/**
 * Creates a demonstration panel for testing logger functionality
 * @returns The demo panel element
 */
export function createLoggerDemoPanel(): HTMLElement {
  logger.info("Creating logger demo panel");
  
  // Performance tracking for the overall operation
  logger.startPerformanceMeasurement("createDemoPanel");
  
  // Create container
  const container = createElement<HTMLDivElement>("div", "logger-demo-panel");
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.backgroundColor = "#f5f5f5";
  container.style.padding = "10px";
  container.style.borderRadius = "6px";
  container.style.boxShadow = "0 3px 10px rgba(0, 0, 0, 0.2)";
  container.style.zIndex = "1000";
  container.style.maxWidth = "300px";
  
  // Create title
  const title = createElement<HTMLHeadingElement>("h3");
  title.textContent = "Logger Demo";
  title.style.margin = "0 0 10px 0";
  title.style.fontSize = "16px";
  container.appendChild(title);
  
  // Create description
  const description = createElement<HTMLParagraphElement>("p");
  description.textContent = "Use these buttons to test the enhanced logging functionality.";
  description.style.fontSize = "12px";
  description.style.margin = "0 0 10px 0";
  container.appendChild(description);
  
  // Log group demonstration
  logger.group("Creating demo buttons");
  
  // Create demo buttons
  const buttonsContainer = createElement<HTMLDivElement>("div");
  buttonsContainer.style.display = "flex";
  buttonsContainer.style.flexDirection = "column";
  buttonsContainer.style.gap = "6px";
  
  // Log different levels button
  const logLevelsButton = createDemoButton(
    "Log All Levels",
    "#e3f2fd",
    demonstrateLogLevels
  );
  buttonsContainer.appendChild(logLevelsButton);
  logger.debug("Added log levels button");
  
  // Log with context button
  const contextButton = createDemoButton(
    "Log with Context",
    "#e8f5e9",
    demonstrateContext
  );
  buttonsContainer.appendChild(contextButton);
  logger.debug("Added context button");
  
  // Simulate complex operation button
  const complexButton = createDemoButton(
    "Simulate Complex Operation",
    "#fff8e1",
    demonstrateComplexOperation
  );
  buttonsContainer.appendChild(complexButton);
  logger.debug("Added complex operation button");
  
  // Simulate error button
  const errorButton = createDemoButton(
    "Simulate Error",
    "#ffebee",
    demonstrateError
  );
  buttonsContainer.appendChild(errorButton);
  logger.debug("Added error button");
  
  // Performance test button
  const perfButton = createDemoButton(
    "Performance Test",
    "#f3e5f5",
    demonstratePerformance
  );
  buttonsContainer.appendChild(perfButton);
  logger.debug("Added performance button");
  
  // Add buttons to container
  container.appendChild(buttonsContainer);
  
  // Close button
  const closeButton = createElement<HTMLButtonElement>("button");
  closeButton.textContent = "Close Demo";
  closeButton.style.marginTop = "10px";
  closeButton.style.padding = "6px";
  closeButton.style.backgroundColor = "#eee";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "4px";
  closeButton.style.cursor = "pointer";
  
  closeButton.addEventListener("click", () => {
    logger.info("Closing demo panel");
    container.remove();
  });
  
  container.appendChild(closeButton);
  logger.debug("Added close button");
  
  // End button creation group
  logger.groupEnd();
  
  // End performance measurement
  logger.endPerformanceMeasurement("createDemoPanel");
  
  return container;
}

/**
 * Creates a styled button for the demo panel
 * @param text - Button text
 * @param bgColor - Background color
 * @param onClick - Click handler
 * @returns Button element
 */
function createDemoButton(
  text: string,
  bgColor: string,
  onClick: () => void
): HTMLButtonElement {
  // Trace level logs detailed implementation information
  logger.trace("Creating demo button", { text, bgColor });
  
  const button = createElement<HTMLButtonElement>("button");
  button.textContent = text;
  button.style.padding = "8px";
  button.style.backgroundColor = bgColor;
  button.style.border = "none";
  button.style.borderRadius = "4px";
  button.style.cursor = "pointer";
  
  // Make sure we handle errors in the click handlers
  button.addEventListener("click", () => {
    try {
      logger.debug(`Demo button clicked: ${text}`);
      onClick();
    } catch (error) {
      logger.error(`Error in ${text} demo button handler`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Alert the user so they know something went wrong
      alert(`Error in ${text} demo: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  return button;
}

/**
 * Demonstrates logging at different levels
 */
function demonstrateLogLevels(): void {
  logger.info("Demonstrating different log levels");
  
  // Log at each level
  logger.trace("This is a TRACE message - Most detailed debug info");
  logger.debug("This is a DEBUG message - Development-time information");
  logger.info("This is an INFO message - General flow information");
  logger.warn("This is a WARN message - Potential problem");
  logger.error("This is an ERROR message - Something went wrong");
  
  // Log with data objects
  logger.debug("Debug with data object", {
    timestamp: Date.now(),
    values: [1, 2, 3, 4, 5],
    metadata: {
      source: "Demo",
      type: "Test"
    }
  });
  
  logger.info("Log levels demonstration complete");
}

/**
 * Demonstrates contextual logging
 */
function demonstrateContext(): void {
  logger.info("Demonstrating contextual logging");
  
  // Generate a random operation ID
  const operationId = Math.random().toString(36).substring(2, 10);
  logger.setContext("operationId", operationId);
  
  // Log with the context
  logger.debug("Operation started");
  
  // Simulate a multi-step operation using a safer approach
  // Avoid issues with setTimeout by keeping the context in scope
  let step = 1;
  const nextStep = () => {
    try {
      if (step === 1) {
        logger.debug("Operation step 1 complete");
        step++;
        setTimeout(nextStep, 500);
      } else if (step === 2) {
        logger.debug("Operation step 2 complete");
        step++;
        setTimeout(nextStep, 500);
      } else {
        logger.debug("Operation complete");
        logger.clearContext("operationId");
        logger.info("Context demonstration complete");
      }
    } catch (error) {
      logger.error("Error in context demonstration", {
        error: error instanceof Error ? error.message : String(error),
        step
      });
    }
  };
  
  setTimeout(nextStep, 500);
}

/**
 * Demonstrates logging a complex operation
 */
function demonstrateComplexOperation(): void {
  logger.info("Demonstrating complex operation logging");
  
  // Start a log group for the operation
  logger.group("Complex Card Creation Operation");
  
  try {
    // Initialize operation
    logger.debug("Initializing card creation");
    
    // Set some initial values
    const scenarioId = Math.floor(Math.random() * 10) + 1;
    const position = { x: Math.random() * 500, y: Math.random() * 300 };
    
    logger.debug("Card parameters", { scenarioId, position });
    
    // Simulate DOM creation with detailed logs
    logger.trace("Creating card element");
    logger.trace("Adding drag handle");
    logger.trace("Creating title element");
    logger.trace("Setting up iframe");
    
    // Simulate setting up event handlers
    logger.debug("Setting up event handlers");
    logger.trace("Adding mousedown handler to drag handle");
    logger.trace("Adding mousemove handler to window");
    logger.trace("Adding mouseup handler to window");
    
    // Simulate connector setup
    logger.debug("Setting up card connectors");
    for (let i = 0; i < 4; i++) {
      logger.trace(`Creating connector dot at side ${i}`);
    }
    
    // Simulate a decision point with rationale
    logger.debug("Determining initial iframe scale", {
      cardWidth: 350,
      baseWidth: 1280,
      calculatedScale: (350 / 1280).toFixed(3)
    });
    
    // Show completion
    logger.debug("Card creation complete", {
      scenarioId,
      position,
      element: "div.card[data-id='N']" // Simulated element
    });
  } catch (error) {
    logger.error("Error in complex operation demo", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  // Always end the group, even if an error occurred
  logger.groupEnd();
  
  logger.info("Complex operation demonstration complete");
}

/**
 * Demonstrates error logging and handling
 */
function demonstrateError(): void {
  logger.info("Demonstrating error logging");
  
  try {
    // Simulate an error condition
    logger.debug("Attempting risky operation");
    
    // Generate a random error type
    const errorTypes = [
      "ConnectionError",
      "InvalidCardError",
      "LayoutError",
      "StorageError"
    ];
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    // Throw an error
    throw new Error(`Simulated ${errorType}: Something went wrong`);
    
  } catch (error) {
    // Log the error with detailed information
    logger.error("Operation failed", {
      error: error instanceof Error ? error.message : String(error),
      time: new Date().toISOString(),
      state: {
        attempted: true,
        progress: 0.75,
        recoverable: Math.random() > 0.5
      }
    });
    
    // Log recovery attempt
    logger.warn("Attempting to recover from error");
    
    // Simulate recovery decision
    const recovered = Math.random() > 0.3;
    
    if (recovered) {
      logger.info("Successfully recovered from error");
    } else {
      logger.warn("Could not fully recover from error, some functionality may be affected");
    }
  }
  
  logger.info("Error demonstration complete");
}

/**
 * Demonstrates performance tracking
 */
function demonstratePerformance(): void {
  logger.info("Demonstrating performance tracking");
  
  try {
    // Simple operation tracking
    logger.startPerformanceMeasurement("simpleOperation");
    
    // Simulate a simple operation
    const startTime = Date.now();
    while (Date.now() - startTime < 100) {
      // Just busy wait
    }
    
    const elapsedSimple = logger.endPerformanceMeasurement("simpleOperation");
    logger.debug(`Simple operation completed in ${elapsedSimple.toFixed(2)}ms`);
    
    // Track a function automatically
    const complexResult = logger.trackFunction("complexCalculation", () => {
      let sum = 0;
      // Reduce the workload to avoid browser warnings about long-running scripts
      for (let i = 0; i < 500000; i++) {
        sum += Math.sqrt(i);
      }
      return sum;
    });
    
    logger.debug("Complex calculation result", { 
      result: complexResult,
      truncated: Math.floor(complexResult)
    });
    
    // Handle async operation with a promise
    logger.info("Performance demonstration complete for synchronous operations");
    logger.debug("Starting async operation test");
    
    // Return a promise instead of using async/await directly
    return new Promise<void>(resolve => {
      // Use trackFunction for the async wrapper to avoid issues
      logger.trackFunction("asyncWrapper", () => {
        setTimeout(() => {
          try {
            logger.debug("Async operation completed");
            logger.info("Performance demonstration fully complete");
            resolve();
          } catch (error) {
            logger.error("Error in async completion", { 
              error: error instanceof Error ? error.message : String(error) 
            });
            resolve();
          }
        }, 200);
      });
    });
  } catch (error) {
    logger.error("Error in performance demonstration", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Initializes the logger demo panel
 * Should be called after other components are initialized
 */
export function initLoggerDemo(): void {
  // Don't add demo panel immediately
  setTimeout(() => {
    try {
      const demoPanel = createLoggerDemoPanel();
      document.body.appendChild(demoPanel);
    } catch (error) {
      console.error("Failed to initialize logger demo:", error);
    }
  }, 2000);
}