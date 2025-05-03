/**
 * SVG-specific rendering operations
 * Specializes in SVG connection rendering
 * @module views/SVGRenderer
 */
import { ConnectorConfig } from '../core/Config.js';
import { createSvgElement } from '../utils/DOMUtils.js';
import { logger } from '../utils/Logger.js';

export default class SVGRenderer {
  constructor() {
    this._svgContainer = null;
    this._connections = new Map();
  }
  
  /**
   * Create SVG container for connections
   * @returns {SVGElement} The SVG container element
   */
  createSVGContainer() {
    const svgContainer = createSvgElement('svg', {
      'id': 'connections-svg',
      'style': 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;'
    });
    
    // Add arrow marker definition
    const defs = createSvgElement('defs');
    const marker = createSvgElement('marker', {
      'id': 'arrow-head',
      'markerWidth': String(ConnectorConfig.ARROW_SIZE.WIDTH),
      'markerHeight': String(ConnectorConfig.ARROW_SIZE.HEIGHT),
      'refX': '7',
      'refY': '3.5',
      'orient': 'auto'
    });
    
    const polygon = createSvgElement('polygon', {
      'points': '0 0, 10 3.5, 0 7',
      'fill': ConnectorConfig.LINE_COLOR
    });
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svgContainer.appendChild(defs);
    
    document.body.appendChild(svgContainer);
    
    this._svgContainer = svgContainer;
    return svgContainer;
  }

  /**
   * Create a connection line element
   * @param {Object} connectionData - Connection properties
   * @returns {SVGElement} SVG line element
   */
  createConnectionLine(connectionData) {
    const line = createSvgElement('line', {
      'data-id': connectionData.id,
      'stroke': connectionData.color || ConnectorConfig.LINE_COLOR,
      'stroke-width': String(connectionData.width || ConnectorConfig.LINE_WIDTH),
      'marker-end': 'url(#arrow-head)',
      'pointer-events': 'none'
    });
    
    this._svgContainer.appendChild(line);
    this._connections.set(connectionData.id, line);
    
    return line;
  }
  
  /**
   * Update connection line coordinates
   * @param {string} connectionId - Connection ID
   * @param {Object} coordinates - {x1, y1, x2, y2} coordinates
   */
  updateConnectionCoordinates(connectionId, coordinates) {
    const line = this._connections.get(connectionId);
    if (!line) return;
    
    line.setAttribute('x1', String(coordinates.x1));
    line.setAttribute('y1', String(coordinates.y1));
    line.setAttribute('x2', String(coordinates.x2));
    line.setAttribute('y2', String(coordinates.y2));
  }
  
  /**
   * Remove a connection line
   * @param {string} connectionId - Connection ID to remove
   */
  removeConnection(connectionId) {
    const line = this._connections.get(connectionId);
    if (!line) return;
    
    line.remove();
    this._connections.delete(connectionId);
  }
}