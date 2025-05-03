/**
 * Simple logger with configurable level
 * @module utils/Logger
 */
import { StorageConfig } from '../core/Config.js';

class Logger {
  /**
   * Create a logger
   * @param {string} [defaultLevel='warn'] - Default log level
   */
  constructor(defaultLevel = 'warn') {
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.level = localStorage.getItem(StorageConfig.LOG_LEVEL_KEY) || defaultLevel;
  }

  /**
   * Log a debug message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  debug(component, message, data) {
    if (this.levels[this.level] <= this.levels.debug) {
      console.debug(`[${component}]`, message, data || '');
    }
  }

  /**
   * Log an info message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  info(component, message, data) {
    if (this.levels[this.level] <= this.levels.info) {
      console.info(`[${component}]`, message, data || '');
    }
  }

  /**
   * Log a warning message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  warn(component, message, data) {
    if (this.levels[this.level] <= this.levels.warn) {
      console.warn(`[${component}]`, message, data || '');
    }
  }

  /**
   * Log an error message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  error(component, message, data) {
    if (this.levels[this.level] <= this.levels.error) {
      console.error(`[${component}]`, message, data || '');
    }
  }

  /**
   * Change log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
      localStorage.setItem(StorageConfig.LOG_LEVEL_KEY, level);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();