# Comprehensive Debugging Guide for Scenario Viewer

This guide explains the advanced logging and debugging system in the Scenario Viewer application, designed to help both developers and users troubleshoot issues effectively.

## Logging System Overview

The Scenario Viewer includes a powerful and flexible logging system with the following capabilities:

- **Multiple Log Levels**: TRACE, DEBUG, INFO, WARN, ERROR, NONE
- **Namespace-based Logging**: Focus on specific components
- **Interactive Debug UI**: Configure logging in real-time
- **Log History**: View and analyze past log entries
- **Performance Monitoring**: Track function execution times
- **Context Tracking**: Maintain state across operations
- **Log Bucketing**: Group repetitive log messages
- **Export Capabilities**: Save logs for external analysis

## Log Levels

The system supports these log levels, in order of increasing severity:

1. **TRACE** - Most detailed information for deep debugging
2. **DEBUG** - Diagnostic information useful during development
3. **INFO** - General application flow and important events
4. **WARN** - Potentially problematic situations that don't prevent operation
5. **ERROR** - Error conditions that need immediate attention
6. **NONE** - Special level used to disable logging entirely

By default, the system shows only WARN and ERROR messages to keep the console clean, but you can adjust this through the Debug UI.

## Using the Debug UI

The application includes a comprehensive debug panel accessible through the "🐞 Debug" button in the top-right corner of the header.

### Settings Tab

The Settings tab allows you to configure global logging options:

- **Global Log Level**: Set the minimum log level for all components
- **Display Options**: Toggle timestamps, namespace display, and log bucketing
- **Advanced Settings**: Configure log history size
- **Actions**: Reset to defaults, enable all debugging, or clear log history

### Namespaces Tab

The Namespaces tab allows you to:

- **Filter Namespaces**: Apply a regex pattern to show only matching namespaces
- **Configure Log Levels**: Set specific log levels for individual components
- **Add Custom Namespaces**: Add and configure additional namespaces

### Logs Tab

The Logs tab provides a live view of the application log history:

- **Filter by Level**: Show only logs at or above a specific level
- **Text Filter**: Search for specific content in logs
- **Clear Logs**: Reset the log history
- **Export Logs**: Save logs to a file for external analysis

### Performance Tab

The Performance tab offers tools and examples for performance monitoring:

- **Code Examples**: How to use performance measurement tools
- **Test Functions**: Try out performance monitoring

## URL Parameters

You can enable debug mode by adding `?debug=true` to the application URL. This sets the global log level to DEBUG, showing all log messages.

Example: `http://localhost:8081/?debug=true`

## Adding Logging to Components

For developers, here's how to add logging to your components:

```typescript
// Import the logger
import { createLogger } from "../../utils/Logger.js";

// Create a logger for the component
const logger = createLogger("YourComponentName");

// Basic logging at different levels
logger.trace("Most detailed debugging information");
logger.debug("Detailed debugging information", { someObject: value });
logger.info("General information about application flow");
logger.warn("Warning about potential issues");
logger.error("Error information", error);

// Group related logs
logger.group("Operation Name");
logger.debug("Step 1");
logger.debug("Step 2");
logger.groupEnd();

// Performance measurement
logger.startPerformanceMeasurement("operation");
// ... your code here ...
const elapsed = logger.endPerformanceMeasurement("operation");

// Track function execution
const result = logger.trackFunction("functionName", () => {
  // Your function code
  return someValue;
});

// Track async function execution
const result = await logger.trackAsyncFunction("asyncOperation", async () => {
  // Your async code
  return await someValue;
});

// Contextual logging
logger.setContext("requestId", "123456");
logger.debug("Processing request"); // Will include requestId in the log data

// Conditional logging to avoid expensive operations
if (logger.isDebugEnabled()) {
  logger.debug("Expensive log message", calculateExpensiveObject());
}
```

## Best Practices

### 1. Use Appropriate Log Levels

- **TRACE**: Implementation details, very verbose information
- **DEBUG**: Variables, flow, and state changes useful for development
- **INFO**: Important events and significant state changes
- **WARN**: Problems that don't stop functionality but need attention
- **ERROR**: Critical failures, exceptions, and serious issues

### 2. Structured Component Logging

Organize your logging by component functionality:

```typescript
// 1. Component initialization
logger.debug("Initializing ConnectorManager");

// 2. Key state changes
logger.info(`Setting host to ${newHost}`);

// 3. User interactions
logger.debug("Card dragged", { cardId, position });

// 4. External interactions
logger.debug("Loading layout from file", { filename });

// 5. Error conditions with context
logger.error("Failed to create connection", { 
  fromCardId, 
  toCardId,
  error: error.message
});
```

### 3. Creating Technical Depth in Logs

To achieve technical depth, make sure logs tell a complete story:

```typescript
// Start of a complex operation
logger.group("Creating connection between cards");

// Log pre-conditions
logger.debug("Initial state", { fromCard, toCard });

// Log decision points with reasoning
logger.debug("Selected endpoint strategy: nearest", { 
  strategy: "nearest", 
  reason: "Multiple endpoints available"
});

// Log intermediate calculations
logger.trace("Distance calculations", { 
  distances: endpointDistances,
  closest: closestEndpoint
});

// Log outcome
logger.debug("Connection created successfully", { connectionId });

// End the group
logger.groupEnd();
```

### 4. Use Context for Related Operations

Context allows tracking related operations across function calls:

```typescript
// Set context at the beginning of an operation
logger.setContext("operationId", uuidv4());
logger.setContext("startTime", Date.now());

// Later in the code, even in different functions
logger.debug("Operation step completed"); // Will include context

// Clear when done
logger.clearAllContext();
```

### 5. Performance Monitoring

Use performance tracking for critical operations:

```typescript
// Simple measurements
logger.startPerformanceMeasurement("layoutCalculation");
calculateLayout();
logger.endPerformanceMeasurement("layoutCalculation");

// Automatic function tracking
logger.trackFunction("renderCards", renderCards);

// Log slow operations
const elapsed = logger.endPerformanceMeasurement("operation");
if (elapsed > 100) {
  logger.warn("Operation took longer than expected", { elapsed });
}
```

## Interpreting Logs

When analyzing logs for issues:

1. Start with ERROR logs to identify critical problems
2. Look for WARN messages that might explain unexpected behavior
3. Enable DEBUG level for components related to the issue
4. Use the text filter to find specific operations or components
5. Look for patterns in timing and operation sequence
6. Check for performance bottlenecks using timing measurements

## Common Debugging Scenarios

### 1. Debugging Connection Issues

```
# Enable ConnectorManager debugging
1. Click the "🐞 Debug" button
2. In the Namespaces tab, set "ConnectorManager" to DEBUG level
3. Try to create a connection and observe the logs
4. Look for logs related to endpoint finding, distance calculations

# Key logs to look for:
- "Finding nearest endpoint to (x, y)"
- "Selected endpoint: card X, side Y"
- "Connection created" or error messages
```

### 2. Investigating Layout Problems

```
# Debug the grid layout
1. Set "GridLayout" level to DEBUG
2. Reset or load a layout
3. Check the logs for card positioning information
4. Look for warnings about position constraints or overlaps

# Key logs to look for:
- "Initializing grid layout"
- "Positioning card X at (x, y)"
- "Card dimensions: width x height"
```

### 3. Performance Issues

```
# Enable performance tracking
1. Set relevant components to DEBUG level
2. Look for logs containing "⏱️" symbol
3. Check for operations taking longer than expected
4. Use the Performance tab to monitor specific operations

# Key metrics to watch:
- Card creation time
- Connection calculation time
- Layout calculation time
- Event handler response times
```

## Exporting Logs for Analysis

For persistent issues or to share with the development team:

1. Open the Debug UI and go to the Logs tab
2. Set filters to capture relevant information
3. Click "Export" to save logs as a text file
4. Share this file with the development team

## Storage and Clearing

Logger configuration is stored in localStorage under the key `scenario-viewer-logger-config`. You can reset to defaults using the "Reset to Defaults" button in the Debug panel, or by clearing localStorage.

## Contributing to the Logging System

If you're extending the application:

1. Add appropriate logging to new components using the patterns above
2. Add your component's namespace to the `KNOWN_NAMESPACES` array in `LoggerConfigurator.ts`
3. Consider adding component-specific debug views if needed
4. Document common debug patterns for your component

## Advanced Features

### Log Pattern Analysis

For complex issues, you can export logs and use pattern analysis:

```javascript
// Example of post-processing logs (in browser console or external tool)
const logs = Logger.getLogHistory();

// Filter logs by pattern
const connectionLogs = logs.filter(log => 
  log.namespace === "ConnectorManager" && 
  log.message.includes("Connection")
);

// Calculate statistics
const avgConnectionTime = connectionLogs.reduce((sum, log) => 
  sum + (log.data?.elapsed || 0), 0) / connectionLogs.length;

console.log(`Average connection time: ${avgConnectionTime}ms`);
```

### Custom Views

You can create custom debug views for specific components:

```javascript
// Access the logger in the console
const logger = window.__scenarioLogger;

// Create custom analysis
logger.getLogHistory()
  .filter(log => log.namespace === "YourComponent")
  .forEach(log => console.table(log.data));
```

## Conclusion

The logging system in Scenario Viewer is designed to provide deep technical insight while remaining flexible and easy to use. By understanding how to leverage its capabilities, you can effectively diagnose and solve issues in development and production environments.

For further assistance, please consult the source code or contact the development team.