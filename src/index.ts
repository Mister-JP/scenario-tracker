const SCENARIOS = [1,2,3,4,5,6,7,8,9];       // easy to edit

const host = "http://localhost:8080";         // where scenario-site runs
const grid = document.getElementById("grid")!;

SCENARIOS.forEach(n => {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h2");
  title.textContent = `Scenario ${n}`;
  card.appendChild(title);

  const frame = document.createElement("iframe");
  frame.src = `${host}?scenario=${n}`;
  card.appendChild(frame);

  grid.appendChild(card);
});
