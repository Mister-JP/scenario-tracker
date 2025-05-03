/**
 * Connection controller for handling connections between cards
 * @module controllers/ConnectionController
 */
import { ConnectorConfig } from '../core/Config.js';
import ConnectionModel from '../models/ConnectionModel.js';
import { calculateElementCenterCoordinates, calculateDistance } from '../utils/DOMUtils.js';
import { logger } from '../utils/Logger.js';

export default class ConnectionController {
  /**
   * Create a connection controller
   * @param {StateManager} stateManager - Application state manager
   * @param {EventBus} eventBus - Application event bus
   * @param {DOMRenderer} domRenderer - DOM renderer for UI updates
   * @param {SVGRenderer} svgRenderer - SVG renderer for connections
   */
  constructor(stateManager, eventBus, domRenderer, svgRenderer) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.domRenderer = domRenderer;
    this.svgRenderer = svgRenderer;
    this.activeDrawing = null;
  }

  /**
   * Initialize the connection system
   */
  initialize() {
    logger.info('Connections', 'Setting up connection system');
    
    // Create SVG container for connections
    this.svgContainer = this.svgRenderer.createSVGContainer();
    
    // Set up event listeners for connections
    this._setupConnectionEvents();
    
    // Set up DOM event listeners (AFTER the DOM renderer is initialized)
    this.eventBus.on('dom:initialized', this._setupDOMEvents.bind(this));
  }

  _handleConnectionStart(data) {
    logger.debug('Connections', 'Starting connection', {
      fromCard: data.cardId,
      fromDot: data.dotSide,
      position: { x: data.x, y: data.y }
    });
    
    // Get center of the starting dot
    const startDot = data.element;
    const dotCenter = calculateElementCenterCoordinates(startDot);
    
    // Create temporary line with correct starting position
    const tempLine = this.svgRenderer.createConnectionLine({
      id: 'temp-connection',
      x1: dotCenter.x, // Use dot center instead of mouse position
      y1: dotCenter.y,
      x2: data.x,
      y2: data.y,
      color: '#4cc9f0', // Use a distinctive color for the drawing line
      width: 3 // Make it slightly thicker for better visibility
    });
    
    // Set active drawing state
    this.activeDrawing = {
      fromCardId: data.cardId,
      fromDotSide: data.dotSide,
      fromDot: data.element,
      startX: dotCenter.x,
      startY: dotCenter.y,
      line: tempLine
    };
    
    // Make sure the line has pointer-events set to none to avoid interference
    tempLine.style.pointerEvents = 'none';
  }
  
  _handlePointerMove(e) {
    if (!this.activeDrawing) return;
    
    // Update line end position using the saved start position
    this.svgRenderer.updateConnectionCoordinates('temp-connection', {
      x1: this.activeDrawing.startX,
      y1: this.activeDrawing.startY,
      x2: e.clientX,
      y2: e.clientY
    });
  }

  /**
   * Set up connection-related event listeners
   * @private
   */
  _setupConnectionEvents() {
    // Connection creation events
    this.eventBus.on('connection:start', this._handleConnectionStart.bind(this));
    
    // Global events for drawing
    document.addEventListener('pointermove', this._handlePointerMove.bind(this));
    document.addEventListener('pointerup', this._handlePointerUp.bind(this));
    
    // Update connections when cards move
    this.eventBus.on('connections:update', this._updateAllConnections.bind(this));
  }
  
  /**
   * Set up DOM-related event listeners
   * This is called after DOM renderer has initialized
   * @private
   */
  _setupDOMEvents() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalOverlay) {
      logger.error('Connections', 'Modal overlay not found');
      return;
    }
    
    const removeButton = modalOverlay.querySelector('.modal-remove-btn');
    const closeButton = modalOverlay.querySelector('.modal-close');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.domRenderer.hideDialog();
      });
    }
    
    if (removeButton) {
      removeButton.addEventListener('click', () => {
        if (modalOverlay.dataset.activeConnection) {
          this.removeConnection(modalOverlay.dataset.activeConnection);
          this.domRenderer.hideDialog();
        }
      });
    }
  }

  /**
   * Handle the end of connection drawing
   * @param {PointerEvent} e - Pointer event
   * @private
   */
  _handlePointerUp(e) {
    if (!this.activeDrawing) return;
    
    // Find target dot (if any)
    const toDot = this._findDotAtPosition(e.clientX, e.clientY, this.activeDrawing.fromCardId);
    
    if (toDot) {
      const toCard = toDot.closest('.card');
      const toCardId = parseInt(toCard.dataset.scenario, 10);
      const toDotSide = parseInt(toDot.dataset.side, 10);
      
      logger.info('Connections', 'Completing connection', {
        from: this.activeDrawing.fromCardId,
        to: toCardId
      });
      
      // Complete the connection
      this._completeAndRenderConnection(
        this.activeDrawing.fromCardId,
        this.activeDrawing.fromDotSide,
        toCardId,
        toDotSide
      );
    } else {
      // No valid endpoint found, remove the temporary line
      logger.debug('Connections', 'No valid endpoint found, canceling connection');
      this.svgRenderer.removeConnection('temp-connection');
    }
    
    // Clean up
    this.activeDrawing = null;
  }

  /**
   * Find a dot element at the given position
   * @param {number} x - Pointer X
   * @param {number} y - Pointer Y
   * @param {number} sourceCardId - The source card ID (to exclude)
   * @returns {HTMLElement|null} The dot element or null
   * @private
   */
  _findDotAtPosition(x, y, sourceCardId) {
    let closestDot = null;
    let closestDistance = ConnectorConfig.SNAP_DISTANCE;
    
    // Check all cards except the source card
    document.querySelectorAll('.card').forEach(card => {
      const cardId = parseInt(card.dataset.scenario, 10);
      if (cardId === sourceCardId) return;
      
      // Check each dot on this card that is not occupied
      const dots = card.querySelectorAll('.dot[data-occupied="false"]');
      dots.forEach(dot => {
        const center = calculateElementCenterCoordinates(dot);
        const distance = calculateDistance(center.x, center.y, x, y);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestDot = dot;
        }
      });
    });
    
    return closestDot;
  }

  /**
   * Complete a connection and render it
   * @param {number} fromCardId - Source card ID
   * @param {number} fromDotSide - Source dot side
   * @param {number} toCardId - Target card ID
   * @param {number} toDotSide - Target dot side
   * @private
   */
  _completeAndRenderConnection(fromCardId, fromDotSide, toCardId, toDotSide) {
    // Generate a unique ID
    const connectionId = ConnectionModel.generateId();
    
    // Create connection model
    const connection = new ConnectionModel(
      connectionId,
      fromCardId,
      fromDotSide,
      toCardId,
      toDotSide
    );
    
    // Add to state
    this.stateManager.setState(`connections.${connectionId}`, connection);
    
    // Mark dots as occupied
    const fromCard = document.querySelector(`.card[data-scenario="${fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-scenario="${toCardId}"]`);
    
    if (fromCard && toCard) {
      const fromDot = fromCard.querySelector(`.dot[data-side="${fromDotSide}"]`);
      const toDot = toCard.querySelector(`.dot[data-side="${toDotSide}"]`);
      
      fromDot.dataset.occupied = 'true';
      toDot.dataset.occupied = 'true';
      
      // Generate new dots for both cards
      this._generateNewDots(fromCard);
      this._generateNewDots(toCard);
      
      // Get position data
      const fromCenter = calculateElementCenterCoordinates(fromDot);
      const toCenter = calculateElementCenterCoordinates(toDot);
      
      // Remove the temporary line if it exists
      this.svgRenderer.removeConnection('temp-connection');
      
      // Create the permanent line
      const line = this.svgRenderer.createConnectionLine({
        id: connectionId,
        x1: fromCenter.x,
        y1: fromCenter.y,
        x2: toCenter.x,
        y2: toCenter.y,
        color: connection.color,
        width: connection.width
      });
      
      // Make line interactive
      line.style.pointerEvents = 'auto';
      line.style.cursor = 'pointer';
      
      // Add double-click handler
      line.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.domRenderer.showDialog(connectionId);
      });
    }

    // Force an immediate rendering of the connection by triggering a reflow
    this.svgContainer.style.display = 'none';
    this.svgContainer.offsetHeight; // Force reflow
    this.svgContainer.style.display = '';
    
    // Immediately update the connection position
    this._updateConnectionPosition(connectionId, connection);
  }

  /**
   * Generate new dots for a card after a dot becomes occupied
   * @param {HTMLElement} card - Card element
   * @private
   */
  _generateNewDots(card) {
    const occupiedDots = card.querySelectorAll('.dot[data-occupied="true"]');
    const cardRect = card.getBoundingClientRect();
    const cardStyle = window.getComputedStyle(card);
    const cardLeft = parseInt(cardStyle.left);
    const cardTop = parseInt(cardStyle.top);
    
    // Define border positions (not corners)
    const borderPositions = [
      { x: cardRect.width / 2, y: 0 },          // top center
      { x: cardRect.width, y: cardRect.height / 2 },  // right center
      { x: cardRect.width / 2, y: cardRect.height },  // bottom center
      { x: 0, y: cardRect.height / 2 }          // left center
    ];
    
    occupiedDots.forEach(occupiedDot => {
      const dotSide = occupiedDot.dataset.side;
      
      // Get which border this dot is on
      const borderIndex = parseInt(dotSide.split('-')[0] || dotSide);
      
      if (isNaN(borderIndex) || borderIndex >= borderPositions.length) return;
      
      // Only generate new dots on the same border
      const currentBorder = borderPositions[borderIndex];
      
      // Find the next available position on this border
      let newPositions = [];
      
      switch (borderIndex) {
        case 0: // top border
          newPositions = [
            { x: cardRect.width * 0.25, y: 0 },   // quarter point left
            { x: cardRect.width * 0.75, y: 0 }    // quarter point right
          ];
          break;
        case 1: // right border
          newPositions = [
            { x: cardRect.width, y: cardRect.height * 0.25 },   // quarter point top
            { x: cardRect.width, y: cardRect.height * 0.75 }    // quarter point bottom
          ];
          break;
        case 2: // bottom border
          newPositions = [
            { x: cardRect.width * 0.25, y: cardRect.height },   // quarter point left
            { x: cardRect.width * 0.75, y: cardRect.height }    // quarter point right
          ];
          break;
        case 3: // left border
          newPositions = [
            { x: 0, y: cardRect.height * 0.25 },   // quarter point top
            { x: 0, y: cardRect.height * 0.75 }    // quarter point bottom
          ];
          break;
      }
      
      // Create new dots at these positions if they don't already exist
      newPositions.forEach((pos, index) => {
        const existingDot = this._findDotAtRelativePosition(card, pos.x, pos.y);
        if (!existingDot) {
          this._createDot(card, pos.x, pos.y, borderIndex, index);
        }
      });
    });
  }

  /**
   * Create a new dot at specified relative position
   * @param {HTMLElement} card - Card element
   * @param {number} x - X position relative to card
   * @param {number} y - Y position relative to card
   * @param {number} parentSide - Parent dot's side
   * @param {number} index - Position index for unique side value
   * @private
   */
  _createDot(card, x, y, parentSide, index) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.dataset.side = `${parentSide}-${index}`; // Unique identifier
    dot.dataset.occupied = 'false';
    
    // Position the dot
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.transform = 'translate(-50%, -50%)';
    
    // Add to card's connector container
    const connectorContainer = card.querySelector('.card-connectors');
    connectorContainer.appendChild(dot);
    
    // Add event listener for connection start
    const cardId = parseInt(card.dataset.scenario);
    dot.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); // Prevent card drag
      
      this.eventBus.emit('connection:start', {
        cardId: cardId,
        dotSide: dot.dataset.side,
        x: e.clientX,
        y: e.clientY,
        element: dot
      });
    });
  }

  /**
   * Find a dot at relative position within a card
   * @param {HTMLElement} card - Card element
   * @param {number} x - X position relative to card
   * @param {number} y - Y position relative to card
   * @returns {HTMLElement|null} Existing dot or null
   * @private
   */
  _findDotAtRelativePosition(card, x, y) {
    const dots = card.querySelectorAll('.dot');
    const threshold = 1; // Allow 1px difference
    
    for (let dot of dots) {
      const dotX = parseFloat(dot.style.left);
      const dotY = parseFloat(dot.style.top);
      
      if (Math.abs(dotX - x) < threshold && Math.abs(dotY - y) < threshold) {
        return dot;
      }
    }
    
    return null;
  }

  /**
   * Update all connection positions
   * Used after card movement
   * @private
   */
  _updateAllConnections() {
    const connections = this.stateManager.getState('connections');
    if (!connections) return;
    
    logger.debug('Connections', `Updating ${Object.keys(connections).length} connections`);
    
    Object.entries(connections).forEach(([id, connection]) => {
      this._updateConnectionPosition(id, connection);
    });
  }

  /**
   * Update a single connection position
   * @param {string} connectionId - Connection ID
   * @param {ConnectionModel} connection - Connection model
   * @private
   */
  _updateConnectionPosition(connectionId, connection) {
    const fromCard = document.querySelector(`.card[data-scenario="${connection.fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-scenario="${connection.toCardId}"]`);
    
    if (!fromCard || !toCard) return;
    
    const fromDot = fromCard.querySelector(`.dot[data-side="${connection.fromSide}"]`);
    const toDot = toCard.querySelector(`.dot[data-side="${connection.toSide}"]`);
    
    if (!fromDot || !toDot) return;
    
    const fromCenter = calculateElementCenterCoordinates(fromDot);
    const toCenter = calculateElementCenterCoordinates(toDot);
    
    this.svgRenderer.updateConnectionCoordinates(connectionId, {
      x1: fromCenter.x,
      y1: fromCenter.y,
      x2: toCenter.x,
      y2: toCenter.y
    });
  }

  /**
   * Remove a connection by ID
   * @param {string} connectionId - Connection ID
   */
  removeConnection(connectionId) {
    logger.info('Connections', 'Removing connection', { id: connectionId });
    
    // Get the connection data
    const connection = this.stateManager.getState(`connections.${connectionId}`);
    if (!connection) return;
    
    // Reset occupied state on dots
    const fromCard = document.querySelector(`.card[data-scenario="${connection.fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-scenario="${connection.toCardId}"]`);
    
    if (fromCard && toCard) {
      const fromDot = fromCard.querySelector(`.dot[data-side="${connection.fromSide}"]`);
      const toDot = toCard.querySelector(`.dot[data-side="${connection.toSide}"]`);
      
      if (fromDot) fromDot.dataset.occupied = 'false';
      if (toDot) toDot.dataset.occupied = 'false';
    }
    
    // Remove from SVG
    this.svgRenderer.removeConnection(connectionId);
    
    // Remove from state
    const connections = { ...this.stateManager.getState('connections') };
    delete connections[connectionId];
    this.stateManager.setState('connections', connections);
  }

  /**
   * Remove all connections
   */
  removeAllConnectionsFromModelAndDom() {
    logger.info('Connections', 'Clearing all connections');
    
    // Get all connections
    const connections = this.stateManager.getState('connections');
    if (!connections) return;
    
    // Remove each connection
    Object.keys(connections).forEach(id => {
      this.removeConnection(id);
    });
    
    // Reset all dots
    document.querySelectorAll('.dot[data-occupied="true"]').forEach(dot => {
      dot.dataset.occupied = 'false';
    });
  }

  /**
   * Create a connection from saved data
   * @param {Object} connectionData - Connection data (fromId, fromSide, toId, toSide)
   */
  createConnectionFromData(connectionData) {
    this._completeAndRenderConnection(
      connectionData.fromId,
      connectionData.fromSide,
      connectionData.toId,
      connectionData.toSide
    );
  }
}