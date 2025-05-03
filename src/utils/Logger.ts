/**
 * Logger Module
 * 
 * A flexible debugging and logging system for the Scenario Viewer application.
 * Features:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Namespace support for component-specific logging
 * - Toggle functionality (global and per-namespace)
 * - Timestamp and formatted output
 * - Storage of preferences in localStorage
 */

/**
 * Log levels in order of verbosity
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4, // Special level used to disable logging
  }
  
  /**
   * Log level display properties
   */
  interface LogLevelProps {
    label: string;
    color: string;
    consoleMethod: 'debug' | 'info' | 'warn' | 'error' | 'log';
  }
  
  /**
   * Display properties for each log level
   */
  const LOG_LEVEL_PROPS: Record<LogLevel, LogLevelProps> = {
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
  }
  
  /**
   * Default logger configuration
   */
  const DEFAULT_CONFIG: LoggerConfig = {
    globalLevel: LogLevel.WARN, // Show only warnings and errors by default
    namespaceLevels: {},
    showTimestamps: true,
    showNamespace: true,
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
     */
    private getEffectiveLevel(): LogLevel {
      // Check for namespace-specific level override
      const namespaceLevel = Logger.config.namespaceLevels[this.namespace];
      return namespaceLevel !== undefined ? namespaceLevel : Logger.config.globalLevel;
    }
  
    /**
     * Formats the log message with timestamp and namespace
     * @param level - Log level
     * @param args - Arguments to log
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
      const prefix = this.formatLogPrefix(level);
      
      // Use appropriate console method with styling
      console[props.consoleMethod](
        prefix,
        `color: ${props.color}; font-weight: bold`,
        'color: inherit',
        ...args
      );
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
    public group(label: string, expanded = false): void {
      if (this.getEffectiveLevel() <= LogLevel.DEBUG) {
        if (expanded) {
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
     * Enables detailed logging for a specific namespace
     * @param namespace - Namespace to enable debug logging for
     */
    public static enableDebug(namespace: string): void {
      Logger.setNamespaceLevel(namespace, LogLevel.DEBUG);
    }
  
    /**
     * Disables logging for a specific namespace
     * @param namespace - Namespace to disable logging for
     */
    public static disableLogging(namespace: string): void {
      Logger.setNamespaceLevel(namespace, LogLevel.NONE);
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