/*********************************************************************
 *  Builds the dark header bar:
 *    Tracking: <host> ✎      [Load layout] [Save layout] [Reset]
 *
 *  • Lets you edit the host by clicking the pencil.
 *  • Save → downloads JSON.  Load → uploads JSON.
 *  • Reset → calls layout.resetGrid().
 *********************************************************************/

import { store }           from "./state.js";
import { resetGrid,
         snapshot,
         applyLayout }     from "./layout.js";

export function makeHeader() {
  /* ---------- Root <header> ---------- */
  const hd = document.createElement("header");

  /* ---------- “Tracking: …” label + pencil ---------- */
  const h1 = document.createElement("h1");
  h1.innerHTML =
    `Tracking:&nbsp;<span id="host-value">${store.host}</span>`;
  hd.appendChild(h1);

  const edit = document.createElement("img");
  edit.id  = "edit-host";
  edit.alt = "edit";
  edit.src = "icons/edit.svg";   // tiny pencil SVG
  h1.appendChild(edit);

  /* ---------- Buttons (CSS absolutely positions to right) ---------- */
  const btnLoad  = document.createElement("button");
  const btnSave  = document.createElement("button");
  const btnReset = document.createElement("button");

  btnLoad.textContent  = "Load layout";
  btnSave.textContent  = "Save layout";
  btnReset.textContent = "Reset";

  hd.appendChild(btnLoad);
  hd.appendChild(btnSave);
  hd.appendChild(btnReset);

  /* Hidden <input type=file> so the “Load” button can open a file picker */
  const fileIn = document.createElement("input");
  fileIn.type = "file";
  fileIn.accept = ".json";
  fileIn.style.display = "none";
  hd.appendChild(fileIn);

  /* Mount header before any measurement of offsetHeight happens */
  document.body.appendChild(hd);

  /* ---------- Behaviour wiring ---------- */

  /* Edit host → prompt() + store.setHost() */
  edit.addEventListener("click", () => {
    const cur = store.host;
    const val = prompt("New host to track", cur);
    if (val && val !== cur) {
      store.setHost(val);
      (document.getElementById("host-value")!).textContent = store.host;
    }
  });

  /* Plain reset */
  btnReset.addEventListener("click", resetGrid);

  /* Save layout → JSON blob download */
  btnSave.addEventListener("click", () => {
    const name = prompt("Save as…", Date.now().toString()) || "layout";
    const blob = new Blob([snapshot()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `layout-${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* Load layout (proxy through the hidden file input) */
  btnLoad.addEventListener("click", () => fileIn.click());

  fileIn.addEventListener("change", e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then(applyLayout);
    fileIn.value = "";      // allow picking the same file again later
  });
}
