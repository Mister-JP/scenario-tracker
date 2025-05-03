/**
 * Layout Management Functions
 * Handles saving, loading, and resetting layouts
 */

/**
 * Set up header controls
 */
function setupHeader() {
    utils.log.debug('Layout', 'Setting up header controls');
    
    // Edit host button
    const editHostButton = document.getElementById('edit-host');
    editHostButton.addEventListener('click', () => {
      const currentHost = store.host;
      const newHost = prompt('Enter tracking host URL:', currentHost);
      
      if (newHost && newHost !== currentHost) {
        store.setHost(newHost);
      }
    });
    
    // Save layout button
    const saveButton = document.getElementById('save-layout-btn');
    saveButton.addEventListener('click', () => {
      const defaultName = new Date().toISOString().split('T')[0];
      const fileName = prompt('Save layout as:', defaultName) || 'layout';
      saveLayoutToFile(fileName);
    });
    
    // Load layout button
    const loadButton = document.getElementById('load-layout-btn');
    const fileInput = document.getElementById('file-input');
    
    loadButton.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const layoutData = JSON.parse(event.target.result);
            loadLayout(layoutData);
          } catch (error) {
            utils.log.error('Layout', 'Failed to parse layout file', { error });
            alert('Invalid layout file format');
          }
        };
        
        reader.readAsText(file);
        fileInput.value = ''; // Reset input
      }
    });
    
    // Reset layout button
    const resetButton = document.getElementById('reset-layout-btn');
    resetButton.addEventListener('click', resetLayout);
  }
  
  /**
   * Reset cards to a grid layout
   */
  function resetLayout() {
    utils.log.info('Layout', 'Resetting to grid layout');
    
    const topOffset = utils.getHeaderOffset();
    
    // Reset card positions
    store.cards.forEach((card, scenarioId, index) => {
      // Calculate index based on scenario ID
      const cardIndex = Constants.SCENARIOS.indexOf(parseInt(scenarioId));
      
      // Calculate grid position
      const column = cardIndex % Constants.GRID_COLUMNS;
      const row = Math.floor(cardIndex / Constants.GRID_COLUMNS);
      
      // Calculate position
      const x = column * (Constants.CARD_WIDTH + Constants.GRID_GAP);
      const y = topOffset + row * (Constants.CARD_HEIGHT + Constants.GRID_GAP);
      
      // Update card position
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.style.width = `${Constants.CARD_WIDTH}px`;
      card.style.height = `${Constants.CARD_HEIGHT}px`;
    });
    
    // Clear connections
    clearAllConnections();
  }
  
  /**
   * Save layout to a JSON file
   * @param {string} fileName - File name without extension
   */
  function saveLayoutToFile(fileName) {
    utils.log.info('Layout', 'Saving layout to file', { fileName });
    
    // Get layout data
    const layout = saveLayout();
    
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
  function saveLayout() {
    utils.log.debug('Layout', 'Creating layout snapshot');
    
    // Get card data
    const cards = Array.from(store.cards.entries()).map(([id, card]) => ({
      id,
      x: parseInt(card.style.left),
      y: parseInt(card.style.top),
      width: parseInt(card.style.width || String(Constants.CARD_WIDTH)),
      height: parseInt(card.style.height || String(Constants.CARD_HEIGHT))
    }));
    
    // Get connection data
    const connections = getAllConnections();
    
    // Create layout object
    const layout = {
      cards,
      connections
    };
    
    // Save to localStorage
    localStorage.setItem('scenario-layout', JSON.stringify(layout));
    
    return JSON.stringify(layout, null, 2);
  }
  
  /**
   * Load a layout from JSON data
   * @param {Object} layout - Layout data
   */
  function loadLayout(layout) {
    utils.log.info('Layout', 'Loading layout from data');
    
    try {
      // Clear existing connections
      clearAllConnections();
      
      // Process cards
      if (layout.cards && Array.isArray(layout.cards)) {
        layout.cards.forEach(cardData => {
          const scenarioId = parseInt(cardData.id);
          let card = store.cards.get(scenarioId);
          
          // Create card if it doesn't exist
          if (!card) {
            card = createCard(scenarioId, { x: cardData.x, y: cardData.y });
          } else {
            // Update existing card
            card.style.left = `${cardData.x}px`;
            card.style.top = `${cardData.y}px`;
            
            if (cardData.width) {
              card.style.width = `${cardData.width}px`;
            }
            
            if (cardData.height) {
              card.style.height = `${cardData.height}px`;
            }
          }
        });
      }
      
      // Process connections
      if (layout.connections && Array.isArray(layout.connections)) {
        layout.connections.forEach(conn => {
          createConnection(conn.fromId, conn.fromSide, conn.toId, conn.toSide);
        });
      }
      
      // Save the layout to localStorage
      localStorage.setItem('scenario-layout', JSON.stringify(layout));
      
    } catch (error) {
      utils.log.error('Layout', 'Error loading layout', { error });
      alert('Failed to load layout: ' + error.message);
    }
  }