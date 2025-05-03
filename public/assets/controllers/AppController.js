/**
 * Main application controller
 * Coordinates initialization and orchestrates other controllers
 * @module controllers/AppController
 */
import { StorageConfig } from '../core/Config.js';
import { logger } from '../utils/Logger.js';

export default class AppController {
  /**
   * Create main application controller
   * @param {StateManager} stateManager - Application state manager
   * @param {EventBus} eventBus - Application event bus
   * @param {DOMRenderer} renderer - DOM renderer
   * @param {CardController} cardController - Card controller
   * @param {ConnectionController} connectionController - Connection controller
   * @param {LayoutController} layoutController - Layout controller
   */
  constructor(stateManager, eventBus, renderer, cardController, connectionController, layoutController) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.renderer = renderer;
    this.cardController = cardController;
    this.connectionController = connectionController;
    this.layoutController = layoutController;
  }

  /**
   * Initialize the application
   */
  /**
 * Initialize the application
 */
  initializeApplication() {
    logger.info('App', 'Initializing Scenario Viewer application');
    
    // Initialize renderer first
    this.renderer.initialize();
    
    // Initialize state with saved host
    const savedHost = localStorage.getItem(StorageConfig.HOST_KEY) || 'http://localhost:8080';
    this.stateManager.setState('host', savedHost);
    this.renderer.updateText(this.renderer._elements.hostValue, savedHost);
    
    // Set up global event listeners
    this._setupGlobalEvents();
    
    // Initialize controllers
    // Note: these controllers should wait for 'dom:initialized' event before accessing DOM
    this.connectionController.initialize();
    this.layoutController.initialize();
    
    logger.info('App', 'Scenario Viewer initialized');
  }

  /**
   * Set up global event listeners
   * @private
   */
  _setupGlobalEvents() {
    // Global escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.renderer.hideDialog();
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
      this.renderer.updateWorkspaceHeight();
      this.eventBus.emit('connections:update');
    });
  }
}