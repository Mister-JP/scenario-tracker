/**
 * Pure data model for a scenario card
 * @module models/CardModel
 */

export default class CardModel {
    /**
     * Create a new card model
     * @param {number} id - Scenario ID
     * @param {Object} position - {x, y} coordinates
     * @param {number} [width] - Card width in pixels
     * @param {number} [height] - Card height in pixels
     * @param {number} [zIndex] - Z-index for stacking order
     */
    constructor(id, position, width, height, zIndex) {
      this.id = id;
      this.x = position.x;
      this.y = position.y;
      this.width = width || 350;
      this.height = height || 250;
      this.zIndex = zIndex || 1;
    }
  
    /**
     * Move the card to a new position
     * @param {number} x - New X coordinate
     * @param {number} y - New Y coordinate
     * @returns {Object} Updated position {x, y}
     */
    moveTo(x, y) {
      this.x = x;
      this.y = y;
      return { x, y };
    }
  
    /**
     * Resize the card
     * @param {number} width - New width
     * @param {number} height - New height
     * @returns {Object} Updated dimensions {width, height}
     */
    resize(width, height) {
      this.width = width;
      this.height = height;
      return { width, height };
    }
  
    /**
     * Bring card to front by updating z-index
     * @param {number} zIndex - New z-index
     */
    bringToFront(zIndex) {
      this.zIndex = zIndex;
    }
  
    /**
     * Create a serializable representation
     * @returns {Object} Plain object for serialization
     */
    toJSON() {
      return {
        id: this.id,
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
      };
    }
  }