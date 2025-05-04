/**
 * Connection controller for handling connections between cards
 * @module controllers/ConnectionController
 */
import { ConnectorConfig } from '../core/Config.js';
import ConnectionModel from '../models/ConnectionModel.js';
import { calculateElementCenterCoordinates, calculateDistance } from '../utils/DOMUtils.js';
import { logger } from '../utils/Logger.js';

export default class ConnectionController {
  constructor(stateManager, eventBus, domRenderer, svgRenderer) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.domRenderer = domRenderer;
    this.svgRenderer = svgRenderer;
    this.activeDrawing = null;
    this._dots = {};
  }

  initialize() {
    logger.info('Connections', 'Setting up connection system');
    this.svgContainer = this.svgRenderer.createSVGContainer();
    this._setupConnectionEvents();
    this.eventBus.on('dom:initialized', this._setupDOMEvents.bind(this));
  }

  _setupConnectionEvents() {
    this.eventBus.on('connection:start', this._handleConnectionStart.bind(this));
    document.addEventListener('pointermove', this._handlePointerMove.bind(this));
    document.addEventListener('pointerup', this._handlePointerUp.bind(this));
    this.eventBus.on('connections:update', this._updateAllConnections.bind(this));
  }
  
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

  _handleConnectionStart(data) {
    logger.debug('Connections', 'Starting connection', {
      fromCard: data.cardId,
      fromDot: data.dotSide,
      position: { x: data.x, y: data.y }
    });
    
    const startDot = data.element;
    const dotCenter = calculateElementCenterCoordinates(startDot);
    
    const tempLine = this.svgRenderer.createConnectionLine({
      id: 'temp-connection',
      x1: dotCenter.x,
      y1: dotCenter.y,
      x2: data.x,
      y2: data.y,
      color: '#4cc9f0',
      width: 3
    });
    
    this.activeDrawing = {
      fromCardId: data.cardId,
      fromDotSide: data.dotSide,
      fromDot: data.element,
      startX: dotCenter.x,
      startY: dotCenter.y,
      line: tempLine
    };
    
    tempLine.style.pointerEvents = 'none';
  }
  
  _handlePointerMove(e) {
    if (!this.activeDrawing) return;
    
    this.svgRenderer.updateConnectionCoordinates('temp-connection', {
      x1: this.activeDrawing.startX,
      y1: this.activeDrawing.startY,
      x2: e.clientX,
      y2: e.clientY
    });
  }

  _handlePointerUp(e) {
    if (!this.activeDrawing) return;
    
    const toDot = this._findDotAtPosition(e.clientX, e.clientY, this.activeDrawing.fromCardId);
    
    if (toDot) {
      const toCard = toDot.closest('.card');
      const toCardId = parseInt(toCard.dataset.scenario, 10);
      const toDotData = this._getDotData(toDot);
      
      logger.info('Connections', 'Completing connection', {
        from: this.activeDrawing.fromCardId,
        to: toCardId
      });
      
      this._completeAndRenderConnection(
        this.activeDrawing.fromCardId,
        this.activeDrawing.fromDotSide,
        toCardId,
        toDotData.side,
        toDotData.position
      );
    } else {
      logger.debug('Connections', 'No valid endpoint found, canceling connection');
      this.svgRenderer.removeConnection('temp-connection');
    }
    
    this.activeDrawing = null;
  }

  _findDotAtPosition(x, y, sourceCardId) {
    let closestDot = null;
    let closestDistance = ConnectorConfig.SNAP_DISTANCE;
    
    document.querySelectorAll('.card').forEach(card => {
      const cardId = parseInt(card.dataset.scenario, 10);
      if (cardId === sourceCardId) return;
      
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

  _getDotData(dot) {
    const dotId = dot.dataset.dotId;
    const card = dot.closest('.card');
    const cardId = parseInt(card.dataset.scenario, 10);
    
    if (!this._dots[cardId]) {
      this._initializeCardDots(card);
    }
    
    return this._dots[cardId].find(d => d.id === dotId);
  }

  _initializeCardDots(card) {
    const cardId = parseInt(card.dataset.scenario, 10);
    this._dots[cardId] = [];
    
    const defaultDots = [
      { side: 0, position: 0.5 },
      { side: 1, position: 0.5 },
      { side: 2, position: 0.5 },
      { side: 3, position: 0.5 }
    ];
    
    defaultDots.forEach((dotData, index) => {
      const dotElement = card.querySelector(`.dot[data-side="${index}"]`);
      if (dotElement) {
        // Use consistent ID format for all dots
        const dotId = `dot-${cardId}-${index}-500`; // 500 represents 0.5 position
        dotElement.dataset.dotId = dotId;
        
        this._dots[cardId].push({
          id: dotId,
          side: dotData.side,
          position: dotData.position,
          element: dotElement,
          occupied: false
        });
      }
    });
  }

  /**
   * Extract dot information from various formats
   * @param {string|number} dotSide - Dot identifier in various formats
   * @returns {Object} Extracted side and position information
   */
  _extractDotInfo(dotSide) {
    // Handle case where dotSide is already a dot object
    if (typeof dotSide === 'object' && dotSide !== null) {
      return {
        side: dotSide.side,
        position: dotSide.position || 0.5
      };
    }
    
    // Convert to string for consistent processing
    const dotStr = String(dotSide);
    
    // If it's a new-style ID (dot-cardId-side-position)
    if (dotStr.startsWith('dot-')) {
      const parts = dotStr.split('-');
      if (parts.length >= 4) {
        return {
          side: parseInt(parts[2], 10),
          position: parseInt(parts[3], 10) / 1000
        };
      }
    }
    
    // If it's a simple number
    if (!isNaN(parseInt(dotStr, 10))) {
      return {
        side: parseInt(dotStr, 10),
        position: 0.5
      };
    }
    
    // Default fallback
    return { side: 0, position: 0.5 };
  }

  _completeAndRenderConnection(fromCardId, fromDotSide, toCardId, toDotSide, toDotPosition) {
    const connectionId = ConnectionModel.generateId();
    
    // Extract position from dot IDs
    const fromDotData = this._extractDotInfo(fromDotSide);
    const toDotData = {
      side: toDotSide,
      position: toDotPosition
    };
    
    // Create connection with position data
    const connection = new ConnectionModel(
      connectionId,
      fromCardId,
      fromDotData.side,
      toCardId,
      toDotData.side,
      fromDotData.position,
      toDotData.position
    );
    
    this.stateManager.setState(`connections.${connectionId}`, connection);
    
    const fromCard = document.querySelector(`.card[data-scenario="${fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-scenario="${toCardId}"]`);
    
    if (fromCard && toCard) {
      const fromDot = this._findDotByData(fromCard, fromDotData.side, fromDotData.position);
      const toDot = this._findDotByData(toCard, toDotData.side, toDotData.position);
      
      if (!fromDot || !toDot) {
        logger.error('Connections', 'Could not find dots for connection', {
          fromDotSide: fromDotData.side,
          fromDotPosition: fromDotData.position,
          toDotSide: toDotData.side,
          toDotPosition: toDotData.position
        });
        // Clean up failed connection
        const connections = { ...this.stateManager.getState('connections') };
        delete connections[connectionId];
        this.stateManager.setState('connections', connections);
        return;
      }
      
      fromDot.dataset.occupied = 'true';
      toDot.dataset.occupied = 'true';
      
      this._updateDotState(fromCardId, fromDot.dataset.dotId, true);
      this._updateDotState(toCardId, toDot.dataset.dotId, true);
      
      this._generateNewDots(fromCard);
      this._generateNewDots(toCard);
      
      const fromCenter = calculateElementCenterCoordinates(fromDot);
      const toCenter = calculateElementCenterCoordinates(toDot);
      
      this.svgRenderer.removeConnection('temp-connection');
      
      const line = this.svgRenderer.createConnectionLine({
        id: connectionId,
        x1: fromCenter.x,
        y1: fromCenter.y,
        x2: toCenter.x,
        y2: toCenter.y,
        color: connection.color,
        width: connection.width
      });
      
      line.style.pointerEvents = 'auto';
      line.style.cursor = 'pointer';
      
      line.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.domRenderer.showDialog(connectionId);
      });
    }

    this.svgContainer.style.display = 'none';
    this.svgContainer.offsetHeight;
    this.svgContainer.style.display = '';
    
    this._updateConnectionPosition(connectionId, connection);
  }

  _findDotByData(card, side, position = null) {
    const cardId = parseInt(card.dataset.scenario, 10);
    
    if (!this._dots[cardId]) {
      this._initializeCardDots(card);
    }
    
    let dotData;
    if (position !== null) {
      // Find dot with matching side and position
      dotData = this._dots[cardId].find(d => 
        d.side === side && 
        Math.abs(d.position - position) < 0.01
      );
    } else {
      // Fallback to finding any unoccupied dot on the side
      dotData = this._dots[cardId].find(d => 
        d.side === side && 
        !d.occupied
      );
    }
    
    return dotData ? dotData.element : null;
  }

  _updateDotState(cardId, dotId, occupied) {
    if (!this._dots[cardId]) return;
    
    const dot = this._dots[cardId].find(d => d.id === dotId);
    if (dot) {
      dot.occupied = occupied;
    }
  }

  _generateNewDots(card) {
    const cardId = parseInt(card.dataset.scenario, 10);
    
    if (!this._dots[cardId]) {
      this._initializeCardDots(card);
    }
    
    for (let side = 0; side < 4; side++) {
      const sideDots = this._dots[cardId]
        .filter(d => d.side === side)
        .sort((a, b) => a.position - b.position);
      
      const occupiedDots = sideDots.filter(d => d.occupied);
      
      if (occupiedDots.length === 0) continue;
      
      const newDotPositions = this._calculateNewDotPositions(occupiedDots, side);
      
      newDotPositions.forEach(position => {
        const dotId = `dot-${cardId}-${side}-${Math.round(position * 1000)}`;
        const newDot = this._createDotElement(card, side, position, dotId);
        
        this._dots[cardId].push({
          id: dotId,
          side: side,
          position: position,
          element: newDot,
          occupied: false
        });
      });
    }
  }

  _calculateNewDotPositions(occupiedDots, side) {
    const newPositions = [];
    const positions = [0, ...occupiedDots.map(d => d.position), 1];
    
    for (let i = 0; i < positions.length - 1; i++) {
      const pos1 = positions[i];
      const pos2 = positions[i + 1];
      
      if (pos2 - pos1 > 0.1) {
        const midpoint = (pos1 + pos2) / 2;
        newPositions.push(midpoint);
      }
    }
    
    return newPositions;
  }

  _createDotElement(card, side, relativePosition, dotId) {
    const cardRect = card.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.dataset.side = side;
    dot.dataset.occupied = 'false';
    dot.dataset.dotId = dotId;
    
    let x, y;
    switch (side) {
      case 0:
        x = cardRect.width * relativePosition;
        y = 0;
        break;
      case 1:
        x = cardRect.width;
        y = cardRect.height * relativePosition;
        break;
      case 2:
        x = cardRect.width * (1 - relativePosition);
        y = cardRect.height;
        break;
      case 3:
        x = 0;
        y = cardRect.height * (1 - relativePosition);
        break;
    }
    
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.transform = 'translate(-50%, -50%)';
    
    const connectorContainer = card.querySelector('.card-connectors');
    connectorContainer.appendChild(dot);
    
    dot.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      
      this.eventBus.emit('connection:start', {
        cardId: parseInt(card.dataset.scenario, 10),
        dotSide: dotId,
        x: e.clientX,
        y: e.clientY,
        element: dot
      });
    });
    
    return dot;
  }

  _updateAllConnections() {
    const connections = this.stateManager.getState('connections');
    if (!connections) return;
    
    logger.debug('Connections', `Updating ${Object.keys(connections).length} connections`);
    
    Object.entries(connections).forEach(([id, connection]) => {
      this._updateConnectionPosition(id, connection);
    });
  }

  _updateConnectionPosition(connectionId, connection) {
    const fromCard = document.querySelector(`.card[data-scenario="${connection.fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-scenario="${connection.toCardId}"]`);
    
    if (!fromCard || !toCard) return;
    
    // Use stored position data when finding dots
    const fromDot = this._findDotByData(fromCard, connection.fromSide, connection.fromPosition);
    const toDot = this._findDotByData(toCard, connection.toSide, connection.toPosition);
    
    if (!fromDot || !toDot) {
      logger.warn('Connections', 'Could not find dots for connection update', {
        id: connectionId,
        fromSide: connection.fromSide,
        fromPosition: connection.fromPosition,
        toSide: connection.toSide,
        toPosition: connection.toPosition
      });
      return;
    }
    
    const fromCenter = calculateElementCenterCoordinates(fromDot);
    const toCenter = calculateElementCenterCoordinates(toDot);
    
    this.svgRenderer.updateConnectionCoordinates(connectionId, {
      x1: fromCenter.x,
      y1: fromCenter.y,
      x2: toCenter.x,
      y2: toCenter.y
    });
  }

  removeConnection(connectionId) {
    logger.info('Connections', 'Removing connection', { id: connectionId });
    
    const connection = this.stateManager.getState(`connections.${connectionId}`);
    if (!connection) return;
    
    const fromCard = document.querySelector(`.card[data-scenario="${connection.fromCardId}"]`);
    const toCard = document.querySelector(`.card[data-scenario="${connection.toCardId}"]`);
    
    if (fromCard && toCard) {
      const fromDot = this._findDotByData(fromCard, connection.fromSide, connection.fromPosition);
      const toDot = this._findDotByData(toCard, connection.toSide, connection.toPosition);
      
      if (fromDot) {
        fromDot.dataset.occupied = 'false';
        this._updateDotState(connection.fromCardId, fromDot.dataset.dotId, false);
      }
      if (toDot) {
        toDot.dataset.occupied = 'false';
        this._updateDotState(connection.toCardId, toDot.dataset.dotId, false);
      }
    }
    
    this.svgRenderer.removeConnection(connectionId);
    
    const connections = { ...this.stateManager.getState('connections') };
    delete connections[connectionId];
    this.stateManager.setState('connections', connections);
  }

  removeAllConnectionsFromModelAndDom() {
    logger.info('Connections', 'Clearing all connections');
    
    const connections = this.stateManager.getState('connections');
    if (!connections) return;
    
    Object.keys(connections).forEach(id => {
      this.removeConnection(id);
    });
    
    document.querySelectorAll('.dot[data-occupied="true"]').forEach(dot => {
      dot.dataset.occupied = 'false';
    });
    
    this._dots = {};
  }

  createConnectionFromData(connectionData) {
    // Update to use position data from saved layout
    this._completeAndRenderConnection(
      connectionData.fromId,
      connectionData.fromSide,
      connectionData.toId,
      connectionData.toSide,
      connectionData.toPosition || 0.5
    );
  }
}