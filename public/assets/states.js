export const SCENARIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
/** ---------- Reactive global state ---------- */
class Store {
    constructor() {
        this.host = localStorage.getItem("svr-host") ?? "http://localhost:8080";
        this.cards = new Map(); // scenario n → DOM
    }
    setHost(url) {
        this.host = url.trim().replace(/\/$/, ""); // drop trailing slash
        localStorage.setItem("svr-host", this.host);
        // refresh iframes
        this.cards.forEach((el, n) => {
            const f = el.querySelector("iframe");
            f.src = `${this.host}?scenario=${n}`;
        });
    }
}
export const store = new Store();
