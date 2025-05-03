/**
 * Common types used throughout the application
 */

/**
 * Position coordinates
 */
export interface Position {
    x: number; 
    y: number;
  }
  
  /**
   * Dimensions
   */
  export interface Dimensions {
    width: number;
    height: number;
  }
  
  /**
   * Card specification with position and dimensions
   */
  export interface CardSpec {
    /** Scenario number */
    scenarioId: number;
    /** X position */
    x: number;
    /** Y position */
    y: number;
    /** Width */
    width: number;
    /** Height */
    height: number;
  }
  
  /**
   * Endpoint on a card (dot)
   */
  export interface ConnectionEndpoint {
    /** Parent card element */
    cardElement: HTMLElement;
    /** The dot element itself */
    dotElement: HTMLDivElement;
  }
  
  /**
   * Side indices for dots
   */
  export enum DotSide {
    TOP = 0,
    RIGHT = 1,
    BOTTOM = 2,
    LEFT = 3,
    TOP_LEFT = 4,
    TOP_RIGHT = 5,
    BOTTOM_RIGHT = 6,
    BOTTOM_LEFT = 7
  }
  
  /**
   * Connection between two cards
   */
  export interface Connection {
    /** Unique identifier */
    id: string;
    /** Source card ID */
    fromCardId: number;
    /** Source dot side */
    fromSide: DotSide;
    /** Target card ID */
    toCardId: number;
    /** Target dot side */
    toSide: DotSide;
  }
  
  /**
   * Layout specification for saving/loading
   */
  export interface LayoutSpec {
    /** Card specifications */
    cards: CardSpec[];
    /** Connection specifications */
    arrows: Connection[];
  }
  
  /**
   * Line connecting two endpoints
   */
  export interface ConnectorLine {
    /** Unique identifier */
    id: string;
    /** Source endpoint */
    from: ConnectionEndpoint;
    /** Target endpoint */
    to: ConnectionEndpoint;
    /** SVG line element */
    svg: SVGLineElement;
  }