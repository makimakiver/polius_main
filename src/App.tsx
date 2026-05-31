import { useEffect, useState } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { WalletIsland } from "./wallet";

const SIDEBAR_KEY = "pollius:sidebar";

export default function App() {
  // ChatGPT-style collapsible sidebar, persisted to localStorage.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "collapsed"
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "open");
  }, [collapsed]);

  return (
    <section className={collapsed ? "shell is-collapsed" : "shell"}>
      <aside className="sidebar">
        <p className="eyebrow">OSS Terrarium</p>
        <h1>Pollius</h1>
        <p className="summary">A living world you grow, then let go.</p>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <button
            id="sidebar-toggle"
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((value) => !value)}
          >
            ☰
          </button>
          <span className="eyebrow toolbar-title">Living World</span>
          <div className="wallet-mount">
            <span className="wallet-network">Sui · Testnet</span>
            <WalletIsland />
          </div>
        </header>

        <div className="map-frame">
          <SceneCanvas className="world-3d" />
        </div>
      </section>
    </section>
  );
}
