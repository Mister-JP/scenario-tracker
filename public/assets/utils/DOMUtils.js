/**
 * DOM-specific utility functions
 * @module utils/DOMUtils
 */

/**
 * Get the header height for proper positioning
 * @returns {number} Height in pixels
 */
export function getHeaderOffset() {
    const header = document.querySelector('header');
    return (header ? header.offsetHeight : 48) + 8;
  }
  
  /**
   * Create an HTML element with optional class and attributes
   * @param {string} tag - Element tag name
   * @param {string} [className] - Optional CSS class
   * @param {Object} [attributes] - Optional attributes
   * @returns {HTMLElement} The created element
   */
  export function createElement(tag, className, attributes) {
    const element = document.createElement(tag);
    
    if (className) {
      element.className = className;
    }
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    return element;
  }
  
  /**
   * Create an SVG element with optional attributes
   * @param {string} tag - SVG tag name
   * @param {Object} [attributes] - Optional attributes
   * @returns {SVGElement} The created SVG element
   */
  export function createSvgElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    return element;
  }
  
  /**
   * Calculate element center coordinates
   * @param {HTMLElement} element - Element to get center for
   * @returns {Object} {x, y} coordinates of center
   */
  export function calculateElementCenterCoordinates(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  
  /**
   * Calculate distance between two points
   * @param {number} x1 - First point x
   * @param {number} y1 - First point y
   * @param {number} x2 - Second point x
   * @param {number} y2 - Second point y
   * @returns {number} Distance between points
   */
  export function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }