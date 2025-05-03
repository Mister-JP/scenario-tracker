/**
 * Logger Module
 * 
 * A comprehensive debugging and logging system for the Scenario Viewer application.
 * 
 * Features:
 * - Multiple log levels (TRACE, DEBUG, INFO, WARN, ERROR)
 * - Namespace support for component-specific logging
 * - Toggle functionality (global and per-namespace)
 * - Timestamp and formatted output
 * - Storage of preferences in localStorage
 * - Log filtering by namespace patterns
 * - Log bucketing to reduce high-frequency logs
 * - Performance measurement utilities
 * - Context tracking across function calls
 * - Log retention and export capabilities
 * - Conditional logging with guard methods
 */

/**
 * Log levels in order of verbosity
 */
export enum LogLevel {
    TRACE = 0,     // Most detailed information for deep debugging
    DEBUG = 1,     // Diagnostic information for development
    INFO = 2,      // General operational information
    WARN = 3,      // Potentially problematic situations
    ERROR = 4,     // Error conditions
    NONE = 5,      // Special level used to disable logging
  }
  
  /**
   * Log level display properties
   */
  interface LogLevelProps {
    label: string;
    color: string;
    consoleMethod: 'debug' | 'info' | 'warn' | 'error' | 'log' | 'trace';
  }
  
  /**
   * Display properties for each log level
   */
  const LOG_LEVEL_PROPS: Record<LogLevel, LogLevelProps> = {
    [LogLevel.TRACE]: {
      label: 'TRACE',
      color: '#B39DDB', // Light purple
      consoleMethod: 'debug',
    },
    [LogLevel.DEBUG]: {
      label: 'DEBUG',
      color: '#7986CB', // Light indigo
      consoleMethod: 'debug',
    },
    [LogLevel.INFO]: {
      label: 'INFO',
      color: '#66BB6A', // Light green
      consoleMethod: 'info',
    },
    [LogLevel.WARN]: {
      label: 'WARN',
      color: '#FFCA28', // Amber
      consoleMethod: 'warn',
    },
    [LogLevel.ERROR]: {
      label: 'ERROR',
      color: '#EF5350', // Light red
      consoleMethod: 'error',
    },
    [LogLevel.NONE]: {
      label: 'NONE',
      color: '#9E9E9E', // Grey
      consoleMethod: 'log',
    },
  };
  
  /**
   * Type for log entry data
   */
  export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    namespace: string;
    message: string;
    data?: any;
  }
  
  /**
   * Interface for logger configuration
   */
  export interface LoggerConfig {
    /** Global minimum log level */
    globalLevel: LogLevel;
    /** Minimum log levels by namespace */
    namespaceLevels: Record<string, LogLevel>;
    /** Whether to show timestamps */
    showTimestamps: boolean;
    /** Whether to show namespace */
    showNamespace: boolean;
    /** Maximum number of entries to retain in memory */
    maxLogEntries: number;
    /** Enable log bucketing for high-frequency logs */
    enableBucketing: boolean;
    /** Bucket interval in milliseconds */
    bucketInterval: number;
    /** Whether to include data objects in retained logs */
    retainDataObjects: boolean;
    /** Optional filter pattern for namespace filtering */
    namespaceFilter?: string;
  }
  
  /**
   * Default logger configuration
   */
  const DEFAULT_CONFIG: LoggerConfig = {
    globalLevel: LogLevel.WARN, // Show only warnings and errors by default
    namespaceLevels: {},
    showTimestamps: true,
    showNamespace: true,
    maxLogEntries: 1000,
    enableBucketing: true,
    bucketInterval: 1000, // 1 second bucketing
    retainDataObjects: false,
  };
  
  /**
   * Storage key for logger configuration in localStorage
   */
  const STORAGE_KEY = 'scenario-viewer-logger-config';
  
  /**
   * Logger class for handling debug logs
   */
  export class Logger {
    /** The namespace this logger instance belongs to */
    private namespace: string;
    
    /** Shared configuration for all logger instances */
    private static config: LoggerConfig = DEFAULT_CONFIG;
    
    /** Whether the configuration has been loaded from storage */
    private static configLoaded = false;
  
    /** In-memory storage of recent log entries for review */
    private static logHistory: LogEntry[] = [];
  
    /** Map to track buckets for high-frequency logs */
    private static buckets: Map<string, {
      count: number;
      level: LogLevel;
      lastMessage: string;
      lastTime: number;
      data?: any;
    }> = new Map();
  
    /** Map to store performance measurement start times */
    private static performanceMarks: Map<string, number> = new Map();
  
    /** Map to store performance spans */
    private static performanceSpans: Map<string, { total: number, count: number }> = new Map();
  
    /** Contextual data for this logger instance */
    private context: Record<string, any> = {};
  
    /**
     * Creates a new logger for a specific namespace
     * @param namespace - Identifier for the component or module
     */
    constructor(namespace: string) {
      this.namespace = namespace;
      
      // Load config from storage on first use
      if (!Logger.configLoaded) {
        Logger.loadConfig();
      }
    }
  
    /**
     * Loads logger configuration from localStorage
     */
    private static loadConfig(): void {
      try {
        const storedConfig = localStorage.getItem(STORAGE_KEY);
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          
          // Validate and merge with defaults
          Logger.config = {
            ...DEFAULT_CONFIG,
            ...parsedConfig,
            // Handle nested objects
            namespaceLevels: {
              ...DEFAULT_CONFIG.namespaceLevels,
              ...(parsedConfig.namespaceLevels || {}),
            },
          };
        }
      } catch (error) {
        // Fallback to default config if loading fails
        console.error('Failed to load logger config from localStorage', error);
        Logger.config = { ...DEFAULT_CONFIG };
      }
      
      Logger.configLoaded = true;
    }
  
    /**
     * Saves current configuration to localStorage
     */
    private static saveConfig(): void {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Logger.config));
      } catch (error) {
        console.error('Failed to save logger config to localStorage', error);
      }
    }
  
    /**
     * Gets the effective log level for this namespace
     * Considers namespace-specific overrides and pattern-based filtering
     */
    private getEffectiveLevel(): LogLevel {
      // Check if this namespace matches the filter pattern
      if (Logger.config.namespaceFilter) {
        const pattern = new RegExp(Logger.config.namespaceFilter);
        if (!pattern.test(this.namespace)) {
          return LogLevel.NONE; // Skip non-matching namespaces
        }
      }
      
      // Check for namespace-specific level override
      const namespaceLevel = Logger.config.namespaceLevels[this.namespace];
      return namespaceLevel !== undefined ? namespaceLevel : Logger.config.globalLevel;
    }
  
    /**
     * Formats the log message with timestamp and namespace
     * @param level - Log level
     * @returns Formatted prefix for the log message
     */
    private formatLogPrefix(level: LogLevel): string {
      const props = LOG_LEVEL_PROPS[level];
      let prefix = '';
      
      // Add timestamp if enabled
      if (Logger.config.showTimestamps) {
        const now = new Date();
        const timeStr = now.toISOString().substring(11, 23); // HH:MM:SS.mmm format
        prefix += `[${timeStr}] `;
      }
      
      // Add log level
      prefix += `%c${props.label}%c `;
      
      // Add namespace if enabled
      if (Logger.config.showNamespace) {
        prefix += `[${this.namespace}] `;
      }
      
      return prefix;
    }
  
    /**
     * Checks if a message should be bucketed (for high-frequency logs)
     * @param level - Log level
     * @param message - Log message
     * @param data - Optional data
     * @returns Object with isBucketed flag and key if bucketed
     */
    private checkBucketing(level: LogLevel, message: string, data?: any): { isBucketed: boolean, key?: string } {
      // Skip bucketing if disabled or for ERROR level
      if (!Logger.config.enableBucketing || level >= LogLevel.ERROR) {
        return { isBucketed: false };
      }
  
      // Create a bucket key from namespace and message
      // This ensures similar log messages are grouped together
      const key = `${this.namespace}:${message}`;
      const now = Date.now();
      
      // Check if this message is already in a bucket
      const bucket = Logger.buckets.get(key);
      if (bucket && (now - bucket.lastTime) < Logger.config.bucketInterval) {
        // Update bucket count and last seen time
        bucket.count++;
        bucket.lastTime = now;
        bucket.data = data; // Keep most recent data
        return { isBucketed: true, key };
      }
      
      // Create a new bucket
      Logger.buckets.set(key, {
        count: 1,
        level,
        lastMessage: message,
        lastTime: now,
        data
      });
      
      return { isBucketed: false, key };
    }
  
    /**
     * Core logging method
     * @param level - Log level
     * @param args - Arguments to log
     */
    private log(level: LogLevel, ...args: any[]): void {
      // Skip if log level is not high enough
      if (level < this.getEffectiveLevel()) {
        return;
      }
      
      const props = LOG_LEVEL_PROPS[level];
      const message = typeof args[0] === 'string' ? args[0] : '';
      const data = args.length > 1 ? args[1] : undefined;
      
      // Check if this should be bucketed
      const { isBucketed, key } = this.checkBucketing(level, message, data);
      if (isBucketed && key) {
        // Skip output for bucketed logs (will be flushed later)
        return;
      }
      
      // Add context data if available
      const allData = (Object.keys(this.context).length > 0 && data) 
        ? { ...this.context, ...data }
        : data || this.context;
      
      const prefix = this.formatLogPrefix(level);
      const consoleArgs = [
        prefix,
        `color: ${props.color}; font-weight: bold`,
        'color: inherit',
        message
      ];
      
      // Add data as a separate argument if present
      if (allData !== undefined) {
        consoleArgs.push(allData);
      }
      
      // Use appropriate console method with styling
      console[props.consoleMethod](...consoleArgs);
      
      // Store in history if needed
      this.storeLogEntry(level, message, allData);
    }
  
    /**
     * Stores a log entry in the history
     * @param level - Log level
     * @param message - Log message
     * @param data - Optional data
     */
    private storeLogEntry(level: LogLevel, message: string, data?: any): void {
      // Create log entry
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        namespace: this.namespace,
        message,
        // Only include data if configured to do so
        data: Logger.config.retainDataObjects ? data : undefined
      };
      
      // Add to history
      Logger.logHistory.push(entry);
      
      // Trim history if needed
      if (Logger.logHistory.length > Logger.config.maxLogEntries) {
        Logger.logHistory.shift();
      }
    }
  
    /**
     * Flushes any bucketed logs
     * Should be called periodically or before application shutdown
     */
    public static flushBuckets(): void {
      const now = Date.now();
      
      Logger.buckets.forEach((bucket, key) => {
        // Skip recent buckets (less than interval)
        if ((now - bucket.lastTime) < Logger.config.bucketInterval) {
          return;
        }
        
        // Skip single-count buckets (no need for special treatment)
        if (bucket.count <= 1) {
          Logger.buckets.delete(key);
          return;
        }
        
        // Extract namespace from key
        const namespace = key.split(':')[0];
        const logger = new Logger(namespace);
        const effectiveLevel = logger.getEffectiveLevel();
        
        // Skip if level wouldn't be logged anyway
        if (bucket.level < effectiveLevel) {
          Logger.buckets.delete(key);
          return;
        }
        
        // Log the bucketed message with count
        const props = LOG_LEVEL_PROPS[bucket.level];
        const prefix = logger.formatLogPrefix(bucket.level);
        
        console[props.consoleMethod](
          prefix,
          `color: ${props.color}; font-weight: bold`,
          'color: inherit',
          `${bucket.lastMessage} (repeated ${bucket.count} times)`,
          bucket.data
        );
        
        // Store in history
        logger.storeLogEntry(
          bucket.level,
          `${bucket.lastMessage} (repeated ${bucket.count} times)`,
          bucket.data
        );
        
        // Remove from buckets
        Logger.buckets.delete(key);
      });
    }
  
    /**
     * Logs a trace message (most detailed)
     * @param args - Arguments to log
     */
    public trace(...args: any[]): void {
      this.log(LogLevel.TRACE, ...args);
    }
  
    /**
     * Logs a debug message
     * @param args - Arguments to log
     */
    public debug(...args: any[]): void {
      this.log(LogLevel.DEBUG, ...args);
    }
  
    /**
     * Logs an info message
     * @param args - Arguments to log
     */
    public info(...args: any[]): void {
      this.log(LogLevel.INFO, ...args);
    }
  
    /**
     * Logs a warning message
     * @param args - Arguments to log
     */
    public warn(...args: any[]): void {
      this.log(LogLevel.WARN, ...args);
    }
  
    /**
     * Logs an error message
     * @param args - Arguments to log
     */
    public error(...args: any[]): void {
      this.log(LogLevel.ERROR, ...args);
    }
  
    /**
     * Creates a group in the console
     * @param label - Group label
     * @param expanded - Whether the group should be expanded by default
     */
    public group(label: string, expanded = true): void {
      if (this.getEffectiveLevel() <= LogLevel.DEBUG) {
        if (!expanded) {
          console.groupCollapsed(`[${this.namespace}] ${label}`);
        } else {
          console.group(`[${this.namespace}] ${label}`);
        }
      }
    }
  
    /**
     * Ends the current group in the console
     */
    public groupEnd(): void {
      if (this.getEffectiveLevel() <= LogLevel.DEBUG) {
        console.groupEnd();
      }
    }
  
    /**
     * Checks if debug level is enabled for this logger
     * Useful for avoiding expensive log message creation
     * @returns true if debug level is enabled
     */
    public isDebugEnabled(): boolean {
      return this.getEffectiveLevel() <= LogLevel.DEBUG;
    }
  
    /**
     * Checks if trace level is enabled for this logger
     * @returns true if trace level is enabled
     */
    public isTraceEnabled(): boolean {
      return this.getEffectiveLevel() <= LogLevel.TRACE;
    }
  
    /**
     * Sets a context value that will be included with all log messages
     * @param key - Context key
     * @param value - Context value
     */
    public setContext(key: string, value: any): void {
      this.context[key] = value;
    }
  
    /**
     * Gets a context value
     * @param key - Context key
     * @returns The context value or undefined
     */
    public getContext(key: string): any {
      return this.context[key];
    }
  
    /**
     * Clears a specific context value
     * @param key - Context key to clear
     */
    public clearContext(key: string): void {
      delete this.context[key];
    }
  
    /**
     * Clears all context values
     */
    public clearAllContext(): void {
      this.context = {};
    }
  
    /**
     * Starts a performance measurement
     * @param label - Identifier for the measurement
     */
    public startPerformanceMeasurement(label: string): void {
        try {
          if (this.isDebugEnabled()) {
            const key = `${this.namespace}:${label}`;
            // Check if there's already a mark with this name
            if (Logger.performanceMarks.has(key)) {
              this.warn(`⏱️ Overwriting existing performance mark: ${label}`);
            }
            Logger.performanceMarks.set(key, performance.now());
            this.debug(`⏱️ Starting measurement: ${label}`);
          }
        } catch (error) {
          this.error(`Failed to start performance measurement for ${label}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
  
    /**
     * Ends a performance measurement and logs the result
     * @param label - Identifier for the measurement
     * @param logLevel - Level to log the result at (defaults to DEBUG)
     * @returns The elapsed time in milliseconds
     */
    public endPerformanceMeasurement(label: string, logLevel = LogLevel.DEBUG): number {
        try {
        const key = `${this.namespace}:${label}`;
        const startTime = Logger.performanceMarks.get(key);
        
        if (startTime === undefined) {
            this.warn(`⏱️ No matching start mark found for: ${label}`);
            return 0;
        }
        
        const endTime = performance.now();
        const elapsed = Math.max(0, endTime - startTime); // Ensure non-negative
        
        // Store in spans for average calculation
        const spanKey = key;
        const span = Logger.performanceSpans.get(spanKey) || { total: 0, count: 0 };
        span.total += elapsed;
        span.count++;
        Logger.performanceSpans.set(spanKey, span);
        
        // Log the result if appropriate level
        if (this.getEffectiveLevel() <= logLevel) {
            const avg = (span.total / span.count).toFixed(2);
            this.log(logLevel, `⏱️ ${label} completed in ${elapsed.toFixed(2)}ms (avg: ${avg}ms)`);
        }
        
        // Clean up
        Logger.performanceMarks.delete(key);
        
        return elapsed;
        } catch (error) {
        this.error(`Failed to end performance measurement for ${label}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return 0;
        }
    }
  
    /**
     * Tracks a function call with automatic performance measurement
     * @param label - Label for the function
     * @param fn - Function to track
     * @param logLevel - Log level for the result
     * @returns The function result
     */
    public trackFunction<T>(label: string, fn: () => T, logLevel = LogLevel.DEBUG): T {
        try {
        this.startPerformanceMeasurement(label);
        try {
            const result = fn();
            this.endPerformanceMeasurement(label, logLevel);
            return result;
        } catch (error) {
            this.endPerformanceMeasurement(label, LogLevel.ERROR);
            this.error(`Error in ${label}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
        } catch (error) {
        // This is a safety net in case the performance tracking itself fails
        this.error(`Performance tracking failed for ${label}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        
        // Still try to execute the function
        return fn();
        }
    }
  
    /**
     * Tracks an async function call with automatic performance measurement
     * @param label - Label for the function
     * @param fn - Async function to track
     * @param logLevel - Log level for the result
     * @returns A promise resolving to the function result
     */
    public async trackAsyncFunction<T>(
        label: string, 
        fn: () => Promise<T>, 
        logLevel = LogLevel.DEBUG
    ): Promise<T> {
        try {
        this.startPerformanceMeasurement(label);
        try {
            const result = await fn();
            this.endPerformanceMeasurement(label, logLevel);
            return result;
        } catch (error) {
            this.endPerformanceMeasurement(label, LogLevel.ERROR);
            this.error(`Error in async ${label}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
        } catch (error) {
        // This is a safety net in case the performance tracking itself fails
        this.error(`Async performance tracking failed for ${label}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        
        // Still try to execute the function
        return await fn();
        }
    }
  
    /**
     * Sets the global minimum log level
     * @param level - New global log level
     */
    public static setGlobalLevel(level: LogLevel): void {
      Logger.config.globalLevel = level;
      Logger.saveConfig();
    }
  
    /**
     * Sets the log level for a specific namespace
     * @param namespace - Namespace to configure
     * @param level - New log level for the namespace
     */
    public static setNamespaceLevel(namespace: string, level: LogLevel): void {
      Logger.config.namespaceLevels[namespace] = level;
      Logger.saveConfig();
    }
  
    /**
     * Resets the log level for a specific namespace (removes override)
     * @param namespace - Namespace to reset
     */
    public static resetNamespaceLevel(namespace: string): void {
      delete Logger.config.namespaceLevels[namespace];
      Logger.saveConfig();
    }
  
    /**
     * Gets the current log history
     * @returns Array of log entries
     */
    public static getLogHistory(): LogEntry[] {
      return [...Logger.logHistory];
    }
  
    /**
     * Clears the log history
     */
    public static clearLogHistory(): void {
      Logger.logHistory = [];
    }
  
    /**
     * Exports the log history to a string
     * @param format - Output format ('json' or 'text')
     * @returns Formatted log history
     */
    public static exportLogHistory(format: 'json' | 'text' = 'json'): string {
      // Flush any pending bucketed logs first
      Logger.flushBuckets();
      
      if (format === 'json') {
        return JSON.stringify(Logger.logHistory, null, 2);
      } else {
        // Text format
        return Logger.logHistory.map(entry => {
          const time = entry.timestamp.toISOString();
          const level = LogLevel[entry.level].padEnd(5);
          const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
          return `${time} ${level} [${entry.namespace}] ${entry.message}${data}`;
        }).join('\n');
      }
    }
  
    /**
     * Downloads the log history as a file
     * @param format - Output format ('json' or 'text')
     * @param filename - Base filename (without extension)
     */
    public static downloadLogHistory(
      format: 'json' | 'text' = 'json',
      filename = `scenario-viewer-logs-${new Date().toISOString().slice(0, 10)}`
    ): void {
      const content = Logger.exportLogHistory(format);
      const extension = format === 'json' ? 'json' : 'log';
      const blob = new Blob([content], { type: 'text/plain' });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  
    /**
     * Sets a namespace filter pattern
     * @param pattern - Regex pattern string or undefined to clear
     */
    public static setNamespaceFilter(pattern?: string): void {
      Logger.config.namespaceFilter = pattern;
      Logger.saveConfig();
    }
  
    /**
     * Updates logger configuration
     * @param config - Partial configuration to merge with current config
     */
    public static updateConfig(config: Partial<LoggerConfig>): void {
      Logger.config = {
        ...Logger.config,
        ...config,
        // Handle nested objects
        namespaceLevels: {
          ...Logger.config.namespaceLevels,
          ...(config.namespaceLevels || {}),
        },
      };
      Logger.saveConfig();
    }
  
    /**
     * Gets the current logger configuration
     * @returns Current configuration
     */
    public static getConfig(): LoggerConfig {
      return { ...Logger.config };
    }
  
    /**
     * Resets logger configuration to defaults
     */
    public static resetConfig(): void {
      Logger.config = { ...DEFAULT_CONFIG };
      Logger.saveConfig();
    }
  }
  
  /**
   * Creates a logger for a specific namespace
   * @param namespace - Namespace for the logger
   * @returns A logger instance
   */
  export function createLogger(namespace: string): Logger {
    return new Logger(namespace);
  }
  
  // Set up a periodic flush of bucketed logs
  setInterval(() => {
    Logger.flushBuckets();
  }, 10000); // Every 10 seconds
  
  // Flush logs on window unload to catch final logs
  window.addEventListener('beforeunload', () => {
    Logger.flushBuckets();
  });
  
  // Expose logger to console for debugging
  (window as any).__scenarioLogger = Logger;