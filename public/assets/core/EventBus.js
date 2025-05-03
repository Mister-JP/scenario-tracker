/**
 * Lightweight event bus for application-wide communication
 * Enables decoupling of components using pub/sub pattern
 * @module core/EventBus
 */

export default class EventBus {
    constructor() {
      this._events = {};
    }
  
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    on(event, callback) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      
      this._events[event].push(callback);
      
      // Return unsubscribe function
      return () => this.off(event, callback);
    }
  
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function to remove
     */
    off(event, callback) {
      if (!this._events[event]) return;
      
      this._events[event] = this._events[event].filter(cb => cb !== callback);
      
      // Clean up empty event arrays
      if (this._events[event].length === 0) {
        delete this._events[event];
      }
    }
  
    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
      if (!this._events[event]) return;
      
      this._events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }