/**
 * Utility functions for the Scenario Viewer
 */

const utils = {
    /**
     * Get the header height for proper positioning
     * @returns {number} Height in pixels
     */
    getHeaderOffset() {
      const header = document.querySelector('header');
      return (header ? header.offsetHeight : 48) + 8;
    },
  
    /**
     * Create an HTML element with optional class and attributes
     * @param {string} tag - Element tag name
     * @param {string} [className] - Optional CSS class
     * @param {Object} [attributes] - Optional attributes
     * @returns {HTMLElement} The created element
     */
    createElement(tag, className, attributes) {
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
    },
  
    /**
     * Create an SVG element with optional attributes
     * @param {string} tag - SVG tag name
     * @param {Object} [attributes] - Optional attributes
     * @returns {SVGElement} The created SVG element
     */
    createSvgElement(tag, attributes) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      
      return element;
    },
  
    /**
     * Get the center position of an element
     * @param {HTMLElement} element - The element
     * @returns {Object} {x, y} coordinates
     */
    getElementCenter(element) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    },
  
    /**
     * Calculate distance between two points
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {number} Distance between points
     */
    calculateDistance(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
  
    /**
     * Ultra-simple logging (under 20 lines)
     */
    log: {
      level: localStorage.getItem('log-level') || 'warn',
      levels: { debug: 0, info: 1, warn: 2, error: 3 },
      
      debug(component, message, data) {
        if (this.levels[this.level] <= this.levels.debug) {
          console.debug(`[${component}]`, message, data || '');
        }
      },
      
      info(component, message, data) {
        if (this.levels[this.level] <= this.levels.info) {
          console.info(`[${component}]`, message, data || '');
        }
      },
      
      warn(component, message, data) {
        if (this.levels[this.level] <= this.levels.warn) {
          console.warn(`[${component}]`, message, data || '');
        }
      },
      
      error(component, message, data) {
        if (this.levels[this.level] <= this.levels.error) {
          console.error(`[${component}]`, message, data || '');
        }
      },
      
      setLevel(level) {
        if (this.levels[level] !== undefined) {
          this.level = level;
          localStorage.setItem('log-level', level);
        }
      }
    }
  };