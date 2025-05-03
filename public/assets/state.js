/*********************************************************************
 *  Global "single-source-of-truth" store.
 *  ---------------------------------------------------------------
 *  • Keeps the current host we're embedding (e.g. http://localhost:8080)
 *  • Keeps a Map <scenario-number, DOM-element-for-that-card>
 *  • Keeps an array of connections between cards
 *  • Exposes a method setHost() that rewires every iframe src.
 *********************************************************************/
/** Which scenarios exist.
 *  -- Change this list and reload → Viewer shows more/less cards. */
export const SCENARIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
/* ------------------------------------------------------------------ */
/*                              Store                                  */
/* ------------------------------------------------------------------ */
class Store {
    constructor() {
        /** Base site we point each iframe at (persisted in localStorage) */
        this.host = localStorage.getItem("svr-host") ?? "http://localhost:8080";
        /** Map so other modules can fetch the DOM element for a scenario */
        this.cards = new Map();
        /** Connections between cards */
        this.connections = [];
    }
    /** Change host + hot-reload all iframes */
    setHost(url) {
        // remove trailing slash so "//" never appears in the final URL
        this.host = url.trim().replace(/\/$/, "");
        localStorage.setItem("svr-host", this.host);
        // Iterate through every stored card and update its <iframe>.src
        this.cards.forEach((el, n) => {
            const frame = el.querySelector("iframe");
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
