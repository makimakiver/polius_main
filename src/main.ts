import { PolliusScene } from "./scene3d";
import { mountWallet } from "./wallet";
import "./styles.css";

const SIDEBAR_KEY = "pollius:sidebar";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app root");

app.innerHTML = `
  <section class="shell">
    <aside class="sidebar">
      <p class="eyebrow">OSS Terrarium</p>
      <h1>Pollius</h1>
      <p class="summary">A living world you grow, then let go.</p>
    </aside>

    <section class="workspace">
      <header class="toolbar">
        <button id="sidebar-toggle" type="button" aria-label="Toggle sidebar">☰</button>
        <span class="eyebrow toolbar-title">Living World</span>
        <div class="wallet-mount">
          <span class="wallet-network">Sui · Testnet</span>
          <div id="wallet"></div>
        </div>
      </header>
      <div class="map-frame">
        <div id="world-3d" class="world-3d" aria-label="3D Pollius world"></div>
      </div>
    </section>
  </section>
`;

// Restore persisted sidebar state.
const shell = app.querySelector<HTMLElement>(".shell");
if (shell && localStorage.getItem(SIDEBAR_KEY) === "collapsed") {
  shell.classList.add("is-collapsed");
}

// Sidebar toggle (ChatGPT-style hide/show).
document.querySelector("#sidebar-toggle")?.addEventListener("click", () => {
  if (!shell) return;
  const collapsed = shell.classList.toggle("is-collapsed");
  localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "open");
});

// 3D scene.
const worldHost = document.querySelector<HTMLElement>("#world-3d");
if (worldHost) {
  const scene = new PolliusScene(worldHost);
  scene.start();
}

// Wallet island. The dapp-kit button shows the connected address itself, so the
// page no longer renders a separate status line.
const walletHost = document.querySelector<HTMLElement>("#wallet");
if (walletHost) {
  mountWallet(walletHost);
}
