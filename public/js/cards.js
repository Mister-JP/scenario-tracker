/**
 * Card Component Functions
 * Handles card creation and dragging
 */

// Z-index counter to bring active cards to front
let zIndexCounter = 1;

/**
 * Create a card using plain functions
 * @param {number} scenarioId - Scenario ID number 
 * @param {Object} position - {x, y} position coordinates
 * @returns {HTMLElement} The created card element
 */
function createCard(scenarioId, position) {
  utils.log.debug('Cards', 'Creating card', { scenarioId, position });
  
  // Clone the template
  const template = document.getElementById('card-template');
  const card = template.content.cloneNode(true).firstElementChild;
  
  // Set card properties
  card.dataset.scenario = scenarioId;
  card.style.left = `${position.x}px`;
  card.style.top = `${position.y}px`;
  card.style.zIndex = String(zIndexCounter++);
  
  // Set card title
  card.querySelector('h2').textContent = `Scenario ${scenarioId}`;
  
  // Set iframe source
  card.querySelector('iframe').src = `${store.host}?scenario=${scenarioId}`;
  
  // Setup drag behavior
  setupDragging(card);
  
  // Setup connector dots
  setupConnections(card);
  
  // Add to DOM
  document.getElementById('workspace').appendChild(card);
  
  // Add to store
  store.cards.set(scenarioId, card);
  
  return card;
}

/**
 * Set up dragging behavior for a card
 * @param {HTMLElement} card - The card element
 */
function setupDragging(card) {
  const handle = card.querySelector('.handle');
  let isDragging = false;
  let offset = { x: 0, y: 0 };
  
  handle.addEventListener('pointerdown', startDrag);
  
  function startDrag(e) {
    isDragging = true;
    offset = {
      x: e.clientX - card.offsetLeft,
      y: e.clientY - card.offsetTop
    };
    handle.setPointerCapture(e.pointerId);
    handle.addEventListener('pointermove', drag);
    handle.addEventListener('pointerup', stopDrag);
    
    // Bring card to front
    card.style.zIndex = getNextZIndex();
  }
  
  function drag(e) {
    if (!isDragging) return;
    card.style.left = `${e.clientX - offset.x}px`;
    card.style.top = `${e.clientY - offset.y}px`;
    updateConnections();
  }
  
  function stopDrag(e) {
    isDragging = false;
    handle.removeEventListener('pointermove', drag);
    handle.removeEventListener('pointerup', stopDrag);
    handle.releasePointerCapture(e.pointerId);
    
    // Dispatch custom event
    const event = new CustomEvent('card:moved', {
      detail: {
        id: card.dataset.scenario,
        x: parseInt(card.style.left),
        y: parseInt(card.style.top)
      }
    });
    document.dispatchEvent(event);
  }
}

/**
 * Set up connector dots for a card
 * @param {HTMLElement} card - The card element
 */
function setupConnections(card) {
  // The dots are already in the template
  // We just need to register them with the connection system
  const dots = card.querySelectorAll('.dot');
  
  dots.forEach(dot => {
    dot.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); // Prevent card drag
      startDrawingConnection(card, dot, e.clientX, e.clientY);
    });
  });
}

/**
 * Creates default cards in a grid layout
 */
function createDefaultCards() {
  utils.log.info('Cards', 'Creating default card layout');
  
  const topOffset = utils.getHeaderOffset();
  
  Constants.SCENARIOS.forEach((scenarioId, index) => {
    // Calculate grid position
    const column = index % Constants.GRID_COLUMNS;
    const row = Math.floor(index / Constants.GRID_COLUMNS);
    
    // Calculate position
    const position = {
      x: column * (Constants.CARD_WIDTH + Constants.GRID_GAP),
      y: topOffset + row * (Constants.CARD_HEIGHT + Constants.GRID_GAP)
    };
    
    // Create card at position
    createCard(scenarioId, position);
  });
}

/**
 * Gets the next z-index for cards
 * @returns {number} Next z-index
 */
function getNextZIndex() {
  return ++zIndexCounter;
}