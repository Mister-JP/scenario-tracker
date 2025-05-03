/**
 * Core state management for the application
 */

/**
 * Application constants
 */
export const Constants = {
    /**
     * Available scenario numbers
     */
    SCENARIOS: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    
    /**
     * Default card width
     */
    CARD_WIDTH: 350,
    
    /**
     * Default card height
     */
    CARD_HEIGHT: 250,
    
    /**
     * Gap between cards in grid layout
     */
    GRID_GAP: 24,
    
    /**
     * Number of columns in the grid layout
     */
    GRID_COLUMNS: 3,
    
    /**
     * Base width of the iframe content (for scaling)
     */
    IFRAME_BASE_WIDTH: 1280,
    
    /**
     * Base height of the iframe content (for scaling)
     */
    IFRAME_BASE_HEIGHT: 720,
    
    /**
     * Snap distance for connector endpoints (in pixels)
     */
    CONNECTOR_SNAP_DISTANCE: 24
  };
  
  /**
   * Global application state store
   */
  class Store {
    /**
     * Base URL for scenario iframes
     * Persisted in localStorage
     */
    public host: string;
    
    /**
     * Map of scenario numbers to their DOM elements
     */
    public cards: Map<number, HTMLElement>;
  
    /**
     * Constructor
     * Initializes state and loads saved host from localStorage
     */
    constructor() {
      this.host = localStorage.getItem("svr-host") ?? "http://localhost:8080";
      this.cards = new Map();
    }
  
    /**
     * Updates the host URL and refreshes all iframes
     * @param url - New host URL
     */
    public setHost(url: string): void {
      // Remove trailing slash to avoid double slashes in final URL
      this.host = url.trim().replace(/\/$/, "");
      
      // Save to localStorage for persistence
      localStorage.setItem("svr-host", this.host);
      
      // Update all iframe sources
      this.cards.forEach((element, scenarioId) => {
        const iframe = element.querySelector("iframe");
        if (iframe) {
          iframe.src = `${this.host}?scenario=${scenarioId}`;
        }
      });
    }
  }
  
  /**
   * Singleton instance of the store
   * Exported for use throughout the application
   */
  export const store = new Store();