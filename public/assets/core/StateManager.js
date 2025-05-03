/**
 * StateManager using pub/sub pattern
 * Centralized application state with subscription mechanism
 * @module core/StateManager
 */

export default class StateManager {
    /**
     * Create a new StateManager instance
     * @param {Object} initialState - Initial application state
     */
    constructor(initialState = {}) {
      this._state = initialState;
      this._subscribers = {};
      this._nextSubscriberId = 1;
    }
  
    /**
     * Get current state or a specific part of it
     * @param {string} [path] - Optional dot notation path (e.g., 'cards.1')
     * @returns {*} The requested state
     */
    getState(path) {
      if (!path) return { ...this._state };
      
      return path.split('.').reduce((obj, key) => 
        obj && obj[key] !== undefined ? obj[key] : undefined, 
        this._state
      );
    }
  
    /**
     * Update state and notify subscribers
     * @param {string} path - Dot notation path to update
     * @param {*} value - New value
     */
    setState(path, value) {
      // Handle root state update
      if (path === '') {
        this._state = { ...value };
        this._notifySubscribers('');
        return;
      }
  
      const parts = path.split('.');
      let current = this._state;
      const newState = { ...this._state };
      current = newState;
      
      // Navigate to the nested property
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        
        // Create path if it doesn't exist
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        } else {
          // Clone to avoid mutating existing objects
          current[key] = { ...current[key] };
        }
        
        current = current[key];
      }
      
      // Set the value at the final key
      const lastKey = parts[parts.length - 1];
      
      // Only update if value actually changed
      if (current[lastKey] !== value) {
        current[lastKey] = value;
        this._state = newState;
        this._notifySubscribers(path);
      }
    }
  
    /**
     * Subscribe to state changes
     * @param {string} path - Dot notation path to watch, or '' for all changes
     * @param {Function} callback - Function to call when state changes
     * @returns {number} Subscription ID for unsubscribing
     */
    subscribe(path, callback) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      const id = this._nextSubscriberId++;
      
      if (!this._subscribers[path]) {
        this._subscribers[path] = {};
      }
      
      this._subscribers[path][id] = callback;
      return id;
    }
  
    /**
     * Unsubscribe from state changes
     * @param {number} id - Subscription ID to remove
     */
    unsubscribe(id) {
      // Look through all paths for this subscription ID
      Object.keys(this._subscribers).forEach(path => {
        if (this._subscribers[path][id]) {
          delete this._subscribers[path][id];
        }
      });
    }
  
    /**
     * Notify subscribers of state changes
     * @param {string} changedPath - Path that changed
     * @private
     */
    _notifySubscribers(changedPath) {
      // Call subscribers for the exact path
      if (this._subscribers[changedPath]) {
        Object.values(this._subscribers[changedPath]).forEach(callback => {
          callback(this.getState(changedPath), changedPath);
        });
      }
      
      // Call subscribers for parent paths
      const parts = changedPath.split('.');
      while (parts.length > 0) {
        parts.pop();
        const parentPath = parts.join('.');
        if (this._subscribers[parentPath]) {
          Object.values(this._subscribers[parentPath]).forEach(callback => {
            callback(this.getState(parentPath), changedPath);
          });
        }
      }
      
      // Call subscribers for root path (listen to all changes)
      if (this._subscribers['']) {
        Object.values(this._subscribers['']).forEach(callback => {
          callback(this.getState(), changedPath);
        });
      }
    }
  }