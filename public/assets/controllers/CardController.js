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
    this._lastConnectionUpdateTime = 0;
    this._connectionUpdateThrottle = 1;
    
    this._setupEvents();
  }

  _setupEvents() {
    this.eventBus.on('card:dragstart', this._handleCardDragStart.bind(this));
    this.eventBus.on('card:dragmove', this._handleCardDragMove.bind(this));
    this.eventBus.on('card:dragend', this._handleCardDragEnd.bind(this));
  }

  createCardModelAndElement(scenarioId, position) {
    logger.debug('Cards', 'Creating card', { scenarioId, position });
    
    const host = this.stateManager.getState('host');
    
    const cardModel = new CardModel(
      scenarioId,
      position,
      CardConfig.DEFAULT_WIDTH,
      CardConfig.DEFAULT_HEIGHT,
      this._getNextZIndex()
    );
    
    this.stateManager.setState(`cards.${scenarioId}`, cardModel);
    
    const cardElement = this.renderer.createCardElement({
      ...cardModel,
      host
    });
    
    this._setupCardEventHandlers(cardElement);
    
    return cardElement.id;
  }

  _setupCardEventHandlers(cardElement) {
    const handle = cardElement.querySelector('.handle');
    const scenarioId = parseInt(cardElement.dataset.scenario, 10);
    
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      
      const workspace = document.getElementById('workspace');
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startScrollLeft = workspace.scrollLeft;
      const startScrollTop = workspace.scrollTop;
      
      let startLeft, startTop;
      
      const cardStyle = window.getComputedStyle(cardElement);
      if (cardStyle.left !== 'auto' && !cardStyle.left.includes('%')) {
        startLeft = parseFloat(cardStyle.left);
        startTop = parseFloat(cardStyle.top);
      } else {
        const cardRect = cardElement.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        startLeft = cardRect.left - workspaceRect.left + workspace.scrollLeft;
        startTop = cardRect.top - workspaceRect.top + workspace.scrollTop;
      }
      
      this.eventBus.emit('card:dragstart', { id: scenarioId });
      
      const move = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const scrollDeltaX = workspace.scrollLeft - startScrollLeft;
        const scrollDeltaY = workspace.scrollTop - startScrollTop;
        const x = startLeft + deltaX + scrollDeltaX;
        const y = startTop + deltaY + scrollDeltaY;
        
        this.eventBus.emit('card:dragmove', { 
          id: scenarioId, 
          x, 
          y 
        });
        
        this.renderer.updateStyle(cardElement, {
          left: `${x}px`,
          top: `${y}px`
        });
      };
      
      const endDrag = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', endDrag);
        this.eventBus.emit('card:dragend', { id: scenarioId });
      };
      
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', endDrag);
    });
    
    const dots = cardElement.querySelectorAll('.dot');
    dots.forEach(dot => {
      dot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        
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

  _handleCardDragStart(data) {
    const scenarioId = data.id;
    this.stateManager.setState(`cards.${scenarioId}.zIndex`, this._getNextZIndex());
  }

  _handleCardDragMove(data) {
    this.stateManager.setState(`cards.${data.id}.x`, data.x);
    this.stateManager.setState(`cards.${data.id}.y`, data.y);
    
    const now = Date.now();
    if (now - this._lastConnectionUpdateTime > this._connectionUpdateThrottle) {
      this._lastConnectionUpdateTime = now;
      this.eventBus.emit('connections:update');
    }
  }

  _handleCardDragEnd(data) {
    this.eventBus.emit('connections:update');
  }

  _getNextZIndex() {
    return ++this._zIndexCounter;
  }
  
  /**
   * Create default cards in a grid layout
   */
  createDefaultCards() {
    logger.info('Cards', 'Creating default card layout');
    const topOffset = getHeaderOffset();
    
    // Only create scenarios 1-6 (available scenarios)
    const scenarios = [1, 2, 3, 4, 5, 6];
    
    scenarios.forEach((scenarioId, index) => {
      const column = index % GridConfig.COLUMNS;
      const row = Math.floor(index / GridConfig.COLUMNS);
      
      const position = {
        x: column * (CardConfig.DEFAULT_WIDTH + GridConfig.GAP),
        y: topOffset + row * (CardConfig.DEFAULT_HEIGHT + GridConfig.GAP)
      };
      
      this.createCardModelAndElement(scenarioId, position);
    });
  }
}