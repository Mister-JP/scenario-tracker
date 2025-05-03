/**
 * Connection System Functions
 * Handles the SVG lines connecting cards
 */

// Store for all connection lines
let connections = [];

// Active drawing state
let activeDrawing = null;

// SVG container for connections
let svgContainer;

/**
 * Set up the connection system with SVG container
 */
function setupConnectionSystem() {
  utils.log.info('Connections', 'Setting up connection system');
  
  // Create SVG element for connections
  svgContainer = utils.createSvgElement('svg', {
    'id': 'connections-svg',
    'style': 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;'
  });
  
  // Add arrow marker definition
  svgContainer.innerHTML = `
    <defs>
      <marker id="arrow-head" markerWidth="10" markerHeight="7" 
              refX="7" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#444" />
      </marker>
    </defs>
  `;
  
  document.body.appendChild(svgContainer);
  
  return {
    createConnection,
    updateConnections
  };
}

/**
 * Starts drawing a connection
 * @param {HTMLElement} fromCard - Source card
 * @param {HTMLElement} fromDot - Source dot
 * @param {number} startX - Initial X position
 * @param {number} startY - Initial Y position
 */
function startDrawingConnection(fromCard, fromDot, startX, startY) {
  utils.log.debug('Connections', 'Starting connection', {
    fromCard: fromCard.dataset.scenario,
    fromDot: fromDot.dataset.side,
    position: { x: startX, y: startY }
  });
  
  // Create temporary line
  const line = utils.createSvgElement('line', {
    'x1': String(startX),
    'y1': String(startY),
    'x2': String(startX),
    'y2': String(startY),
    'stroke': '#444',
    'stroke-width': '2',
    'marker-end': 'url(#arrow-head)',
    'pointer-events': 'none'
  });
  
  svgContainer.appendChild(line);
  
  // Set active drawing state
  activeDrawing = {
    fromCard,
    fromDot,
    line
  };
  
  // Add event listeners to track pointer movement
  document.addEventListener('pointermove', onDrawingMove);
  document.addEventListener('pointerup', onDrawingEnd);
}

/**
 * Handle pointer movement during connection drawing
 * @param {PointerEvent} e - Pointer event
 */
function onDrawingMove(e) {
  if (!activeDrawing) return;
  
  // Update line end position
  activeDrawing.line.setAttribute('x2', String(e.clientX));
  activeDrawing.line.setAttribute('y2', String(e.clientY));
}

/**
 * Handle the end of connection drawing
 * @param {PointerEvent} e - Pointer event
 */
function onDrawingEnd(e) {
  if (!activeDrawing) return;
  
  // Find target dot (if any)
  const toDot = findDotAtPosition(e.clientX, e.clientY, activeDrawing.fromCard);
  
  if (toDot) {
    const toCard = toDot.closest('.card');
    utils.log.info('Connections', 'Completing connection', {
      from: activeDrawing.fromCard.dataset.scenario,
      to: toCard.dataset.scenario
    });
    
    // Complete the connection
    finalizeConnection(
      activeDrawing.fromCard,
      activeDrawing.fromDot,
      toCard,
      toDot,
      activeDrawing.line
    );
  } else {
    // No valid endpoint found, remove the line
    utils.log.debug('Connections', 'No valid endpoint found, canceling connection');
    activeDrawing.line.remove();
  }
  
  // Clean up
  document.removeEventListener('pointermove', onDrawingMove);
  document.removeEventListener('pointerup', onDrawingEnd);
  activeDrawing = null;
}

/**
 * Find a dot element at the given position
 * @param {number} x - Pointer X
 * @param {number} y - Pointer Y
 * @param {HTMLElement} sourceCard - The source card (to exclude)
 * @returns {HTMLElement|null} The dot element or null
 */
function findDotAtPosition(x, y, sourceCard) {
  let closestDot = null;
  let closestDistance = Constants.CONNECTOR_SNAP_DISTANCE;
  
  // Check all cards except the source card
  store.cards.forEach((card) => {
    if (card === sourceCard) return;
    
    // Check each dot on this card
    const dots = card.querySelectorAll('.dot');
    dots.forEach(dot => {
      const center = utils.getElementCenter(dot);
      const distance = utils.calculateDistance(center.x, center.y, x, y);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDot = dot;
      }
    });
  });
  
  return closestDot;
}

/**
 * Finalize a connection between two points
 * @param {HTMLElement} fromCard - Source card
 * @param {HTMLElement} fromDot - Source dot
 * @param {HTMLElement} toCard - Target card
 * @param {HTMLElement} toDot - Target dot
 * @param {SVGElement} line - The SVG line element
 */
function finalizeConnection(fromCard, fromDot, toCard, toDot, line) {
  // Generate ID for the connection
  const id = `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  line.dataset.id = id;
  
  // Store connection data
  connections.push({
    id,
    fromCard,
    fromDot,
    toCard,
    toDot,
    line
  });
  
  // Mark dots as occupied
  fromDot.dataset.occupied = 'true';
  toDot.dataset.occupied = 'true';
  
  // Make line interactive
  line.style.pointerEvents = 'auto';
  line.style.cursor = 'pointer';
  
  // Add double-click handler
  line.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    showConnectionDialog(id);
  });
  
  // Update the connection position
  updateConnectionPosition({
    fromCard,
    fromDot,
    toCard,
    toDot,
    line
  });
}

/**
 * Update a single connection position
 * @param {Object} connection - Connection object
 */
function updateConnectionPosition(connection) {
  const fromCenter = utils.getElementCenter(connection.fromDot);
  const toCenter = utils.getElementCenter(connection.toDot);
  
  connection.line.setAttribute('x1', String(fromCenter.x));
  connection.line.setAttribute('y1', String(fromCenter.y));
  connection.line.setAttribute('x2', String(toCenter.x));
  connection.line.setAttribute('y2', String(toCenter.y));
}

/**
 * Update all connection positions
 * Used after card movement
 */
function updateConnections() {
  if (connections.length === 0) return;
  
  utils.log.debug('Connections', `Updating ${connections.length} connections`);
  connections.forEach(updateConnectionPosition);
}

/**
 * Show the connection dialog
 * @param {string} connectionId - Connection ID
 */
function showConnectionDialog(connectionId) {
  utils.log.debug('Connections', 'Showing dialog for connection', { id: connectionId });
  
  // Get the modal elements
  const modalOverlay = document.getElementById('modal-overlay');
  const removeButton = modalOverlay.querySelector('.modal-remove-btn');
  const closeButton = modalOverlay.querySelector('.modal-close');
  
  // Store the active connection ID
  modalOverlay.dataset.activeConnection = connectionId;
  
  // Set up close handler
  closeButton.onclick = () => {
    modalOverlay.style.display = 'none';
    delete modalOverlay.dataset.activeConnection;
  };
  
  // Set up remove handler
  removeButton.onclick = () => {
    if (modalOverlay.dataset.activeConnection) {
      removeConnection(modalOverlay.dataset.activeConnection);
      modalOverlay.style.display = 'none';
      delete modalOverlay.dataset.activeConnection;
    }
  };
  
  // Show the modal
  modalOverlay.style.display = 'flex';
}

/**
 * Remove a connection by ID
 * @param {string} connectionId - Connection ID
 */
function removeConnection(connectionId) {
  utils.log.info('Connections', 'Removing connection', { id: connectionId });
  
  // Find the connection
  const index = connections.findIndex(conn => conn.id === connectionId);
  if (index === -1) return;
  
  const connection = connections[index];
  
  // Remove from DOM
  connection.line.remove();
  
  // Reset occupied state on dots
  connection.fromDot.dataset.occupied = 'false';
  connection.toDot.dataset.occupied = 'false';
  
  // Remove from connections array
  connections.splice(index, 1);
}

/**
 * Create a connection from saved data
 * @param {number} fromId - Source card ID
 * @param {number} fromSide - Source dot side
 * @param {number} toId - Target card ID
 * @param {number} toSide - Target dot side
 */
function createConnection(fromId, fromSide, toId, toSide) {
  utils.log.debug('Connections', 'Creating connection from data', {
    from: fromId,
    to: toId,
    fromSide,
    toSide
  });
  
  // Find card elements
  const fromCard = document.querySelector(`.card[data-scenario="${fromId}"]`);
  const toCard = document.querySelector(`.card[data-scenario="${toId}"]`);
  
  if (!fromCard || !toCard) {
    utils.log.error('Connections', 'Cards not found');
    return;
  }
  
  // Find dot elements
  const fromDot = fromCard.querySelector(`.dot[data-side="${fromSide}"]`);
  const toDot = toCard.querySelector(`.dot[data-side="${toSide}"]`);
  
  if (!fromDot || !toDot) {
    utils.log.error('Connections', 'Dots not found');
    return;
  }
  
  // Create the line
  const line = utils.createSvgElement('line', {
    'stroke': '#444',
    'stroke-width': '2',
    'marker-end': 'url(#arrow-head)'
  });
  
  svgContainer.appendChild(line);
  
  // Complete the connection
  finalizeConnection(fromCard, fromDot, toCard, toDot, line);
}

/**
 * Get all connections for saving
 * @returns {Array} Connection data
 */
function getAllConnections() {
  return connections.map(conn => ({
    fromId: parseInt(conn.fromCard.dataset.scenario),
    fromSide: parseInt(conn.fromDot.dataset.side),
    toId: parseInt(conn.toCard.dataset.scenario),
    toSide: parseInt(conn.toDot.dataset.side)
  }));
}

/**
 * Clear all connections
 */
function clearAllConnections() {
  utils.log.info('Connections', 'Clearing all connections');
  
  // Remove all SVG lines
  connections.forEach(conn => conn.line.remove());
  
  // Reset all dots
  document.querySelectorAll('.dot[data-occupied="true"]').forEach(dot => {
    dot.dataset.occupied = 'false';
  });
  
  // Clear connections array
  connections = [];
}