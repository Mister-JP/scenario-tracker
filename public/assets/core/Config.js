/**
 * Application configuration constants organized by domain
 * @module core/Config
 */

/**
 * Card-related configuration
 */
export const CardConfig = {
    DEFAULT_WIDTH: 350,
    DEFAULT_HEIGHT: 250,
    MIN_WIDTH: 200,
    MIN_HEIGHT: 150
  };
  
  /**
   * Grid layout configuration
   */
  export const GridConfig = {
    GAP: 24,
    COLUMNS: 3
  };
  
  /**
   * Iframe configuration
   */
  export const IframeConfig = {
    BASE_WIDTH: 1280,
    BASE_HEIGHT: 720
  };
  
  /**
   * Connection system configuration
   */
  export const ConnectorConfig = {
    SNAP_DISTANCE: 24,
    LINE_COLOR: '#444',
    LINE_WIDTH: 2,
    ARROW_SIZE: {
      WIDTH: 10,
      HEIGHT: 7
    }
  };
  
  /**
   * Scenario configuration
   */
  export const ScenarioConfig = {
    IDS: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  };
  
  /**
   * Storage keys
   */
  export const StorageConfig = {
    HOST_KEY: 'svr-host',
    LAYOUT_KEY: 'scenario-layout',
    LOG_LEVEL_KEY: 'log-level'
  };