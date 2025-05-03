/*********************************************************************
 *  Global "single-source-of-truth" store.
 *  ---------------------------------------------------------------
 *  • Keeps the current host we're embedding (e.g. http://localhost:8080)
 *  • Keeps a Map <scenario-number, DOM-element-for-that-card>
 *  • Keeps an array of connections between cards
 *  • Exposes a method setHost() that rewires every iframe src.
 *********************************************************************/

/** A simple helper type for coordinates */
export interface Pos { x: number; y: number }

/** A helper type if you ever want width/height as well */
export interface Dim { w: number; h: number }

/** Which scenarios exist.  
 *  -- Change this list and reload → Viewer shows more/less cards. */
export const SCENARIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Connection endpoint specification */
export interface ConnectionEndpoint {
  card: number;   // Card ID (scenario number)
  dot: number;    // Dot index on the card
}

/** Connection between cards */
export interface Connection {
  id: string;                   // Unique identifier
  from: ConnectionEndpoint;     // Source endpoint
  to: ConnectionEndpoint;       // Target endpoint
}

/** What information we need to re-create a card via JSON */
export interface CardSpec extends Pos, Dim { 
  n: number;  // Scenario number
}

/** Complete layout specification for saving/loading */
export interface LayoutSpec {
  cards: CardSpec[];
  connections: Connection[];
}

/* ------------------------------------------------------------------ */
/*                              Store                                  */
/* ------------------------------------------------------------------ */
class Store {
  /** Base site we point each iframe at (persisted in localStorage) */
  host = localStorage.getItem("svr-host") ?? "http://localhost:8080";

  /** Map so other modules can fetch the DOM element for a scenario */
  cards: Map<number, HTMLElement> = new Map();
  
  /** Connections between cards */
  connections: Connection[] = [];

  /** Change host + hot-reload all iframes */
  setHost(url: string) {
    // remove trailing slash so "//" never appears in the final URL
    this.host = url.trim().replace(/\/$/, "");
    localStorage.setItem("svr-host", this.host);

    // Iterate through every stored card and update its <iframe>.src
    this.cards.forEach((el, n) => {
      const frame = el.querySelector("iframe")!;
      frame.src = `${this.host}?scenario=${n}`;
    });
  }
  
  /** Clear all connections */
  clearConnections() {
    this.connections = [];
  }
}

/** Export a singleton instance so the whole app shares one store */
export const store = new Store();