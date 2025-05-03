# Debugging Guide for Scenario Viewer

This document explains how to use the debugging system in the Scenario Viewer application.

## Overview

The Scenario Viewer includes a comprehensive logging system designed to help debug issues during development and troubleshoot problems in production. The system offers the following features:

- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Namespace-based logging to focus on specific components
- UI configuration panel to control logging at runtime
- Persistent settings via localStorage
- Formatted log output with timestamps and visual styling
- Performance optimizations to minimize impact when not needed

## Log Levels

The system supports the following log levels, in order of verbosity:

1. **DEBUG** - Detailed information for debugging purposes
2. **INFO** - General application flow and important events
3. **WARN** - Potentially problematic situations that don't prevent operation
4. **ERROR** - Error conditions that need attention
5. **NONE** - Special level used to disable logging entirely

By default, the system shows only WARN and ERROR messages to keep the console clean, but you can adjust this through the UI.

## Using the Debug Panel

The application includes a debug panel accessible through the "🐞 Debug" button in the top-right corner of the header. This panel allows you to:

- Set the global log level
- Configure log levels for specific components
- Toggle display of timestamps and namespaces
- Reset configuration to defaults
- Enable verbose debugging for all components

Changes made in this panel are saved in localStorage and persisted between sessions.

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

// Log messages at different levels
logger.debug("Detailed debugging information", { someObject: value });
logger.info("General information about application flow");
logger.warn("Warning about potential issues");
logger.error("Error information", error);

// Group related logs
logger.group("Operation Name");
logger.debug("Step 1");
logger.debug("Step 2");
logger.groupEnd();
```

## Best Practices

1. **Use appropriate log levels:**
   - DEBUG: Implementation details, variables, and flow
   - INFO: Important events and state changes
   - WARN: Problems that don't stop functionality
   - ERROR: Critical failures and exceptions

2. **Choose clear namespaces:** Use component or module names for namespaces (e.g., "Card", "ConnectorManager").

3. **Include context:** When logging objects or errors, include them as a second parameter rather than string concatenation.

4. **Use grouped logs:** For operations with multiple steps, use `group()` and `groupEnd()` to organize logs.

5. **Be concise but clear:** Log messages should be informative but not excessive.

## Performance Considerations

The logging system is designed to have minimal impact when logs are disabled. However, complex object parameters in disabled log messages can still cause performance issues. In performance-critical code, you can guard log creation:

```typescript
if (logger.isDebugEnabled()) {
  logger.debug("Expensive log message", calculateExpensiveObject());
}
```

## Troubleshooting Common Issues

If you're debugging a specific issue:

1. Enable DEBUG level for the relevant component(s)
2. Check the console for detailed logs
3. Look for warnings or errors
4. Use the "Enable All Debug" button for comprehensive logging
5. Check network requests and browser console for additional errors

## Example Debug Workflow

When troubleshooting a connection issue:

1. Click the "🐞 Debug" button in the header
2. Set "ConnectorManager" to DEBUG level
3. Try to reproduce the issue
4. Analyze the logs to see where the problem occurs
5. If needed, enable DEBUG for related components (Card, Store, etc.)

## Log Format

The default log format includes:

- Timestamp: [HH:MM:SS.mmm]
- Log level: INFO, DEBUG, etc. (color-coded)
- Namespace: [ComponentName]
- Message: Your log message
- Optional data: Objects, arrays, or errors

Example:
```
[12:34:56.789] DEBUG [ConnectorManager] Finding nearest endpoint to (120, 150)
```

## Saving Logs

For persistent issues, you can save logs from the browser console:

1. Right-click in the console
2. Select "Save as..." to create a log file
3. Share this file with the development team

## Storage and Clearing

Logger configuration is stored in localStorage under the key `scenario-viewer-logger-config`. You can reset to defaults using the "Reset to Defaults" button in the Debug panel, or by clearing localStorage.