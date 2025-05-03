/**
 * Card controller for handling card creation and interaction
 * @module controllers/CardController
 */
import { CardConfig, GridConfig } from '../core/Config.js';
import CardModel from '../models/CardModel.js';
import { getHeaderOffset } from '../utils/DOMUtils.js';
import { logger } from '../utils/Logger.js';

export default class CardController {
  /**
   * Create a card controller
   * @param {StateManager} stateManager - Application state manager
   * @param {EventBus} eventBus - Application event bus
   * @param {DOMRenderer} renderer - DOM renderer for UI updates
   */
  constructor(stateManager, eventBus, renderer) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.renderer = renderer;
    this._zIndexCounter = 1;
    this._lastConnectionUpdateTime = 0; // Timestamp for throttling
    this._connectionUpdateThrottle = 1; // Update connections every 30ms max
    
    // Set up event listeners
    this._setupEvents();
  }

  /**
   * Set up event subscriptions
   * @private
   */
  _setupEvents() {
    // Listen for card movement events
    this.eventBus.on('card:dragstart', this._handleCardDragStart.bind(this));
    this.eventBus.on('card:dragmove', this._handleCardDragMove.bind(this));
    this.eventBus.on('card:dragend', this._handleCardDragEnd.bind(this));
  }

  /**
   * Create a new card model and DOM element
   * @param {number} scenarioId - Scenario ID
   * @param {Object} position - {x, y} coordinates
   * @returns {string} Card element ID
   */
  createCardModelAndElement(scenarioId, position) {
    logger.debug('Cards', 'Creating card', { scenarioId, position });
    
    // Get host from state
    const host = this.stateManager.getState('host');
    
    // Create card model
    const cardModel = new CardModel(
      scenarioId,
      position,
      CardConfig.DEFAULT_WIDTH,
      CardConfig.DEFAULT_HEIGHT,
      this._getNextZIndex()
    );
    
    // Add to state
    this.stateManager.setState(`cards.${scenarioId}`, cardModel);
    
    // Create DOM element
    const cardElement = this.renderer.createCardElement({
      ...cardModel,
      host
    });
    
    // Set up event handlers for the card
    this._setupCardEventHandlers(cardElement);
    
    return cardElement.id;
  }

  /**
   * Set up event handlers for a card element
   * @param {HTMLElement} cardElement - Card DOM element
   * @private
   */
  _setupCardEventHandlers(cardElement) {
    const handle = cardElement.querySelector('.handle');
    const scenarioId = parseInt(cardElement.dataset.scenario, 10);
    
    // Set up dragging
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      
      // Get the workspace element
      const workspace = document.getElementById('workspace');
      
      // Record the initial mouse position
      const startX = e.clientX;
      const startY = e.clientY;
      
      // Record the initial scroll position
      const startScrollLeft = workspace.scrollLeft;
      const startScrollTop = workspace.scrollTop;
      
      // Get the current card position from styles or from getBoundingClientRect
      let startLeft, startTop;
      
      const cardStyle = window.getComputedStyle(cardElement);
      if (cardStyle.left !== 'auto' && !cardStyle.left.includes('%')) {
        startLeft = parseFloat(cardStyle.left);
        startTop = parseFloat(cardStyle.top);
      } else {
        // Fall back to calculating position from getBoundingClientRect
        const cardRect = cardElement.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        startLeft = cardRect.left - workspaceRect.left + workspace.scrollLeft;
        startTop = cardRect.top - workspaceRect.top + workspace.scrollTop;
      }
      
      // Emit drag start event
      this.eventBus.emit('card:dragstart', { id: scenarioId });
      
      // Move function
      const move = (moveEvent) => {
        // Calculate how far the mouse has moved from its initial position
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        // Calculate how far the workspace has scrolled
        const scrollDeltaX = workspace.scrollLeft - startScrollLeft;
        const scrollDeltaY = workspace.scrollTop - startScrollTop;
        
        // Apply both the mouse movement and the scroll movement to the card's initial position
        const x = startLeft + deltaX + scrollDeltaX;
        const y = startTop + deltaY + scrollDeltaY;
        
        // Emit drag move event
        this.eventBus.emit('card:dragmove', { 
          id: scenarioId, 
          x, 
          y 
        });
        
        // Update DOM directly for smooth dragging
        this.renderer.updateStyle(cardElement, {
          left: `${x}px`,
          top: `${y}px`
        });
      };
      
      // End drag function
      const endDrag = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', endDrag);
        
        // Emit drag end event
        this.eventBus.emit('card:dragend', { id: scenarioId });
      };
      
      // Add temporary listeners
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', endDrag);
    });
    
    // Set up dots for connections
    const dots = cardElement.querySelectorAll('.dot');
    dots.forEach(dot => {
      dot.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); // Prevent card drag
        
        this.eventBus.emit('connection:start', {
          cardId: scenarioId,
          dotSide: parseInt(dot.dataset.side, 10),
          x: e.clientX,
          y: e.clientY,
          element: dot
        });
      });
    });
  }

  /**
   * Handle card drag start event
   * @param {Object} data - Drag event data
   * @private
   */
  _handleCardDragStart(data) {
    const scenarioId = data.id;
    // Bring card to front
    this.stateManager.setState(`cards.${scenarioId}.zIndex`, this._getNextZIndex());
  }

  /**
   * Handle card drag move event
   * @param {Object} data - Drag event data
   * @private
   */
  _handleCardDragMove(data) {
    // Update card position in state
    this.stateManager.setState(`cards.${data.id}.x`, data.x);
    this.stateManager.setState(`cards.${data.id}.y`, data.y);
    
    // Throttle connection updates for performance
    const now = Date.now();
    if (now - this._lastConnectionUpdateTime > this._connectionUpdateThrottle) {
      this._lastConnectionUpdateTime = now;
      this.eventBus.emit('connections:update');
    }
  }

  /**
   * Handle card drag end event
   * @param {Object} data - Drag event data
   * @private
   */
  _handleCardDragEnd(data) {
    // Final update to connections at drag end to ensure accuracy
    this.eventBus.emit('connections:update');
  }

  /**
   * Get the next z-index for cards
   * @returns {number} Next z-index value
   * @private
   */
  _getNextZIndex() {
    return ++this._zIndexCounter;
  }
  
  /**
   * Create default cards in a grid layout
   */
  createDefaultCards() {
    logger.info('Cards', 'Creating default card layout');
    const topOffset = getHeaderOffset();
    const scenarios = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    scenarios.forEach((scenarioId, index) => {
      // Calculate grid position
      const column = index % GridConfig.COLUMNS;
      const row = Math.floor(index / GridConfig.COLUMNS);
      
      // Calculate position
      const position = {
        x: column * (CardConfig.DEFAULT_WIDTH + GridConfig.GAP),
        y: topOffset + row * (CardConfig.DEFAULT_HEIGHT + GridConfig.GAP)
      };
      
      // Create card at position
      this.createCardModelAndElement(scenarioId, position);
    });
  }
}