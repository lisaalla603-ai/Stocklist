/* Fills the #topbar-nav slot based on current session state. */
function renderNav() {
  const slot = document.getElementById("topbar-nav");
  if (!slot) return;
  const session = StocklistDB.getSession();

  let links = `
    <a href="catalogue.html">Order supplies</a>
    <a href="index.html#industries">Who it's for</a>
  `;
  let cta = "";

  if (session && session.type === "business") {
    const biz = StocklistDB.getBusiness(session.id);
    links += `<a href="dashboard.html">Dashboard</a>`;
    cta = `<a class="nav-ghost" href="#" id="logout-link">Log out — ${biz ? biz.businessName : ""}</a>`;
  } else if (session && session.type === "supplier") {
    const sup = StocklistDB.getSupplier(session.id);
    links += `<a href="supplier-dashboard.html">Supplier dashboard</a>`;
    cta = `<a class="nav-ghost" href="#" id="logout-link">Log out — ${sup ? sup.name : ""}</a>`;
  } else {
    links += `<a href="login.html">Log in</a>`;
    cta = `<a class="nav-cta" href="signup.html">Get started</a>`;
  }

  slot.innerHTML = links + cta;

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      StocklistDB.clearSession();
      window.location.href = "index.html";
    });
  }
}
document.addEventListener("DOMContentLoaded", renderNav);
