// Helper to grab a query value
function getQueryParam(key: string): string | null {
    return new URLSearchParams(window.location.search).get(key);
  }
  
  const scenario = getQueryParam("scenario");
  
  // Valid numbers 1‑9 ?  If not, bounce to default page
  if (!scenario || !/^[1-9]$/.test(scenario)) {
    document.body.innerHTML =
      "<h1>Oops – add ?scenario=1‑9 to the URL</h1>";
  } else {
    // Fetch the matching HTML fragment and inject it
    fetch(`scenarios/${scenario}.html`)
      .then(res => res.text())
      .then(html => {
        document.body.innerHTML = html;
      })
      .catch(err => {
        console.error(err);
        document.body.innerHTML =
          "<h1>Couldn’t load that scenario 😢</h1>";
      });
  }
  