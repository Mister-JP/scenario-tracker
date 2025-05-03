/**
 * Utility functions used throughout the application
 */
/**
 * Returns the vertical offset from the top of the viewport needed to avoid overlapping the header
 * @returns The vertical offset in pixels
 */
export function getHeaderOffset() {
    const header = document.querySelector("header");
    return (header ? header.offsetHeight : 48) + 8;
}
/**
 * Creates an element with given tag, className, and optional attributes
 * @param tag - HTML tag name
 * @param className - CSS class name
 * @param attributes - Key-value pairs of attributes to set
 * @returns The created HTML element
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
 * Creates an SVG element with the given namespace
 * @param tag - SVG tag name
 * @param attributes - Key-value pairs of attributes to set
 * @returns The created SVG element
 */
export function createSvgElement(tag, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    return element;
}
/**
 * Gets the center point of an element
 * @param element - The HTML element
 * @returns The center coordinates {x, y}
 */
export function getElementCenter(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}
/**
 * Extracts a percentage value from a CSS string (e.g., "50%" -> 0.5)
 * @param value - CSS percentage value
 * @returns Numeric value between 0-1, or 0 if invalid
 */
export function extractPercentValue(value) {
    const match = value.match(/^([\d.]+)%$/);
    return match ? parseFloat(match[1]) / 100 : 0;
}
/**
 * Calculates distance between two points
 * @param x1 - First point x-coordinate
 * @param y1 - First point y-coordinate
 * @param x2 - Second point x-coordinate
 * @param y2 - Second point y-coordinate
 * @returns The distance between points
 */
export function calculateDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
//# sourceMappingURL=index.js.map