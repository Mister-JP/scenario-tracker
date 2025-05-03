/**
 * Layout controller for managing layout persistence
 * @module controllers/LayoutController
 */
import { StorageConfig } from '../core/Config.js';
import { logger } from '../utils/Logger.js';

export default class LayoutController {
  /**
   * Create a layout controller
   * @param {StateManager} stateManager - Application state manager
   * @param {EventBus} eventBus - Application event bus
   * @param {DOMRenderer} renderer - DOM renderer
   * @param {CardController} cardController - Card controller
   * @param {ConnectionController} connectionController - Connection controller
   */
  constructor(stateManager, eventBus, renderer, cardController, connectionController) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.renderer = renderer;
    this.cardController = cardController;
    this.connectionController = connectionController;
  }

  /**
   * Initialize layout management
   */
  initialize() {
    logger.debug('Layout', 'Setting up layout management');
    
    // Set up UI handlers
    this._setupUIHandlers();
    
    // Load saved layout or create default
    const savedLayout = localStorage.getItem(StorageConfig.LAYOUT_KEY);
    if (savedLayout) {
      try {
        this.deserializeAndApplyLayout(JSON.parse(savedLayout));
      } catch (error) {
        logger.error('Layout', 'Failed to load saved layout', { error });
        this.cardController.createDefaultCards();
      }
    } else {
      this.cardController.createDefaultCards();
    }
  }

  /**
   * Set up UI handlers for layout management
   * @private
   */
  _setupUIHandlers() {
    // Get DOM elements
    const editHostButton = document.getElementById('edit-host');
    const saveButton = document.getElementById('save-layout-btn');
    const loadButton = document.getElementById('load-layout-btn');
    const resetButton = document.getElementById('reset-layout-btn');
    const fileInput = document.getElementById('file-input');
    
    // Check if elements exist before adding event listeners
    if (editHostButton) {
      editHostButton.addEventListener('click', this._handleEditHost.bind(this));
    }
    
    if (saveButton) {
      saveButton.addEventListener('click', this._handleSaveLayout.bind(this));
    }
    
    if (loadButton && fileInput) {
      loadButton.addEventListener('click', () => {
        fileInput.click();
      });
    }
    
    if (fileInput) {
      fileInput.addEventListener('change', this._handleFileUpload.bind(this));
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', this._handleResetLayout.bind(this));
    } else {
      logger.warn('Layout', 'Reset button not found in DOM');
    }
  }

  /**
   * Handle edit host button click
   * @private
   */
  _handleEditHost() {
    const currentHost = this.stateManager.getState('host');
    const newHost = prompt('Enter tracking host URL:', currentHost);
    
    if (newHost && newHost !== currentHost) {
      // Update host in state
      const cleanHost = newHost.trim().replace(/\/$/, '');
      this.stateManager.setState('host', cleanHost);
      
      // Update localStorage
      localStorage.setItem(StorageConfig.HOST_KEY, cleanHost);
      
      // Update UI
      this.renderer.updateText('host-value', cleanHost);
      
      // Update all iframe sources
      this._updateAllIframeSources(cleanHost);
    }
  }

  /**
   * Update all iframe sources with new host
   * @param {string} host - New host URL
   * @private
   */
  _updateAllIframeSources(host) {
    const cards = this.stateManager.getState('cards');
    if (!cards) return;
    
    Object.keys(cards).forEach(id => {
      const iframe = document.querySelector(`.card[data-scenario="${id}"] iframe`);
      if (iframe) {
        iframe.src = `${host}?scenario=${id}`;
      }
    });
  }

  /**
   * Handle save layout button click
   * @private
   */
  _handleSaveLayout() {
    const defaultName = new Date().toISOString().split('T')[0];
    const fileName = prompt('Save layout as:', defaultName) || 'layout';
    this.saveLayoutToFile(fileName);
  }

  /**
   * Handle file upload for layout loading
   * @param {Event} e - Change event
   * @private
   */
  _handleFileUpload(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const layoutData = JSON.parse(event.target.result);
          this.deserializeAndApplyLayout(layoutData);
        } catch (error) {
          logger.error('Layout', 'Failed to parse layout file', { error });
          alert('Invalid layout file format');
        }
      };
      
      reader.readAsText(file);
      e.target.value = ''; // Reset input
    }
  }

  /**
   * Handle reset layout button click
   * @private
   */
  _handleResetLayout() {
    this.resetLayout();
  }

  /**
   * Reset cards to a grid layout
   */
  resetLayout() {
    logger.info('Layout', 'Resetting to grid layout');
    
    // Clear existing connections
    this.connectionController.removeAllConnectionsFromModelAndDom();
    
    // Remove existing cards from DOM and state
    const cards = this.stateManager.getState('cards');
    if (cards) {
      Object.keys(cards).forEach(id => {
        const cardElement = document.querySelector(`.card[data-scenario="${id}"]`);
        if (cardElement) cardElement.remove();
      });
      
      this.stateManager.setState('cards', {});
    }
    
    // Create default cards
    this.cardController.createDefaultCards();
  }

  /**
   * Save layout to a JSON file
   * @param {string} fileName - File name without extension
   */
  saveLayoutToFile(fileName) {
    logger.info('Layout', 'Saving layout to file', { fileName });
    
    // Get layout data
    const layout = this.serializeLayout();
    
    // Create Blob
    const blob = new Blob([layout], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    a.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Create a JSON representation of the current layout
   * @returns {string} JSON string
   */
  serializeLayout() {
    logger.debug('Layout', 'Creating layout snapshot');
    
    // Get card data
    const cards = [];
    const cardModels = this.stateManager.getState('cards');
    
    if (cardModels) {
      Object.entries(cardModels).forEach(([id, card]) => {
        cards.push({
          id: parseInt(id, 10),
          x: card.x,
          y: card.y,
          width: card.width,
          height: card.height
        });
      });
    }
    
    // Get connection data
    const connections = [];
    const connectionModels = this.stateManager.getState('connections');
    
    if (connectionModels) {
      Object.values(connectionModels).forEach(conn => {
        connections.push({
          fromId: conn.fromCardId,
          fromSide: conn.fromSide,
          toId: conn.toCardId,
          toSide: conn.toSide
        });
      });
    }
    
    // Create layout object
    const layout = {
      cards,
      connections
    };
    
    // Save to localStorage
    localStorage.setItem(StorageConfig.LAYOUT_KEY, JSON.stringify(layout));
    
    return JSON.stringify(layout, null, 2);
  }

  /**
   * Load a layout from JSON data
   * @param {Object} layout - Layout data
   */
  deserializeAndApplyLayout(layout) {
    logger.info('Layout', 'Loading layout from data');
    
    try {
      // Clear existing connections and cards
      this.connectionController.removeAllConnectionsFromModelAndDom();
      
      // Remove existing cards from DOM and state
      const existingCards = this.stateManager.getState('cards');
      if (existingCards) {
        Object.keys(existingCards).forEach(id => {
          const cardElement = document.querySelector(`.card[data-scenario="${id}"]`);
          if (cardElement) cardElement.remove();
        });
        
        this.stateManager.setState('cards', {});
      }
      
      // Process cards
      if (layout.cards && Array.isArray(layout.cards)) {
        layout.cards.forEach(cardData => {
          const scenarioId = parseInt(cardData.id, 10);
          this.cardController.createCardModelAndElement(scenarioId, {
            x: cardData.x,
            y: cardData.y
          });
          
          // Update card size if provided
          if (cardData.width && cardData.height) {
            const card = document.querySelector(`.card[data-scenario="${scenarioId}"]`);
            if (card) {
              this.renderer.updateStyle(card, {
                width: `${cardData.width}px`,
                height: `${cardData.height}px`
              });
              
              // Update model
              this.stateManager.setState(`cards.${scenarioId}.width`, cardData.width);
              this.stateManager.setState(`cards.${scenarioId}.height`, cardData.height);
            }
          }
        });
      }
      
      // Process connections
      if (layout.connections && Array.isArray(layout.connections)) {
        layout.connections.forEach(conn => {
          this.connectionController.createConnectionFromData(conn);
        });
      }
      
      // Save the layout to localStorage
      localStorage.setItem(StorageConfig.LAYOUT_KEY, JSON.stringify(layout));
      
    } catch (error) {
      logger.error('Layout', 'Error loading layout', { error });
      alert('Failed to load layout: ' + error.message);
      
      // Fall back to default cards
      this.cardController.createDefaultCards();
    }
  }
}