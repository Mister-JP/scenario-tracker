/**
 * Grid Layout Manager
 * Handles initialization, resetting, saving, and loading of card layouts
 */

import { Position, LayoutSpec, CardSpec } from "../../types";
import { getHeaderOffset } from "../../utils";
import { store, Constants } from "../state";
import { createCard } from "../../components/card/Card.js";
import {
  getAllConnections,
  clearAllConnections,
  createConnectionFromSaved,
  recalculateAllLines
} from "../../components/connector/ConnectorManager.js";

/**
 * Initializes the grid with cards in default positions
 */
export function initializeGrid(): void {
  const topOffset = getHeaderOffset();
  
  Constants.SCENARIOS.forEach((scenarioId, index) => {
    // Calculate grid position
    const column = index % Constants.GRID_COLUMNS;
    const row = Math.floor(index / Constants.GRID_COLUMNS);
    
    // Calculate position
    const position: Position = {
      x: column * (Constants.CARD_WIDTH + Constants.GRID_GAP),
      y: topOffset + row * (Constants.CARD_HEIGHT + Constants.GRID_GAP)
    };
    
    // Create card at position
    createCard(scenarioId, position);
  });
}

/**
 * Resets all cards to their default grid positions
 */
export function resetGridLayout(): void {
  const topOffset = getHeaderOffset();
  
  // Reset each card's position and size
  Array.from(store.cards.entries()).forEach(([scenarioId, element], index) => {
    const column = index % Constants.GRID_COLUMNS;
    const row = Math.floor(index / Constants.GRID_COLUMNS);
    
    // Set position and size
    element.style.left = `${column * (Constants.CARD_WIDTH + Constants.GRID_GAP)}px`;
    element.style.top = `${topOffset + row * (Constants.CARD_HEIGHT + Constants.GRID_GAP)}px`;
    element.style.width = `${Constants.CARD_WIDTH}px`;
    element.style.height = `${Constants.CARD_HEIGHT}px`;
  });
  
  // Clear all connections
  clearAllConnections();
  
  // Update connector lines
  recalculateAllLines();
}

/**
 * Creates a snapshot of the current layout
 * @returns JSON string representing the layout
 */
export function createLayoutSnapshot(): string {
  // Get card specifications
  const cardSpecs: CardSpec[] = Array.from(store.cards.entries()).map(([scenarioId, element]) => {
    const rect = element.getBoundingClientRect();
    
    return {
      scenarioId,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
  
  // Get arrow connections
  const connections = getAllConnections();
  
  // Create layout specification
  const layout: LayoutSpec = {
    cards: cardSpecs,
    arrows: connections
  };
  
  // Return pretty-printed JSON
  return JSON.stringify(layout, null, 2);
}

/**
 * Saves the current layout to a file
 * @param fileName - Base name for the file (without extension)
 */
export function saveLayoutToFile(fileName: string): void {
  // Create JSON blob
  const json = createLayoutSnapshot();
  const blob = new Blob([json], { type: "application/json" });
  
  // Create download link
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `layout-${fileName}.json`;
  
  // Trigger download
  downloadLink.click();
  
  // Clean up
  URL.revokeObjectURL(downloadLink.href);
}

/**
 * Applies a layout from JSON
 * @param json - JSON string representing a layout
 */
export function loadLayoutFromFile(json: string): void {
  try {
    // Parse the JSON
    const layout = JSON.parse(json) as LayoutSpec;
    const topOffset = getHeaderOffset();
    
    // Apply card positions and sizes
    if (layout.cards) {
      layout.cards.forEach((cardSpec) => {
        const cardElement = store.cards.get(cardSpec.scenarioId);
        if (!cardElement) return;
        
        // Update position and size
        cardElement.style.left = `${cardSpec.x}px`;
        cardElement.style.top = `${Math.max(cardSpec.y, topOffset)}px`;
        cardElement.style.width = `${cardSpec.width}px`;
        cardElement.style.height = `${cardSpec.height}px`;
      });
    }
    
    // Clear existing connections
    clearAllConnections();
    
    // Apply arrow connections
    if (layout.arrows) {
      layout.arrows.forEach((connection) => {
        createConnectionFromSaved(
          connection.fromCardId,
          connection.fromSide,
          connection.toCardId,
          connection.toSide
        );
      });
    }
    
    // Update connector lines
    recalculateAllLines();
  } catch (error) {
    console.error("Error loading layout:", error);
    alert("Failed to load layout. The file may be corrupted.");
  }
}