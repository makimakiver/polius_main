# Pollius Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fresh, minimal Vite + TypeScript web page in `/Users/makimakiver/polius_main` with an animated Three.js centerpiece, a collapsible (ChatGPT-style) sidebar, and a Sui wallet connect button — borrowing the visual identity of `pollius_oss` without its economic simulation.

**Architecture:** Vanilla-TS app that builds a static shell once. A single React island (`wallet.tsx`) hosts the Sui `ConnectButton` and bridges the connected address back via callback. A self-contained `PolliusScene` class renders a rotating glowing icosahedron with a drifting particle field and auto-orbit/drag camera. A header toggle collapses the sidebar, persisted to `localStorage`.

**Tech Stack:** Vite 7, TypeScript (ES2022), Three.js, React 19, `@mysten/dapp-kit`, `@tanstack/react-query`, Vitest.

**Reference source (read-only):** `/Users/makimakiver/pollius_oss/src/{main.ts,world3d.ts,wallet.tsx,styles.css}` — lift and trim from these. Do not modify `pollius_oss`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `index.html` | Mounts `/src/main.ts` into `<main id="app">`. |
| `package.json` | Deps, scripts (`dev`/`build`/`test`). |
| `tsconfig.json` | TS compiler config (ES2022, bundler, JSX). |
| `vite.config.ts` | Vite + Vitest config (node test env). |
| `src/format.ts` | `shortAddress()` helper (pure, unit-tested). |
| `src/format.test.ts` | Unit tests for `shortAddress`. |
| `src/wallet.tsx` | Sui `ConnectButton` React island + `mountWallet`. |
| `src/scene3d.ts` | `PolliusScene` — trimmed Three.js centerpiece. |
| `src/main.ts` | Builds shell, mounts scene + wallet, sidebar toggle. |
| `src/styles.css` | Trimmed style tokens + shell/wallet/frame/collapse layout. |

---

## Task 1: Scaffold the project

**Files:**
- Create: `/Users/makimakiver/polius_main/package.json`
- Create: `/Users/makimakiver/polius_main/tsconfig.json`
- Create: `/Users/makimakiver/polius_main/vite.config.ts`
- Create: `/Users/makimakiver/polius_main/index.html`
- Create: `/Users/makimakiver/polius_main/.gitignore`

- [ ] **Step 1: Initialize git**

Run from `/Users/makimakiver/polius_main`:
```bash
git init
```
Expected: `Initialized empty Git repository`.

- [ ] **Step 2: Write `.gitignore`**

```
node_modules
dist
.DS_Store
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "pollius-lite",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/react": "^19.2.15",
    "@types/react-dom": "^19.2.3",
    "@types/three": "^0.184.1",
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "vitest": "^4.0.0"
  },
  "dependencies": {
    "@mysten/dapp-kit": "^1.0.6",
    "@mysten/sui": "^2.17.0",
    "@tanstack/react-query": "^5.100.14",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "three": "^0.184.0"
  }
}
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Write `vite.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  build: {
    target: "es2022",
    minify: "esbuild"
  },
  test: {
    environment: "node"
  }
});
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pollius</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: completes without errors; `node_modules` created.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold pollius-lite Vite project"
```

---

## Task 2: `shortAddress` helper (TDD)

**Files:**
- Create: `/Users/makimakiver/polius_main/src/format.ts`
- Test: `/Users/makimakiver/polius_main/src/format.test.ts`

- [ ] **Step 1: Write the failing test**

`src/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { shortAddress } from "./format";

describe("shortAddress", () => {
  it("keeps the 0x prefix and the last 4 chars joined by an ellipsis", () => {
    expect(shortAddress("0x1234567890abcdef")).toBe("0x1234…cdef");
  });

  it("returns short inputs unchanged", () => {
    expect(shortAddress("0x12")).toBe("0x12");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/format.test.ts`
Expected: FAIL — cannot resolve `./format` / `shortAddress is not a function`.

- [ ] **Step 3: Write minimal implementation**

`src/format.ts`:
```ts
/** Format a wallet address as `0x1234…cdef`. Inputs ≤ 10 chars pass through. */
export function shortAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/format.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/format.ts src/format.test.ts
git commit -m "feat: add shortAddress helper with tests"
```

---

## Task 3: Wallet React island

**Files:**
- Create: `/Users/makimakiver/polius_main/src/wallet.tsx`

- [ ] **Step 1: Write `src/wallet.tsx`**

```tsx
import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectButton,
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
  useCurrentAccount
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import "@mysten/dapp-kit/dist/index.css";

// The ONE React surface in an otherwise vanilla-TS app. @mysten/dapp-kit is
// React-only, so it lives in an isolated island mounted into a single host node;
// the connected account is bridged back to the vanilla app via a callback.

export type AccountListener = (address: string | null) => void;

const { networkConfig } = createNetworkConfig({
  testnet: { network: "testnet", url: getJsonRpcFullnodeUrl("testnet") },
  mainnet: { network: "mainnet", url: getJsonRpcFullnodeUrl("mainnet") },
  devnet: { network: "devnet", url: getJsonRpcFullnodeUrl("devnet") }
});

const queryClient = new QueryClient();

function AccountBridge({ onAccount }: { onAccount: AccountListener }) {
  const account = useCurrentAccount();
  useEffect(() => {
    onAccount(account?.address ?? null);
  }, [account, onAccount]);
  return <ConnectButton connectText="Connect Sui Wallet" />;
}

/**
 * Mount the wallet UI into `host`. `onAccount` fires with the active address
 * (or null when disconnected). Returns a teardown function.
 */
export function mountWallet(host: HTMLElement, onAccount: AccountListener): () => void {
  const root: Root = createRoot(host);
  root.render(
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <AccountBridge onAccount={onAccount} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
  return () => root.unmount();
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If `@mysten/sui/jsonRpc` export differs in the installed version, adjust the import to the version's fullnode-URL helper; the rest is unchanged.)

- [ ] **Step 3: Commit**

```bash
git add src/wallet.tsx
git commit -m "feat: add Sui wallet connect island"
```

---

## Task 4: `PolliusScene` 3D centerpiece

**Files:**
- Create: `/Users/makimakiver/polius_main/src/scene3d.ts`

- [ ] **Step 1: Write `src/scene3d.ts`**

```ts
import * as THREE from "three";

// A self-contained decorative scene: a slowly rotating glowing icosahedron with
// an additive halo and an upward-drifting particle field, lit golden-hour style,
// under an auto-orbiting camera the user can drag to look around. Trimmed from
// pollius_oss/src/world3d.ts with no simulation dependency.

const SKY_TOP = 0x7fa8c9;
const SKY_HORIZON = 0xe7d2a8;
const ORB_COLOR = 0xf2b53d;

const GLOW_TEXTURE = makeGlowTexture();

export class PolliusScene {
  private readonly host: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private frameId = 0;

  private readonly disposables: Array<{ dispose: () => void }> = [];
  private readonly motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.15 : 1;

  private orb!: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshStandardMaterial>;
  private halo!: THREE.Sprite;
  private particles!: ParticleField;

  // Camera rig
  private orbitAngle = 0.7;
  private targetOrbitAngle = 0.7;
  private elevation = 0.55;
  private targetElevation = 0.55;
  private readonly cameraRadius = 9;
  private readonly lookTarget = new THREE.Vector3(0, 0.2, 0);
  private readonly pointerAbort = new AbortController();
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.host.replaceChildren(this.renderer.domElement);
    this.bindPointerControls();

    this.scene.background = this.track(makeSkyTexture());

    this.buildLighting();
    this.buildOrb();
    this.particles = new ParticleField(this.scene, this.disposables);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  start() {
    const animate = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;

      this.orb.rotation.y += dt * 0.4 * this.motion;
      this.orb.rotation.x += dt * 0.12 * this.motion;
      this.orb.position.y = 0.2 + Math.sin(t * 0.8) * 0.12 * this.motion;
      this.halo.position.copy(this.orb.position);
      this.orb.material.emissiveIntensity = 0.5 + Math.sin(t * 1.6) * 0.12;

      this.particles.update(dt, this.motion);

      if (!this.dragging) this.targetOrbitAngle += dt * 0.05 * this.motion;
      this.orbitAngle = THREE.MathUtils.damp(this.orbitAngle, this.targetOrbitAngle, 8, dt);
      this.elevation = THREE.MathUtils.damp(this.elevation, this.targetElevation, 8, dt);
      const elevation = this.elevation + Math.sin(t * 0.2) * 0.015 * this.motion;
      this.camera.position.set(
        Math.sin(this.orbitAngle) * this.cameraRadius * Math.cos(elevation),
        Math.sin(elevation) * this.cameraRadius + 1.2,
        Math.cos(this.orbitAngle) * this.cameraRadius * Math.cos(elevation)
      );
      this.camera.lookAt(this.lookTarget);

      this.renderer.render(this.scene, this.camera);
      this.frameId = window.requestAnimationFrame(animate);
    };
    this.frameId = window.requestAnimationFrame(animate);
  }

  destroy() {
    window.cancelAnimationFrame(this.frameId);
    this.pointerAbort.abort();
    this.resizeObserver.disconnect();
    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  private buildLighting() {
    const hemi = new THREE.HemisphereLight(0xbcd6f0, 0x5a6b3c, 0.9);
    const sun = new THREE.DirectionalLight(0xffe6b0, 2.2);
    sun.position.set(6, 8, 4);
    const fill = new THREE.DirectionalLight(0x9fb6d6, 0.5);
    fill.position.set(-5, 3, -4);
    this.scene.add(hemi, sun, fill);
  }

  private buildOrb() {
    const geo = this.track(new THREE.IcosahedronGeometry(1.6, 2));
    const mat = this.track(
      new THREE.MeshStandardMaterial({
        color: ORB_COLOR,
        emissive: ORB_COLOR,
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.35,
        flatShading: true
      })
    );
    this.orb = new THREE.Mesh(geo, mat);
    this.scene.add(this.orb);

    this.halo = makeGlowSprite(ORB_COLOR, 6, this.disposables);
    this.scene.add(this.halo);
  }

  private bindPointerControls() {
    const canvas = this.renderer.domElement;
    const signal = this.pointerAbort.signal;
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        this.dragging = true;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;
        this.host.classList.add("is-dragging");
        canvas.setPointerCapture(event.pointerId);
      },
      { signal }
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (!this.dragging) return;
        const dx = event.clientX - this.lastPointerX;
        const dy = event.clientY - this.lastPointerY;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;
        this.targetOrbitAngle -= dx * 0.008;
        this.targetElevation = THREE.MathUtils.clamp(this.targetElevation + dy * 0.004, 0.2, 1.1);
      },
      { signal }
    );
    const release = (event: PointerEvent) => {
      this.dragging = false;
      this.host.classList.remove("is-dragging");
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerup", release, { signal });
    canvas.addEventListener("pointercancel", release, { signal });
  }

  private track<T extends { dispose: () => void }>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private resize() {
    const width = this.host.clientWidth || 900;
    const height = this.host.clientHeight || 560;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

// ── Particle field ──────────────────────────────────────────────────────────
class ParticleField {
  private readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly velocities: Float32Array;
  private readonly count = 220;

  constructor(scene: THREE.Scene, disposables: Array<{ dispose: () => void }>) {
    const positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count);
    for (let i = 0; i < this.count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 9 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      this.velocities[i] = 0.2 + Math.random() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: GLOW_TEXTURE,
      color: new THREE.Color(0xfff0c4),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.points = new THREE.Points(geo, mat);
    scene.add(this.points);
    disposables.push(geo, mat);
  }

  update(dt: number, motion: number) {
    const positions = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = positions.array as Float32Array;
    for (let i = 0; i < this.count; i += 1) {
      array[i * 3 + 1] += this.velocities[i] * 0.8 * motion * dt;
      if (array[i * 3 + 1] > 7.5) {
        array[i * 3 + 1] = -2;
        array[i * 3] = (Math.random() - 0.5) * 16;
        array[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
    }
    positions.needsUpdate = true;
  }
}

// ── Texture / sprite helpers ──────────────────────────────────────────────────
function makeGlowSprite(
  color: number,
  scale: number,
  disposables: Array<{ dispose: () => void }>
): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map: GLOW_TEXTURE,
    color,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  disposables.push(material);
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  return sprite;
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.65)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, hexString(SKY_TOP));
    gradient.addColorStop(0.6, "#b9c6c0");
    gradient.addColorStop(1, hexString(SKY_HORIZON));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 256);

    const glow = ctx.createRadialGradient(16, 232, 0, 16, 232, 120);
    glow.addColorStop(0, "rgba(255,238,196,0.85)");
    glow.addColorStop(1, "rgba(255,238,196,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hexString(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene3d.ts
git commit -m "feat: add PolliusScene 3D centerpiece"
```

---

## Task 5: Shell, mounts, and collapsible sidebar

**Files:**
- Create: `/Users/makimakiver/polius_main/src/main.ts`

- [ ] **Step 1: Write `src/main.ts`**

```ts
import { PolliusScene } from "./scene3d";
import { mountWallet } from "./wallet";
import { shortAddress } from "./format";
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
      <div class="wallet-box">
        <span class="eyebrow">Sui Wallet · Testnet</span>
        <div id="wallet"></div>
        <p id="wallet-status" class="wallet-status">Not connected</p>
      </div>
    </aside>

    <section class="workspace">
      <header class="toolbar">
        <button id="sidebar-toggle" type="button" aria-label="Toggle sidebar">☰</button>
        <span class="eyebrow">Living World</span>
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

// Wallet island → status line bridge.
const walletHost = document.querySelector<HTMLElement>("#wallet");
if (walletHost) {
  mountWallet(walletHost, (address) => {
    const status = document.querySelector<HTMLElement>("#wallet-status");
    if (status) {
      status.textContent = address ? `Connected · ${shortAddress(address)}` : "Not connected";
    }
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: add shell, scene/wallet mounts, collapsible sidebar"
```

---

## Task 6: Styles

**Files:**
- Create: `/Users/makimakiver/polius_main/src/styles.css`

- [ ] **Step 1: Write `src/styles.css`**

```css
:root {
  color-scheme: light;
  --paper: oklch(0.97 0.008 92);
  --surface: oklch(0.995 0.006 92);
  --ink: oklch(0.22 0.025 78);
  --muted: oklch(0.48 0.025 78);
  --line: oklch(0.86 0.018 82);
  --gold: oklch(0.72 0.13 82);
  --blue: oklch(0.58 0.1 238);
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  background: var(--paper);
  color: var(--ink);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(90deg, oklch(0.92 0.018 92) 1px, transparent 1px),
    linear-gradient(0deg, oklch(0.92 0.018 92) 1px, transparent 1px),
    var(--paper);
  background-size: 28px 28px;
}

button {
  min-height: 34px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  padding: 0 12px;
  cursor: pointer;
}

button:hover {
  border-color: oklch(0.72 0.05 82);
}

.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px 1fr;
  transition: grid-template-columns 220ms ease;
}

.shell.is-collapsed {
  grid-template-columns: 0 1fr;
}

.sidebar {
  padding: 18px 20px;
  border-right: 1px solid var(--line);
  background: color-mix(in oklch, var(--surface) 82%, var(--gold));
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  transition: opacity 180ms ease, padding 220ms ease;
}

.shell.is-collapsed .sidebar {
  padding: 18px 0;
  opacity: 0;
  pointer-events: none;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  line-height: 1.08;
  font-size: 2.25rem;
  font-weight: 760;
}

.summary {
  margin: -10px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.wallet-box {
  margin-top: auto;
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.wallet-box #wallet {
  display: grid;
}

.wallet-box #wallet button {
  width: 100%;
  justify-content: center;
}

.wallet-status {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--muted);
  word-break: break-all;
}

.workspace {
  padding: 18px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

#sidebar-toggle {
  min-width: 38px;
  font-size: 1.05rem;
  line-height: 1;
}

.map-frame {
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(430px, 72vh, 760px);
  overflow: hidden;
  border: 1px solid oklch(0.32 0.03 220);
  border-radius: 12px;
  background:
    radial-gradient(120% 90% at 50% 18%, oklch(0.27 0.05 200 / 0.55), transparent 60%),
    radial-gradient(140% 120% at 50% 110%, oklch(0.12 0.03 260), oklch(0.06 0.02 250));
  box-shadow:
    inset 0 0 60px oklch(0.45 0.09 200 / 0.18),
    inset 0 0 0 1px oklch(0.5 0.08 200 / 0.12),
    0 24px 60px oklch(0.05 0.02 250 / 0.45);
}

.map-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 120px oklch(0.04 0.02 250 / 0.7);
}

.world-3d {
  width: 100%;
  height: 100%;
}

.world-3d canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.world-3d.is-dragging canvas {
  cursor: grabbing;
}

@media (max-width: 860px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .shell.is-collapsed {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .shell.is-collapsed .sidebar {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles.css
git commit -m "feat: add trimmed styles with collapsible sidebar"
```

---

## Task 7: Verify the full build and page

**Files:** none (verification only)

- [ ] **Step 1: Run the test suite**

Run: `npm test`
Expected: `format.test.ts` passes (2 tests), no failures.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: completes; `dist/` produced with no TypeScript or Vite errors.

- [ ] **Step 4: Manual dev-server verification**

Run: `npm run dev` and open `http://localhost:1420`.
Expected:
- Two-column layout: warm sidebar on the left, dark 3D frame on the right.
- A glowing golden icosahedron rotates and bobs; particles drift upward; the
  camera slowly auto-orbits and responds to click-drag.
- Clicking `☰` collapses/expands the sidebar with a smooth transition; the state
  survives a page reload.
- The "Connect Sui Wallet" button appears; connecting updates the status line to
  `Connected · 0x…` and disconnecting returns it to "Not connected".

- [ ] **Step 5: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "chore: verify build and page"
```

---

## Self-Review Notes

- **Spec coverage:** toolchain (Task 1), `shortAddress` + test (Task 2), wallet island (Task 3), trimmed `PolliusScene` with orb/particles/sky/lighting/orbit+drag/dispose (Task 4), shell + mounts + collapsible sidebar with localStorage (Task 5), trimmed CSS incl. collapse + media queries (Task 6), verification (Task 7). All spec sections map to a task.
- **English tagline:** "A living world you grow, then let go." (Task 5) replaces the original Japanese.
- **Naming consistency:** class `PolliusScene` with `start()`/`destroy()`; helpers `shortAddress`, `mountWallet`, `makeGlowSprite`, `makeGlowTexture`, `makeSkyTexture`; storage key `pollius:sidebar`; collapse class `is-collapsed` — used identically across `main.ts`, `scene3d.ts`, and `styles.css`.
- **Version note:** the `@mysten/sui/jsonRpc` import mirrors `pollius_oss`; if the installed version exposes the fullnode-URL helper elsewhere, adjust the import per Task 3 Step 2 — no other change needed.
