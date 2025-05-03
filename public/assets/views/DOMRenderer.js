/**
 * Handles all DOM manipulation operations
 * Separates UI updates from business logic
 * @module views/DOMRenderer
 */
import { getHeaderOffset, createElement, createSvgElement, calculateElementCenterCoordinates } from '../utils/DOMUtils.js';
import { logger } from '../utils/Logger.js';

export default class DOMRenderer {
  constructor() {
    this._elements = {}; // Cache of important DOM elements
    this._templates = {}; // Cache of templates
  }

  /**
   * Initialize renderer and cache key elements
   * @returns {DOMRenderer} This renderer instance for chaining
   */
  initialize() {
    // Ensure workspace exists
    this._elements = {};
    
    // Get or create workspace element
    let workspace = document.getElementById('workspace');
    if (!workspace) {
      workspace = document.createElement('div');
      workspace.id = 'workspace';
      document.body.appendChild(workspace);
      console.log('Created workspace element');
    }
    
    this._elements.workspace = workspace;
    
    // Cache other elements if they exist
    this._elements.header = document.querySelector('header');
    this._elements.hostValue = document.getElementById('host-value');
    this._elements.saveBtn = document.getElementById('save-layout-btn');
    this._elements.loadBtn = document.getElementById('load-layout-btn');
    this._elements.resetBtn = document.getElementById('reset-layout-btn');
    this._elements.fileInput = document.getElementById('file-input');
    this._elements.editHost = document.getElementById('edit-host');
    this._elements.modalOverlay = document.getElementById('modal-overlay');
    
    // Create modal overlay if it doesn't exist
    if (!this._elements.modalOverlay) {
      this._createModalOverlay();
    }
    
    // Create and cache template if it doesn't exist
    let cardTemplate = document.getElementById('card-template');
    if (!cardTemplate) {
      cardTemplate = this._createCardTemplate();
    }
    
    this._templates = {
      cardTemplate: cardTemplate
    };
    
    // Set up workspace height
    this.updateWorkspaceHeight();
    
    // Emit event that DOM is initialized
    if (window.eventBus) {
      window.eventBus.emit('dom:initialized');
    }
    
    return this;
  }

  /**
   * Update element style property
   * @param {HTMLElement|string} element - Element or element ID
   * @param {Object} styleProps - Object with style properties to set
   */
  updateStyle(element, styleProps) {
    const el = typeof element === 'string' 
      ? document.getElementById(element) 
      : element;
    
    if (!el) return;
    
    Object.entries(styleProps).forEach(([prop, value]) => {
      el.style[prop] = value;
    });
  }

  /**
   * Update element text content
   * @param {HTMLElement|string} element - Element or element ID
   * @param {string} text - New text content
   */
  updateText(element, text) {
    const el = typeof element === 'string' 
      ? document.getElementById(element) 
      : element;
    
    if (!el) return;
    
    el.textContent = text;
  }

  /**
   * Update workspace height based on header size
   */
  updateWorkspaceHeight() {
    const headerHeight = getHeaderOffset();
    this.updateStyle(this._elements.workspace, {
      height: `calc(100vh - ${headerHeight}px)`
    });
  }

  /**
   * Create card template if it doesn't exist in the DOM
   * @returns {HTMLTemplateElement} The created template
   * @private
   */
  _createCardTemplate() {
    const template = document.createElement('template');
    template.id = 'card-template';
    
    template.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="handle"></div>
          <h2>Scenario Title</h2>
        </div>
        <div class="card-content">
          <iframe></iframe>
        </div>
        <div class="card-connectors">
          <div class="dot dot-top" data-side="0"></div>
          <div class="dot dot-right" data-side="1"></div>
          <div class="dot dot-bottom" data-side="2"></div>
          <div class="dot dot-left" data-side="3"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(template);
    return template;
  }

  /**
   * Create modal overlay for connection dialogs
   * @private
   */
  _createModalOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-close">×</div>
          <h2>Arrow Connection</h2>
          <button class="modal-remove-btn">Remove</button>
        </div>
        <div class="modal-body">
          <p>This connection represents scenario flow from one view to another.</p>
          <p>Click "Remove" to delete this connection, or close this dialog to keep it.</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this._elements.modalOverlay = overlay;
    return overlay;
  }

  /**
   * Create a card element in the DOM
   * @param {Object} cardData - Card data with position, size, etc.
   * @returns {HTMLElement} The created card element
   */
  createCardElement(cardData) {
    // Check if template exists and create it if needed
    if (!this._templates.cardTemplate) {
      this._templates.cardTemplate = this._createCardTemplate();
    }
    
    // Clone the template content
    const template = this._templates.cardTemplate;
    let card;
    
    // Handle both template element and direct HTML element cases
    if (template.content) {
      // It's a proper <template> element
      card = template.content.firstElementChild.cloneNode(true);
    } else {
      // Fallback if template.content is not available (older browsers)
      const temp = document.createElement('div');
      temp.innerHTML = template.innerHTML;
      card = temp.firstElementChild;
    }
    
    // Set card properties
    card.dataset.scenario = cardData.id;
    card.id = `card-${cardData.id}`;
    
    this.updateStyle(card, {
      left: `${cardData.x}px`,
      top: `${cardData.y}px`,
      width: `${cardData.width}px`,
      height: `${cardData.height}px`,
      zIndex: String(cardData.zIndex)
    });
    
    // Set card title
    card.querySelector('h2').textContent = `Scenario ${cardData.id}`;
    
    // Set iframe source
    card.querySelector('iframe').src = `${cardData.host}?scenario=${cardData.id}`;
    
    // Add to DOM
    this._elements.workspace.appendChild(card);
    
    return card;
  }

  /**
   * Show the connection dialog
   * @param {string} connectionId - ID of active connection
   */
  showDialog(connectionId) {
    const modal = this._elements.modalOverlay;
    modal.dataset.activeConnection = connectionId;
    modal.style.display = 'flex';
  }

  /**
   * Hide the modal dialog
   */
  hideDialog() {
    const modal = this._elements.modalOverlay;
    modal.style.display = 'none';
    delete modal.dataset.activeConnection;
  }
}