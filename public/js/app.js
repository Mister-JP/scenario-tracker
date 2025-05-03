/**
 * Application Initialization and State Management
 */

// Application constants
const Constants = {
    // Available scenario numbers
    SCENARIOS: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    
    // Default card dimensions
    CARD_WIDTH: 350,
    CARD_HEIGHT: 250,
    
    // Grid layout settings
    GRID_GAP: 24,
    GRID_COLUMNS: 3,
    
    // Base iframe dimensions (for scaling)
    IFRAME_BASE_WIDTH: 1280,
    IFRAME_BASE_HEIGHT: 720,
    
    // Connector settings
    CONNECTOR_SNAP_DISTANCE: 24
  };
  
  // Global store (minimal state management)
  const store = {
    // Base URL for scenario iframes
    host: localStorage.getItem('svr-host') || 'http://localhost:8080',
    
    // Map of scenario IDs to card elements (populated during initialization)
    cards: new Map(),
    
    // Update host and refresh all iframes
    setHost(url) {
      // Remove trailing slash to avoid double slashes in final URL
      this.host = url.trim().replace(/\/$/, '');
      
      // Save to localStorage for persistence
      localStorage.setItem('svr-host', this.host);
      
      // Update all iframe sources
      this.cards.forEach((element, scenarioId) => {
        const iframe = element.querySelector('iframe');
        if (iframe) {
          iframe.src = `${this.host}?scenario=${scenarioId}`;
        }
      });
      
      // Update displayed host
      const hostValueElement = document.getElementById('host-value');
      if (hostValueElement) {
        hostValueElement.textContent = this.host;
      }
    }
  };
  
  /**
   * Clear, explicit application initialization
   */
  function initApp() {
    utils.log.info('App', 'Initializing Scenario Viewer application');
    
    // 1. Set up the workspace
    setupWorkspace();
    
    // 2. Set up the connection system
    setupConnectionSystem();
    
    // 3. Create header controls
    setupHeader();
    
    // 4. Load saved layout or create default cards
    const savedLayout = localStorage.getItem('scenario-layout');
    if (savedLayout) {
      loadLayout(JSON.parse(savedLayout));
    } else {
      createDefaultCards();
    }
    
    // 5. Set up global event listeners
    setupEventListeners();
    
    utils.log.info('App', 'Scenario Viewer initialized');
  }
  
  /**
   * Sets up the workspace container
   */
  function setupWorkspace() {
    utils.log.debug('App', 'Setting up workspace');
    
    // The workspace is already in the HTML (id="workspace")
    const workspace = document.getElementById('workspace');
    
    // Ensure workspace takes remaining height
    const headerHeight = utils.getHeaderOffset();
    workspace.style.height = `calc(100vh - ${headerHeight}px)`;
  }
  
  /**
   * Set up event handlers for global events
   */
  function setupEventListeners() {
    utils.log.debug('App', 'Setting up global event listeners');
    
    // Close modal on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay && modalOverlay.style.display !== 'none') {
          modalOverlay.style.display = 'none';
        }
      }
    });
    
    // Window resize handler (recalculate connections)
    window.addEventListener('resize', () => {
      utils.log.debug('App', 'Window resized');
      // Will be implemented in Phase 2
      updateConnections();
    });
  }
  
  // Run when the DOM is loaded
  document.addEventListener('DOMContentLoaded', initApp);