/**
 * Application entry point
 * Initializes all components and starts the application
 */
import StateManager from './core/StateManager.js';
import EventBus from './core/EventBus.js';
import DOMRenderer from './views/DOMRenderer.js';
import SVGRenderer from './views/SVGRenderer.js';
import CardController from './controllers/CardController.js';
import ConnectionController from './controllers/ConnectionController.js';
import LayoutController from './controllers/LayoutController.js';
import AppController from './controllers/AppController.js';
import { logger } from './utils/Logger.js';

/**
 * Initialize the application
 * Creates core components and starts the application
 */
function initializeApplication() {
  // Make sure DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
  
  function initApp() {
    logger.info('App', 'Initializing Scenario Viewer application');
    
    // Create core components
    const stateManager = new StateManager({
      host: localStorage.getItem('svr-host') || 'http://localhost:8080',
      cards: {},
      connections: {}
    });
    const eventBus = new EventBus();
    
    // Make eventBus globally available for components that need it during initialization
    window.eventBus = eventBus;
    
    const domRenderer = new DOMRenderer();
    const svgRenderer = new SVGRenderer();
    
    // Create controllers
    const cardController = new CardController(stateManager, eventBus, domRenderer);
    const connectionController = new ConnectionController(stateManager, eventBus, domRenderer, svgRenderer);
    const layoutController = new LayoutController(
      stateManager, eventBus, domRenderer, cardController, connectionController
    );
    
    // Create main application controller
    const appController = new AppController(
      stateManager, eventBus, domRenderer, cardController, connectionController, layoutController
    );
    
    // Start the application
    appController.initializeApplication();
  }
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApplication);