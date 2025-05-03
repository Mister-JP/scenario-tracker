/**
 * Pure data model for a connection between cards
 * @module models/ConnectionModel
 */

export default class ConnectionModel {
    /**
     * Create a new connection model
     * @param {string} id - Unique connection ID
     * @param {number} fromCardId - Source card ID
     * @param {number} fromSide - Source dot side (0-3)
     * @param {number} toCardId - Target card ID
     * @param {number} toSide - Target dot side (0-3)
     */
    constructor(id, fromCardId, fromSide, toCardId, toSide) {
      this.id = id;
      this.fromCardId = fromCardId;
      this.fromSide = fromSide;
      this.toCardId = toCardId;
      this.toSide = toSide;
      this.color = '#444';
      this.width = 2;
    }
  
    /**
     * Generate a unique connection ID
     * @returns {string} Unique connection ID
     */
    static generateId() {
      return `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  
    /**
     * Change connection color
     * @param {string} color - CSS color value
     */
    setColor(color) {
      this.color = color;
    }
  
    /**
     * Change line width
     * @param {number} width - Line width in pixels
     */
    setWidth(width) {
      this.width = width;
    }
  
    /**
     * Create a serializable representation
     * @returns {Object} Plain object for serialization
     */
    toJSON() {
      return {
        fromId: this.fromCardId,
        fromSide: this.fromSide,
        toId: this.toCardId,
        toSide: this.toSide
      };
    }
  
    /**
     * Create a ConnectionModel from saved data
     * @param {Object} data - Serialized connection data
     * @returns {ConnectionModel} New connection model instance
     */
    static fromJSON(data) {
      return new ConnectionModel(
        ConnectionModel.generateId(),
        data.fromId,
        data.fromSide,
        data.toId,
        data.toSide
      );
    }
  }